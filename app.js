// app.js — AI学習エンジン連携＋AI解析(analyzeRace)統合版

import { generateAIComments, generateAIPredictions, learnFromResults, analyzeRace } from './ai_engine.js';

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

/* 階級取得 */
function formatKlass(b) {
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

/* 勝率フォーマット */
function formatRateRaw(v) {
  if (v == null || v === "" || isNaN(Number(v))) return null;
  const n = Number(v);
  if (n <= 1) return Math.round(n * 100);
  if (n <= 10) return Math.round(n * 10);
  if (n <= 100) return Math.round(n);
  return Math.round(n);
}

/* データ読み込み */
async function loadData(force = false) {
  try {
    logStatus("データ取得中...");
    const q = force ? `?t=${Date.now()}` : "";

    const fetchJsonSafe = async (url) => {
      try {
        const res = await fetch(url + q);
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    };

    const fetchTextSafe = async (url) => {
      try {
        const res = await fetch(url + q);
        if (!res.ok) return null;
        return await res.text();
      } catch { return null; }
    };

    const pData = await fetchJsonSafe(DATA_URL);
    const hData = await fetchJsonSafe(HISTORY_URL);
    const csvText = await fetchTextSafe(PREDICTIONS_URL);

    ALL_PROGRAMS = Array.isArray(pData) ? pData : (typeof pData === "object" ? Object.values(pData).flat() : []);
    HISTORY = hData || {};
    PREDICTIONS = csvText ? parseCSV(csvText) : [];

    dateLabel.textContent = formatToDisplay(new Date());

    await learnFromResults(HISTORY);
    renderVenues();
    logStatus("準備完了");
  } catch (e) {
    console.error(e);
    logStatus("データ処理失敗");
  }
}

function parseCSV(text) {
  if (!text || !text.trim()) return [];
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const cols = line.split(",");
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i]);
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
    const d = p.race_date || p.date;
    const stadium = p.race_stadium_number || p.jcd || p.venue_id;
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
  const progs = ALL_PROGRAMS.filter(p => (p.race_date || p.date) === targetDate && (p.race_stadium_number || p.jcd || p.venue_id) === venueId);
  const exists = new Set(progs.map(p => +p.race_number || +p.race_no));
  for (let no = 1; no <= 12; no++) {
    const btn = document.createElement("button");
    btn.textContent = `${no}R`;
    btn.className = "race-btn";
    if (exists.has(no)) btn.onclick = () => renderRaceDetail(venueId, no);
    else { btn.disabled = true; btn.classList.add("disabled"); }
    racesGrid.appendChild(btn);
  }
}

/* 出走表＋AI予測＋AI解析(analyzeRace) */
async function renderRaceDetail(venueId, raceNo) {
  showScreen("race");
  const targetDate = (CURRENT_MODE === "today") ? getIsoDate(new Date()) : getIsoDate(new Date(Date.now() - 86400000));

  const prog = ALL_PROGRAMS.find(p =>
    (p.race_date || p.date) === targetDate &&
    (p.race_stadium_number || p.jcd || p.venue_id) === venueId &&
    (+p.race_number || +p.race_no) === raceNo
  );

  if (!prog) return;

  raceTitle.textContent = `${VENUE_NAMES[venueId - 1]} ${raceNo}R ${prog.race_title || ""}`;
  const boats = prog.boats || prog.entries || [];
  const players = boats.map(b => ({
    lane: +b.racer_boat_number || +b.boat_no || 0,
    name: b.racer_name || b.name || "-",
    klass: formatKlass(b),
    st: safeNum(b.racer_average_start_timing || b.start_timing),
    local: formatRateRaw(b.local_win_rate),
    motor: formatRateRaw(b.motor_win_rate),
    course: formatRateRaw(b.course_win_rate)
  }));

  // --- 出走表表示 ---
  entryTableBody.innerHTML = "";
  players.forEach(p => {
    entryTableBody.innerHTML += `
      <tr>
        <td>${p.lane}</td>
        <td><div class="klass">${p.klass}</div><div class="name">${p.name}</div><div class="st">ST:${p.st ?? "-"}</div></td>
        <td>${p.local ?? "-"}</td>
        <td>${p.motor ?? "-"}</td>
        <td>${p.course ?? "-"}</td>
      </tr>`;
  });

  try {
    logStatus("AI解析実行中...");
    const ai = await analyzeRace(players);

    // AI買い目
    renderPrediction("aiMain", ai.main);
    renderPrediction("aiSub", ai.sub);

    // 展開コメント
    renderComments(ai.comments);

    // 順位予測
    renderRanking(ai.ranks);

    logStatus("AI解析完了");
  } catch (e) {
    logStatus("AI解析エラー: " + e.message);
  }
}

/* 表示補助 */
function renderPrediction(id, data) {
  const tbody = document.querySelector(`#${id} tbody`);
  tbody.innerHTML = data?.length
    ? data.map(x => `<tr><td>${x.combo}</td><td>${x.prob}%</td></tr>`).join("")
    : `<tr><td colspan="2">データなし</td></tr>`;
}
function renderComments(data) {
  commentTableBody.innerHTML = data?.length
    ? data.map(c => `<tr><td>${c.lane}</td><td>${c.comment}</td></tr>`).join("")
    : `<tr><td colspan="2">データなし</td></tr>`;
}
function renderRanking(data) {
  rankingTableBody.innerHTML = data?.length
    ? data.map(r => `<tr><td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score?.toFixed(2) ?? "-"}</td></tr>`).join("")
    : `<tr><td colspan="4">データなし</td></tr>`;
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

/* イベント */
todayBtn.onclick = () => { CURRENT_MODE = "today"; todayBtn.classList.add("active"); yesterdayBtn.classList.remove("active"); renderVenues(); };
yesterdayBtn.onclick = () => { CURRENT_MODE = "yesterday"; yesterdayBtn.classList.add("active"); todayBtn.classList.remove("active"); renderVenues(); };
refreshBtn.onclick = () => loadData(true);
backToVenuesBtn.onclick = () => showScreen("venues");
backToRacesBtn.onclick = () => showScreen("races");

/* 起動 */
loadData();

window.addEventListener("error", ev => logStatus("エラー発生: " + (ev.error?.message || ev.message)));