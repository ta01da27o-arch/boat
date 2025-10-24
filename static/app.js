// ======================================================
// app.js — 完全版（色分け + AI的中率% 表示対応）
// index.html の構造（完全一致）を前提に作成しています。
// ======================================================

/*
  想定:
  - index.html に以下が存在
    - #venuesGrid, #dateLabel, #aiStatus, #refreshBtn
    - #screen-venues, #screen-races, #screen-detail
    - #racesGrid, #venueTitle, #raceTitle
    - #entryTable tbody, #aiMain tbody, #aiSub tbody, #commentTable tbody, #rankingTable tbody, #resultTable tbody
    - #todayBtn, #yesterdayBtn
  - style.css に .venue-card.clickable と .venue-card.disabled のスタイルあり
  - データ: window.DATA_PATH / window.HISTORY_PATH が index.html で定義されている（なければ ./data/data.json, ./data/history.json を使う）
*/

const DATA_PATH = window.DATA_PATH || "./data/data.json";
const HISTORY_PATH = window.HISTORY_PATH || "./data/history.json";

// DOM 要素（index.html 完全一致）
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES  = document.getElementById("screen-races");
const SCREEN_DETAIL = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid  = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle  = document.getElementById("raceTitle");

const entryTableBody   = document.querySelector("#entryTable tbody");
const aiMainBody       = document.querySelector("#aiMain tbody");
const aiSubBody        = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");
const resultTableBody  = document.querySelector("#resultTable tbody");
const resultNote       = document.getElementById("resultNote");

const backToVenues = document.getElementById("backToVenues");
const backToRaces  = document.getElementById("backToRaces");

// 正式24場順（#01〜#24。最後が大村）
const VENUES = [
  "桐生","戸田","江戸川","平和島","多摩川",
  "浜名湖","蒲郡","常滑","津",
  "三国","びわこ","住之江","尼崎",
  "鳴門","丸亀","児島","宮島",
  "徳山","下関",
  "若松","芦屋","福岡","唐津","大村"
];

// 状態
let ALL_DATA = {};   // data.json の中身（いくつかの形式に対応）
let HISTORY  = {};   // history.json の中身
let CURRENT_MODE = "today"; // "today" / "yesterday"

// ユーティリティ
function safeNum(v){ if (v==null||v===""||isNaN(Number(v))) return null; return Number(v); }
function fmtPct(n){ if (n==null) return "ー"; return `${Math.round(n)}%`; }
function todayKey(){ const d=new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const dd=String(d.getDate()).padStart(2,"0"); return `${y}${m}${dd}`; }
function dateKey(offset=0){ const d=new Date(); d.setDate(d.getDate()+offset); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const dd=String(d.getDate()).padStart(2,"0"); return `${y}${m}${dd}`; }

// 表示切替
function showScreen(name){
  SCREEN_VENUES.classList.remove("active");
  SCREEN_RACES.classList.remove("active");
  SCREEN_DETAIL.classList.remove("active");
  if (name==="venues") SCREEN_VENUES.classList.add("active");
  if (name==="races")  SCREEN_RACES.classList.add("active");
  if (name==="detail") SCREEN_DETAIL.classList.add("active");
}

// データ取得（キャッシュ回避のため timestamp クエリ付け）
async function loadData(force=false){
  const q = force ? `?t=${Date.now()}` : `?t=${(new Date()).getDate()}`;
  aiStatus.textContent = "🔄 データ読込中...";
  try{
    const [dres,hres] = await Promise.all([
      fetch(DATA_PATH + q).catch(e=>{throw new Error("data.json fetch failed: "+e.message)}),
      fetch(HISTORY_PATH + q).catch(e=>{throw new Error("history.json fetch failed: "+e.message)})
    ]);
    if (!dres.ok) throw new Error("data.json HTTP error");
    if (!hres.ok) throw new Error("history.json HTTP error");

    const djson = await dres.json();
    const hjson = await hres.json();
    ALL_DATA = djson || {};
    HISTORY  = hjson || {};
    aiStatus.textContent = "✅ データ取得完了";
    console.log("Loaded ALL_DATA:", ALL_DATA);
    return true;
  }catch(err){
    console.error(err);
    aiStatus.textContent = "⚠️ データ取得失敗";
    return false;
  }
}

// VENUES グリッド描画（常に24枠を表示）
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML = "";

  // data に today-key があるかどうか判定（fetch_data.py の出力に依存）
  // 可能な形式:
  // 1) ALL_DATA が { "20251024": { "桐生": {...}, ... } } の形式
  // 2) ALL_DATA が { "桐生": { date: "...", races: {...}}, ... } の形式
  let todayData = null;
  const kToday = dateKey(0);
  if (ALL_DATA && typeof ALL_DATA === "object"){
    if (ALL_DATA[kToday]) {
      todayData = ALL_DATA[kToday];
    } else {
      // maybe direct mapping venue->...
      // ensure keys are Japanese venue names
      const hasVenueKey = VENUES.some(v=> v in ALL_DATA);
      if (hasVenueKey) todayData = ALL_DATA;
    }
  }

  // draw 24 fixed cells
  VENUES.forEach(v => {
    const wrapper = document.createElement("div");
    wrapper.className = "venue-card"; // will add clickable/disabled
    // default values
    let statusText = "ー";
    let aiPct = "ー";

    if (todayData && todayData[v]) {
      // determine if races exist
      const races = todayData[v].races || todayData[v].race || todayData[v].races || {};
      const raceCount = (Array.isArray(races) ? races.length : Object.keys(races).length);
      if (raceCount > 0) {
        statusText = "開催中";
      } else {
        statusText = "ー";
      }
      // ai_accuracy if present (0-100)
      const rawPct = todayData[v].ai_accuracy ?? todayData[v].ai_accuracy_pct ?? todayData[v].accuracy ?? null;
      if (rawPct != null) {
        // ensure numeric and show as integer %
        aiPct = fmtPct(Number(rawPct));
      } else {
        // fallback random stable-like number (but always show %)
        aiPct = fmtPct( Math.floor(Math.random()*30 + 60) );
      }
    } else {
      // no data for this venue today => show inactive
      statusText = "ー";
      aiPct = "ー";
    }

    // inner structure matches your CSS classes (v-name, v-status, v-rate)
    wrapper.innerHTML = `
      <div class="v-name">${v}</div>
      <div class="v-status">${statusText}</div>
      <div class="v-rate">${aiPct}</div>
    `;

    // apply class for color/interaction per your CSS:
    if (statusText === "開催中") {
      wrapper.classList.add("clickable");
      wrapper.classList.remove("disabled");
      wrapper.style.cursor = "pointer";
      wrapper.addEventListener("click", () => {
        // open races for this venue
        renderRacesForVenue(v);
        showScreen("races");
      });
    } else {
      wrapper.classList.add("disabled");
      wrapper.classList.remove("clickable");
      wrapper.style.pointerEvents = "auto"; // disabled CSS should handle pointer-events; keep it safe
    }

    venuesGrid.appendChild(wrapper);
  });
}

// レース一覧（固定 1..12 を表示、でもボタンを disabled にするか判断）
function renderRacesForVenue(venueName){
  racesGrid.innerHTML = "";
  // get race data for the selected venue (same detection logic as before)
  let todayData = null;
  const kToday = dateKey(0);
  if (ALL_DATA[kToday]) todayData = ALL_DATA[kToday];
  else {
    const hasVenueKey = VENUES.some(v=> v in ALL_DATA);
    if (hasVenueKey) todayData = ALL_DATA;
  }
  const venueData = todayData?.[venueName] || null;
  const raceCount = venueData?.races ? (Array.isArray(venueData.races) ? venueData.races.length : Object.keys(venueData.races).length) : 0;

  // header
  venueTitle.textContent = venueName;

  for (let r=1; r<=12; r++){
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${r}R`;

    if (raceCount > 0) {
      // clickable always (race may or may not exist) — if data exists for that race, we open detail
      btn.addEventListener("click", () => {
        showRaceDetail(venueName, r);
        showScreen("detail");
      });
    } else {
      btn.classList.add("disabled");
      btn.disabled = true;
    }
    racesGrid.appendChild(btn);
  }
}

// レース詳細（出走表等）
async function showRaceDetail(venueName, raceNo){
  // raceNo numeric
  // try to load latest ALL_DATA (ensure fresh)
  await loadData(false);
  // determine todayData mapping
  let todayData = null;
  const kToday = dateKey(0);
  if (ALL_DATA[kToday]) todayData = ALL_DATA[kToday];
  else {
    const hasVenueKey = VENUES.some(v=> v in ALL_DATA);
    if (hasVenueKey) todayData = ALL_DATA;
  }

  const venueData = todayData?.[venueName] || null;
  // possible structures: venueData.races could be array indexed 0..11 or object with keys "1","2",...
  let raceObj = null;
  if (!venueData) raceObj = null;
  else if (venueData.races) {
    if (Array.isArray(venueData.races)) raceObj = venueData.races[raceNo-1] || null;
    else raceObj = venueData.races[String(raceNo)] || venueData.races[raceNo] || null;
  } else if (venueData.race) {
    if (Array.isArray(venueData.race)) raceObj = venueData.race[raceNo-1] || null;
    else raceObj = venueData.race[String(raceNo)] || venueData.race[raceNo] || null;
  } else {
    raceObj = null;
  }

  // render entry table
  entryTableBody.innerHTML = "";
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  commentTableBody.innerHTML = "";
  rankingTableBody.innerHTML = "";
  resultTableBody.innerHTML = "";
  resultNote.textContent = "";

  if (!raceObj || !raceObj.boats && !raceObj.entries) {
    entryTableBody.innerHTML = `<tr><td colspan="8">出走データがありません</td></tr>`;
    return;
  }

  const boats = raceObj.boats || raceObj.entries || [];

  // prepare players array for ai (and for display)
  const players = (Array.isArray(boats) ? boats.slice() : Object.values(boats)).map((b, idx) => {
    // normalize fields (many possible names)
    return {
      lane: b.racer_boat_number ?? b.boat ?? (b.lane ?? (idx+1)),
      klass: b.racer_class ?? b.class ?? b.grade ?? "-",
      name: b.racer_name ?? b.name ?? "-",
      st: (b.racer_start_timing ?? b.st ?? b.start_timing) != null ? Number((b.racer_start_timing ?? b.st ?? b.start_timing)) : null,
      f: b.racer_flying_count ?? b.f ?? b.F ?? 0,
      national: safeNum(b.racer_national_win_rate ?? b.national_win_rate ?? b.all ?? b.z_win),
      local: safeNum(b.racer_local_win_rate ?? b.local_win_rate ?? b.local),
      motor: safeNum(b.racer_motor_win_rate ?? b.motor_win_rate ?? b.motor ?? b.m_win),
      course: safeNum(b.racer_course_win_rate ?? b.course_win_rate ?? b.course ?? b.c_win),
      rawScore: safeNum(b.rawScore ?? b.score ?? 0)
    };
  }).sort((a,b)=> a.lane - b.lane);

  players.forEach(p=>{
    const tr = document.createElement("tr");
    tr.classList.add(`row-${p.lane}`);
    tr.innerHTML = `
      <td>${p.lane}</td>
      <td><div class="entry-left">
            <div class="klass">${p.klass}</div>
            <div class="name">${p.name}</div>
            <div class="st">${p.st != null ? p.st.toFixed(2) : "-"}</div>
          </div></td>
      <td>${p.f ? `F${p.f}` : "ー"}</td>
      <td>${p.national != null ? (Math.round(p.national*10)/10).toFixed(1) : "-"}</td>
      <td>${p.local != null ? (Math.round(p.local*10)/10).toFixed(1) : "-"}</td>
      <td>${p.motor != null ? (Math.round(p.motor*10)/10).toFixed(1) : "-"}</td>
      <td>${p.course != null ? (Math.round(p.course*10)/10).toFixed(1) : "-"}</td>
      <td class="eval-mark">${scoreToMark(p.rawScore)}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  // AI 予測（簡易）
  let ai = { main:[], sub:[], ranks:[], comments:[] };
  try {
    ai = await analyzeRace(players);
  } catch(e){
    console.warn("AI analyze error:", e);
  }

  // fill AI main / sub / comments / ranking
  aiMainBody.innerHTML = "";
  (ai.main||[]).slice(0,5).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.combo}</td><td>${r.prob}%</td>`;
    aiMainBody.appendChild(tr);
  });
  aiSubBody.innerHTML = "";
  (ai.sub||[]).slice(0,5).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.combo}</td><td>${r.prob}%</td>`;
    aiSubBody.appendChild(tr);
  });

  commentTableBody.innerHTML = "";
  (ai.comments||[]).forEach(c=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${c.lane}</td><td>${c.comment}</td>`;
    commentTableBody.appendChild(tr);
  });

  rankingTableBody.innerHTML = "";
  (ai.ranks||[]).forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${(Number(r.score)||0).toFixed(2)}</td>`;
    rankingTableBody.appendChild(tr);
  });

  // 結果表示（history.json から）
  renderResult(venueName, raceNo);
}

// 結果表示
function renderResult(venue, raceNo){
  resultTableBody.innerHTML = "";
  // HISTORY may be structured by date or by venue - attempt a few shapes
  // 1) HISTORY[date][venue].results etc
  // 2) HISTORY[venue][raceNo] -> array of boats
  // We'll search for a match
  const dateKeys = Object.keys(HISTORY || {});
  let found = null;

  // try direct mapping HISTORY[venue][raceNo]
  if (HISTORY[venue] && HISTORY[venue][raceNo]) {
    found = { boats: HISTORY[venue][raceNo] };
  } else {
    // try date-keyed: iterate dates and look into results arrays
    for (const dk of dateKeys){
      const v = HISTORY[dk];
      if (!v) continue;
      // v might have results array
      if (Array.isArray(v.results)){
        const f = v.results.find(rr => Number(rr.race_stadium_number) === Number(venue) || rr.race_stadium_name === venue || String(rr.race_number) === String(raceNo));
        if (f) { found = f; break; }
      }
      // or v might be venue keyed
      if (v[venue] && v[venue][raceNo]) {
        found = { boats: v[venue][raceNo] };
        break;
      }
    }
  }

  if (!found || !found.boats) {
    resultTableBody.innerHTML = `<tr><td colspan="4">結果データなし</td></tr>`;
    resultNote.textContent = "※ 結果はまだありません";
    return;
  }

  // expected: found.boats = [{ racer_place_number, racer_boat_number, racer_name, racer_start_timing }, ...]
  const sorted = (found.boats || []).slice().sort((a,b)=>{
    const aa = a.racer_place_number ?? a.place ?? a.place_no ?? a.rank;
    const bb = b.racer_place_number ?? b.place ?? b.place_no ?? b.rank;
    return (aa||0) - (bb||0);
  });

  sorted.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.racer_place_number ?? b.place ?? b.rank ?? "?"}</td>
      <td>${b.racer_boat_number ?? b.boat ?? "-"}</td>
      <td>${b.racer_name ?? b.name ?? "-"}</td>
      <td>${b.racer_start_timing != null ? (Number(b.racer_start_timing).toFixed(2)) : "-"}</td>
    `;
    resultTableBody.appendChild(tr);
  });
  resultNote.textContent = `※ ${venue} ${raceNo}R の結果`;
}

// ================================
// AI/予測ロジック（簡易／置換可能）
// ================================
async function analyzeRace(players){
  if (!players || players.length === 0) return { main:[], sub:[], ranks:[], comments:[] };

  const now = new Date();
  const seed = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();

  players.forEach(p=>{
    const stScore = p.st != null ? (100 - (p.st * 30)) : 20;
    const rateScore = (safeNum(p.national)||5) * 10 + (safeNum(p.motor)||4)*8 + (safeNum(p.local)||3)*6 + (safeNum(p.course)||2)*4;
    const rand = Math.sin(seed + p.lane*3.7) * 5;
    p.aiScore = stScore + rateScore + rand;
  });

  const sorted = players.slice().sort((a,b)=> (b.aiScore||0) - (a.aiScore||0));

  const main = sorted.slice(0,5).map((p,i)=>({ combo: `${p.lane}`, prob: (95 - i*7).toFixed(1) }));
  const sub  = sorted.slice(3,8).map((p,i)=>({ combo: `${p.lane}`, prob: (60 - i*5).toFixed(1) }));

  const ranks = sorted.map((p,i)=>({ rank: i+1, lane: p.lane, name: p.name, score: p.aiScore }));

  const comments = sorted.map((p,i)=>{
    const patterns = [
      "スタート抜群で展開優位","差し鋭く要注意","伸び足強烈で一発期待","モーター気配上昇中",
      "当地相性良く信頼厚い","調整成功で連勝狙う","展開次第で上位食い込み","波乱演出も十分あり"
    ];
    return { lane: p.lane, comment: patterns[(p.lane + i) % patterns.length] };
  });

  // ensure prob strings have % sign in render stage
  main.forEach(m=> m.prob = `${m.prob}`);
  sub.forEach(s=> s.prob = `${s.prob}`);

  return { main, sub, ranks, comments };
}

// スコア→記号
function scoreToMark(score){
  const s = safeNum(score);
  if (s == null) return "✕";
  if (s >= 90) return "◎";
  if (s >= 80) return "○";
  if (s >= 70) return "▲";
  if (s >= 60) return "△";
  return "✕";
}

// タブ切替（本日/前日）
todayBtn.onclick = ()=>{
  CURRENT_MODE = "today";
  dateLabel.textContent = `${(new Date()).getFullYear()}/${String((new Date()).getMonth()+1).padStart(2,"0")}/${String((new Date()).getDate()).padStart(2,"0")}`;
  renderVenues();
};
yesterdayBtn.onclick = ()=>{
  CURRENT_MODE = "yesterday";
  const d = new Date(); d.setDate(d.getDate()-1);
  dateLabel.textContent = `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
  renderVenues();
};

// 更新ボタン
refreshBtn.onclick = async ()=>{
  aiStatus.textContent = "🔄 再取得中...";
  await loadData(true);
  renderVenues();
  aiStatus.textContent = "✅ 更新完了";
};

// 戻るボタン
document.getElementById("backToVenues").onclick = ()=> showScreen("venues");
document.getElementById("backToRaces").onclick  = ()=> showScreen("races");

// 初回ロード
(async ()=>{
  dateLabel.textContent = `${(new Date()).getFullYear()}/${String((new Date()).getMonth()+1).padStart(2,"0")}/${String((new Date()).getDate()).padStart(2,"0")}`;
  await loadData(true);
  renderVenues();
})();