// app.js — 競艇AI予想フル版
// data.json (出走表) + history.json (過去実績) + predictions.csv (AI予測結果)

const DATA_URL = "./data.json";
const HISTORY_URL = "./history.json";
const PREDICTIONS_URL = "./predictions.csv";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

// DOM取得
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");
const csvTableBody = document.querySelector("#csvTable tbody"); // CSV用

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-detail");
const SCREEN_CSV = document.getElementById("screen-csv"); // CSV画面

const backToVenuesBtn = document.getElementById("backToVenues");
const backToRacesBtn = document.getElementById("backToRaces");
const backToMainBtn = document.getElementById("backToMain"); // CSV画面から戻る

// 状態
let ALL_PROGRAMS = [];
let HISTORY = {};
let CURRENT_MODE = "today";
let CURRENT_VENUE_ID = null;
let CURRENT_RACE_NO = null;

/* --------- util --------- */
function getIsoDate(d) {
  return d.toISOString().slice(0, 10);
}
function formatToDisplay(dstr) {
  try {
    const d = new Date(dstr);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
  } catch {
    return dstr;
  }
}
function showScreen(name) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE, SCREEN_CSV].forEach(s => s.classList.remove("active"));
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  if (name === "races") SCREEN_RACES.classList.add("active");
  if (name === "race") SCREEN_RACE.classList.add("active");
  if (name === "csv") SCREEN_CSV.classList.add("active");
}
function safeNum(v) {
  return (v==null || v==="" || isNaN(Number(v))) ? null : Number(v);
}

/* --------- AIコメント --------- */
const EXTRA_PHRASES = [
  "展開を巧みに生かす狙い目","差し切りの一手あるか","スタートが鍵を握る一戦",
  "機力好調で連軸に期待","立ち回りで頭一つ抜ける可能性あり","終盤の粘りに注目したい",
  "前節から調子上向き、要警戒","波に乗れば台頭十分","展開次第で一発も十分にあり得る",
  "仕上がり良好で主導権を握る期待","地元巧者の面目躍如に期待","展開の隙を突く一手がある"
];
function pickExtraPhrase() {
  return EXTRA_PHRASES[Math.floor(Math.random()*EXTRA_PHRASES.length)];
}
function generateComment(player) {
  const parts = [];
  if (player.st != null) {
    if (player.st <= 0.13) parts.push("鋭いスタートで展開有利");
    else if (player.st <= 0.16) parts.push("STまずまずで立ち回り良好");
    else parts.push("スタートに慎重さが残る");
  }
  if (player.motor != null) {
    if (player.motor >= 50) parts.push("モーター気配上向き");
    else if (player.motor >= 35) parts.push("機力は水準以上");
    else parts.push("モーターはやや力不足の感");
  }
  if (player.local != null) {
    if (player.local >= 60) parts.push("当地巧者の実績");
    else if (player.local >= 40) parts.push("当地で安定した走り");
    else parts.push("当地実績は乏しい");
  }
  if (player.eval === "◎") parts.push("本命視される実力派");
  else if (player.eval === "○") parts.push("上位争いに食い込みやすい");
  else if (player.eval === "△") parts.push("連下でのひと押し期待");
  else if (player.eval === "✕") parts.push("穴で一考の価値あり");

  let text = parts.slice(0,2).concat(pickExtraPhrase()).join("、") + "。";
  return text;
}

/* --------- データ読み込み --------- */
async function loadData(force=false) {
  try {
    const q = force ? `?t=${Date.now()}` : "";
    const [pRes, hRes] = await Promise.all([
      fetch(DATA_URL+q),
      fetch(HISTORY_URL+q)
    ]);
    ALL_PROGRAMS = await pRes.json();
    try { HISTORY = await hRes.json(); } catch { HISTORY = {}; }
    dateLabel.textContent = formatToDisplay(new Date());
    renderVenues();
  } catch (e) {
    venuesGrid.innerHTML = `<div>データ取得失敗: ${e.message}</div>`;
  }
}

/* --------- CSV読み込み --------- */
async function loadCSV() {
  try {
    const response = await fetch(PREDICTIONS_URL + `?t=${Date.now()}`);
    const text = await response.text();
    const rows = text.trim().split("\n").map(r => r.split(","));
    const headers = rows[0];
    const records = rows.slice(1);

    csvTableBody.innerHTML = "";
    records.forEach(r=>{
      const tr=document.createElement("tr");
      r.forEach(c=>{ tr.innerHTML += `<td>${c}</td>`; });
      csvTableBody.appendChild(tr);
    });

    showScreen("csv");
  } catch(e) {
    csvTableBody.innerHTML = `<tr><td colspan="10">CSV読込失敗: ${e.message}</td></tr>`;
    showScreen("csv");
  }
}

/* --------- 会場一覧 --------- */
function renderVenues() {
  showScreen("venues");
  venuesGrid.innerHTML = "";
  const targetDate = (CURRENT_MODE==="today") ? getIsoDate(new Date()) : getIsoDate(new Date(Date.now()-86400000));

  const hasMap = {};
  ALL_PROGRAMS.forEach(p=>{
    if(p.race_date===targetDate) hasMap[p.race_stadium_number] = true;
  });

  VENUE_NAMES.forEach((name, idx)=>{
    const id = idx+1;
    const has = !!hasMap[id];
    const card = document.createElement("div");
    card.className = "venue-card " + (has?"clickable":"disabled");
    card.innerHTML = `<div class="v-name">${name}</div><div class="v-status">${has?"開催中":"ー"}</div><div class="v-rate">${calcHitRateText(id)}</div>`;
    if (has) card.onclick = ()=>renderRaces(id);
    venuesGrid.appendChild(card);
  });
}

/* --------- レース番号一覧 --------- */
function renderRaces(venueId) {
  showScreen("races");
  venueTitle.textContent = VENUE_NAMES[venueId-1];
  racesGrid.innerHTML = "";
  const targetDate = (CURRENT_MODE==="today") ? getIsoDate(new Date()) : getIsoDate(new Date(Date.now()-86400000));
  const progs = ALL_PROGRAMS.filter(p=>p.race_date===targetDate && p.race_stadium_number===venueId);
  const exists = new Set(progs.map(p=>+p.race_number));
  for (let no=1; no<=12; no++) {
    const btn = document.createElement("button");
    btn.textContent = `${no}R`;
    btn.className = "race-btn";
    if (exists.has(no)) btn.onclick = ()=>renderRaceDetail(venueId,no);
    else { btn.disabled = true; btn.classList.add("disabled"); }
    racesGrid.appendChild(btn);
  }
}

/* --------- 出走表 & AI予想 --------- */
function renderRaceDetail(venueId,raceNo) {
  showScreen("race");
  const targetDate = (CURRENT_MODE==="today") ? getIsoDate(new Date()) : getIsoDate(new Date(Date.now()-86400000));
  const prog = ALL_PROGRAMS.find(p=>p.race_date===targetDate && p.race_stadium_number===venueId && +p.race_number===raceNo);
  if (!prog) return;

  raceTitle.textContent = `${VENUE_NAMES[venueId-1]} ${raceNo}R ${prog.race_title||""}`;

  // 出走表
  entryTableBody.innerHTML="";
  const players = (prog.boats||[]).map(b=>{
    const st = safeNum(b.racer_average_start_timing);
    const local = safeNum(b.racer_local_top_1_percent);
    const motor = safeNum(b.racer_assigned_motor_top_2_percent);
    const course = safeNum(b.racer_assigned_boat_top_2_percent);
    return {
      lane: b.racer_boat_number,
      name: b.racer_name,
      klass: b.racer_class||"-",
      st, local, motor, course,
      rawScore: (1/(st||0.3)) * (motor/100||0.3) * (local/100||0.3) * (course/100||0.3)
    };
  }).sort((a,b)=>a.lane-b.lane);

  const ranked = players.slice().sort((a,b)=>b.rawScore-a.rawScore);
  const marks = ["◎","○","△","✕","ー","ー"];
  const evalMap = {}; ranked.forEach((p,i)=>evalMap[p.lane]=marks[i]||"ー");

  players.forEach(p=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${p.lane}</td><td>${p.klass} ${p.name} ST:${p.st||"-"}</td><td>-</td><td>${p.local||"-"}%</td><td>${p.motor||"-"}%</td><td>${p.course||"-"}%</td><td>${evalMap[p.lane]}</td>`;
    entryTableBody.appendChild(tr);
  });

  // AI順位予測
  rankingTableBody.innerHTML="";
  ranked.forEach((p,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${i+1}</td><td>${p.lane}</td><td>${p.name}</td><td>${p.rawScore.toFixed(3)}</td>`;
    rankingTableBody.appendChild(tr);
  });

  // AIコメント
  commentTableBody.innerHTML="";
  players.forEach(p=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${p.lane}</td><td>${generateComment({...p,eval:evalMap[p.lane]})}</td>`;
    commentTableBody.appendChild(tr);
  });

  // AI買い目（簡易：上位3艇）
  const top3 = ranked.slice(0,3).map(p=>p.lane);
  const main=[`${top3[0]}-${top3[1]}-${top3[2]}`,`${top3[0]}-${top3[2]}-${top3[1]}`];
  const sub=[`${top3[1]}-${top3[0]}-${top3[2]}`,`${top3[1]}-${top3[2]}-${top3[0]}`];
  aiMainBody.innerHTML=main.map(b=>`<tr><td>${b}</td><td>--%</td></tr>`).join("");
  aiSubBody.innerHTML=sub.map(b=>`<tr><td>${b}</td><td>--%</td></tr>`).join("");
}

/* --------- 的中率計算 --------- */
function calcHitRateText(venueId) {
  let total=0, hit=0;
  for (const d in HISTORY) {
    (HISTORY[d].results||[]).forEach(r=>{
      if (r.race_stadium_number===venueId) {
        total++;
        const trif = r.payouts?.trifecta?.[0]?.combination;
        const ai = (r.ai_predictions||[]).map(x=>x.combination);
        if (trif && ai.includes(trif)) hit++;
      }
    });
  }
  return total?`的中率 ${Math.round(hit/total*100)}%`:"-";
}

/* --------- イベント --------- */
todayBtn.onclick=()=>{CURRENT_MODE="today";todayBtn.classList.add("active");yesterdayBtn.classList.remove("active");renderVenues();};
yesterdayBtn.onclick=()=>{CURRENT_MODE="yesterday";yesterdayBtn.classList.add("active");todayBtn.classList.remove("active");renderVenues();};
refreshBtn.onclick=()=>loadData(true);
backToVenuesBtn.onclick=()=>showScreen("venues");
backToRacesBtn.onclick=()=>showScreen("races");
backToMainBtn.onclick=()=>showScreen("venues"); // CSV画面から戻る

/* --------- 起動 --------- */
loadData();