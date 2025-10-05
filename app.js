// app.js — AI学習エンジン連携版（表示改善：階級表示＋勝率フォーマット）

import { generateAIComments, generateAIPredictions, learnFromResults } from './ai_engine.js';

const DATA_URL = "./data.json";
const HISTORY_URL = "./history.json";
const PREDICTIONS_URL = "./predictions.csv";

const VENUE_NAMES = ["桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"];

const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-detail");
const backToVenuesBtn = document.getElementById("backToVenues");
const backToRacesBtn = document.getElementById("backToRaces");

let ALL_PROGRAMS = [];
let HISTORY = {};
let PREDICTIONS = [];
let CURRENT_MODE = "today";

/* util */
function getIsoDate(d){ return d.toISOString().slice(0,10); }
function formatToDisplay(dstr){
  try {
    return new Date(dstr).toLocaleDateString("ja-JP", {year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"});
  } catch {
    return dstr;
  }
}
function showScreen(name){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if(name === "venues") SCREEN_VENUES.classList.add("active");
  if(name === "races") SCREEN_RACES.classList.add("active");
  if(name === "race") SCREEN_RACE.classList.add("active");
}
function safeNum(v){ return (v == null || v === "" || isNaN(Number(v))) ? null : Number(v); }
function logStatus(msg) { console.log("[APP]", msg); if (aiStatus) aiStatus.textContent = msg; }

/* 階級取得（数値→表示に対応） */
function formatKlass(b) {
  // 優先順にプロパティを読む（多様なデータソースに対応）
  if (b.racer_class) return String(b.racer_class);
  if (b.klass) return String(b.klass);
  if (b.racer_class_number != null) {
    const map = {1: "A1", 2: "A2", 3: "B1", 4: "B2"};
    return map[b.racer_class_number] || String(b.racer_class_number);
  }
  if (b.racer_class_number_text) return String(b.racer_class_number_text);
  if (b.class || b.class_number) return String(b.class || b.class_number);
  return "-";
}

/* 勝率フォーマット
   - 入力例: 7.8 -> 表示 78%
   - 0.78 -> 78%
   - 78 -> 78%
*/
function formatRateRaw(v) {
  if (v == null || v === "" || isNaN(Number(v))) return null;
  const n = Number(v);
  if (n <= 1) return Math.round(n * 100);      // 0.78 -> 78
  if (n <= 10) return Math.round(n * 10);      // 7.8 -> 78
  if (n <= 100) return Math.round(n);          // 78 -> 78
  return Math.round(n);                        // fallback
}

/* データ読み込み（堅牢化） */
async function loadData(force = false) {
  try {
    logStatus("データ取得中...");
    const q = force ? `?t=${Date.now()}` : "";

    const fetchJsonSafe = async (url) => {
      try {
        const res = await fetch(url + q);
        if (!res.ok) { logStatus(`fetch error: ${url} -> ${res.status}`); return null; }
        return await res.json();
      } catch (e) {
        logStatus(`network error: ${url} -> ${e.message}`); return null;
      }
    };

    const fetchTextSafe = async (url) => {
      try {
        const res = await fetch(url + q);
        if (!res.ok) { logStatus(`fetch error: ${url} -> ${res.status}`); return null; }
        return await res.text();
      } catch (e) {
        logStatus(`network error: ${url} -> ${e.message}`); return null;
      }
    };

    const pData = await fetchJsonSafe(DATA_URL);
    const hData = await fetchJsonSafe(HISTORY_URL);
    const csvText = await fetchTextSafe(PREDICTIONS_URL);

    if (pData == null) {
      ALL_PROGRAMS = [];
    } else if (Array.isArray(pData)) {
      ALL_PROGRAMS = pData;
    } else if (typeof pData === "object") {
      const flattened = [];
      Object.values(pData).forEach(v => { if (Array.isArray(v)) flattened.push(...v); else if (typeof v === "object") flattened.push(v); });
      ALL_PROGRAMS = flattened;
    } else {
      ALL_PROGRAMS = [];
    }

    HISTORY = hData || {};

    PREDICTIONS = [];
    if (csvText && csvText.trim()) {
      try { PREDICTIONS = parseCSV(csvText); }
      catch (e) { logStatus("predictions.csv parse error: " + e.message); PREDICTIONS = []; }
    } else {
      logStatus("predictions.csv が見つからないか空です。");
    }

    dateLabel.textContent = formatToDisplay(new Date());

    try {
      logStatus("AI 学習処理を実行中...");
      await learnFromResults(HISTORY);
      logStatus("AI 学習完了");
    } catch (e) {
      logStatus("AI 学習エラー: " + e.message);
    }

    renderVenues();
    logStatus("準備完了");
  } catch (e) {
    console.error(e);
    venuesGrid.innerHTML = `<div>データ処理失敗: ${e.message}</div>`;
    logStatus("データ処理失敗");
  }
}

function parseCSV(text) {
  if (!text || !text.trim()) return [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(",");
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] !== undefined ? cols[i] : "");
    return obj;
  });
}

/* 会場一覧 */
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML = "";
  const targetDate = (CURRENT_MODE === "today") ? getIsoDate(new Date()) : getIsoDate(new Date(Date.now() - 86400000));
  const hasMap = {};
  ALL_PROGRAMS.forEach(p => {
    const d = p.race_date || p.date || null;
    const stadium = p.race_stadium_number || p.jcd || p.venue_id || null;
    if (d === targetDate && stadium) hasMap[stadium] = true;
  });
  VENUE_NAMES.forEach((name, idx) => {
    const id = idx + 1;
    const has = !!hasMap[id];
    const hitText = calcHitRateText(id);
    const card = document.createElement("div");
    card.className = "venue-card " + (has ? "clickable" : "disabled");
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${has ? "開催中" : "ー"}</div>
      <div class="v-rate">${hitText}</div>`;
    if (has) card.onclick = () => renderRaces(id);
    venuesGrid.appendChild(card);
  });
}

/* レース番号一覧 */
function renderRaces(venueId) {
  showScreen("races");
  venueTitle.textContent = VENUE_NAMES[venueId - 1];
  racesGrid.innerHTML = "";
  const targetDate = (CURRENT_MODE === "today") ? getIsoDate(new Date()) : getIsoDate(new Date(Date.now() - 86400000));
  const progs = ALL_PROGRAMS.filter(p => {
    const d = p.race_date || p.date || null;
    const stadium = p.race_stadium_number || p.jcd || p.venue_id || null;
    return d === targetDate && stadium === venueId;
  });
  const exists = new Set(progs.map(p => +p.race_number || +p.race_no || 0));
  for (let no = 1; no <= 12; no++) {
    const btn = document.createElement("button");
    btn.textContent = `${no}R`;
    btn.className = "race-btn";
    if (exists.has(no)) btn.onclick = () => renderRaceDetail(venueId, no);
    else { btn.disabled = true; btn.classList.add("disabled"); }
    racesGrid.appendChild(btn);
  }
}

/* 出走表 + AI展開コメント + AI 順位予測 */
async function renderRaceDetail(venueId, raceNo) {
  showScreen("race");
  const targetDate = (CURRENT_MODE === "today") ? getIsoDate(new Date()) : getIsoDate(new Date(Date.now() - 86400000));

  const prog = ALL_PROGRAMS.find(p => {
    const d = p.race_date || p.date || null;
    const stadium = p.race_stadium_number || p.jcd || p.venue_id || null;
    const rn = +p.race_number || +p.race_no || 0;
    return d === targetDate && stadium === venueId && rn === raceNo;
  });

  if (!prog) {
    entryTableBody.innerHTML = `<tr><td colspan="7">出走データが見つかりません</td></tr>`;
    aiMainBody.innerHTML = `<tr><td colspan="2">データなし</td></tr>`;
    aiSubBody.innerHTML = `<tr><td colspan="2">データなし</td></tr>`;
    commentTableBody.innerHTML = `<tr><td colspan="2">データなし</td></tr>`;
    rankingTableBody.innerHTML = `<tr><td colspan="4">予測データなし</td></tr>`;
    return;
  }

  raceTitle.textContent = `${VENUE_NAMES[venueId - 1]} ${raceNo}R ${prog.race_title || ""}`;

  // 出走表
  entryTableBody.innerHTML = "";
  const boats = prog.boats || prog.entries || prog.participants || [];
  const players = boats.map(b => {
    const st = safeNum(b.racer_average_start_timing || b.racer_start_timing || b.start_timing);
    const localRaw = safeNum(b.racer_local_top_1_percent || b.local_top_1_percent || b.local_win_rate || b.local || b.racer_local_win_rate);
    const motorRaw = safeNum(b.racer_assigned_motor_top_2_percent || b.motor_top_2_percent || b.motor_win_rate || b.motor);
    const courseRaw = safeNum(b.racer_assigned_boat_top_2_percent || b.boat_top_2_percent || b.boat_win_rate || b.course);
    const local = formatRateRaw(localRaw);
    const motor = formatRateRaw(motorRaw);
    const course = formatRateRaw(courseRaw);
    return {
      lane: +b.racer_boat_number || +b.racer_course_number || +b.boat_no || 0,
      name: b.racer_name || b.name || "-",
      klass: formatKlass(b),
      st, local, motor, course,
      rawScore: (1 / (st || 0.3)) * ((motor || 30) / 100) * ((local || 30) / 100) * ((course || 30) / 100)
    };
  }).sort((a, b) => a.lane - b.lane);

  // 評価マーク
  const ranked = [...players].sort((a, b) => b.rawScore - a.rawScore);
  ranked.forEach((p, i) => p.mark = (i === 0 ? "◎" : i === 1 ? "○" : i === 2 ? "▲" : "✕"));

  players.forEach(p => {
    const tr = document.createElement("tr");
    tr.classList.add(`row-${p.lane}`);
    tr.innerHTML = `
      <td>${p.lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${p.klass}</div>
          <div class="name">${p.name}</div>
          <div class="st">ST:${p.st != null ? p.st.toFixed(2) : "-"}</div>
        </div>
      </td>
      <td>-</td>
      <td>${p.local != null ? p.local + "%" : "-"}</td>
      <td>${p.motor != null ? p.motor + "%" : "-"}</td>
      <td>${p.course != null ? p.course + "%" : "-"}</td>
      <td class="eval-mark">${p.mark}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  // AI 学習エンジン呼び出し
  try {
    logStatus("AI 予測生成中...");
    const aiPred = await generateAIPredictions(players);
    const aiComments = await generateAIComments(players, aiPred);

    // AI買い目
    aiMainBody.innerHTML = "";
    aiSubBody.innerHTML = "";
    const mainList = (aiPred.main || []).slice(0, 5);
    const subList = (aiPred.sub || []).slice(0, 5);
    if (mainList.length) mainList.forEach(r => aiMainBody.innerHTML += `<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`);
    else aiMainBody.innerHTML = `<tr><td colspan="2">データなし</td></tr>`;
    if (subList.length) subList.forEach(r => aiSubBody.innerHTML += `<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`);
    else aiSubBody.innerHTML = `<tr><td colspan="2">データなし</td></tr>`;

    // 展開コメント
    commentTableBody.innerHTML = "";
    aiComments.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${c.lane}</td><td>${c.comment}</td>`;
      commentTableBody.appendChild(tr);
    });

    // 順位予測
    rankingTableBody.innerHTML = "";
    (aiPred.ranks || []).forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${(r.score||0).toFixed(2)}</td>`;
      rankingTableBody.appendChild(tr);
    });

    logStatus("AI 予測完了");
  } catch (e) {
    logStatus("AI 予測エラー: " + e.message);
    console.error(e);
  }
}

/* 的中率 */
function calcHitRateText(venueId) {
  let total = 0, hit = 0;
  for (const d in HISTORY) {
    (HISTORY[d].results || []).forEach(r => {
      if (r.race_stadium_number === venueId) {
        total++;
        const trif = r.payouts?.trifecta?.[0]?.combination;
        const ai = (r.ai_predictions || []).map(x => x.combination);
        if (trif && ai.includes(trif)) hit++;
      }
    });
  }
  return total ? `${Math.round(hit / total * 100)}%` : "0%";
}

/* イベント設定 */
todayBtn.onclick = () => { CURRENT_MODE = "today"; todayBtn.classList.add("active"); yesterdayBtn.classList.remove("active"); renderVenues(); };
yesterdayBtn.onclick = () => { CURRENT_MODE = "yesterday"; yesterdayBtn.classList.add("active"); todayBtn.classList.remove("active"); renderVenues(); };
refreshBtn.onclick = () => loadData(true);
backToVenuesBtn.onclick = () => showScreen("venues");
backToRacesBtn.onclick = () => showScreen("races");

/* 起動 */
loadData();

// グローバルエラーハンドラ（画面通知用）
window.addEventListener("error", (ev) => {
  console.error("Unhandled error:", ev.error || ev.message);
  logStatus("ページエラー発生。コンソール確認");
});