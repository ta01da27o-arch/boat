// app.js — AI学習エンジン連携版（完全版）

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

/* データ読み込み */
async function loadData(force = false) {
  try {
    const q = force ? `?t=${Date.now()}` : "";
    const [pRes, hRes, csvRes] = await Promise.all([
      fetch(DATA_URL + q),
      fetch(HISTORY_URL + q),
      fetch(PREDICTIONS_URL + q)
    ]);
    ALL_PROGRAMS = await pRes.json();
    try { HISTORY = await hRes.json(); } catch { HISTORY = {}; }
    const text = await csvRes.text();
    PREDICTIONS = parseCSV(text);

    dateLabel.textContent = formatToDisplay(new Date());
    await learnFromResults(HISTORY); // 結果データから学習
    renderVenues();
  } catch (e) {
    venuesGrid.innerHTML = `<div>データ取得失敗: ${e.message}</div>`;
  }
}

function parseCSV(text) {
  const rows = text.trim().split("\n").map(r => r.split(","));
  const headers = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
}

/* 会場一覧 */
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML = "";
  const targetDate = (CURRENT_MODE === "today")
    ? getIsoDate(new Date())
    : getIsoDate(new Date(Date.now() - 86400000));
  const hasMap = {};
  ALL_PROGRAMS.forEach(p => {
    if (p.race_date === targetDate) hasMap[p.race_stadium_number] = true;
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
  const targetDate = (CURRENT_MODE === "today")
    ? getIsoDate(new Date())
    : getIsoDate(new Date(Date.now() - 86400000));
  const progs = ALL_PROGRAMS.filter(p => p.race_date === targetDate && p.race_stadium_number === venueId);
  const exists = new Set(progs.map(p => +p.race_number));
  for (let no = 1; no <= 12; no++) {
    const btn = document.createElement("button");
    btn.textContent = `${no}R`;
    btn.className = "race-btn";
    if (exists.has(no)) btn.onclick = () => renderRaceDetail(venueId, no);
    else {
      btn.disabled = true;
      btn.classList.add("disabled");
    }
    racesGrid.appendChild(btn);
  }
}

/* 出走表 + AI展開コメント + AI 順位予測 */
async function renderRaceDetail(venueId, raceNo) {
  showScreen("race");
  const targetDate = (CURRENT_MODE === "today")
    ? getIsoDate(new Date())
    : getIsoDate(new Date(Date.now() - 86400000));
  const prog = ALL_PROGRAMS.find(p =>
    p.race_date === targetDate &&
    p.race_stadium_number === venueId &&
    +p.race_number === raceNo
  );
  if (!prog) return;

  raceTitle.textContent = `${VENUE_NAMES[venueId - 1]} ${raceNo}R ${prog.race_title || ""}`;

  // 出走表
  entryTableBody.innerHTML = "";
  const players = (prog.boats || []).map(b => {
    const st = safeNum(b.racer_average_start_timing);
    const local = safeNum(b.racer_local_top_1_percent);
    const motor = safeNum(b.racer_assigned_motor_top_2_percent);
    const course = safeNum(b.racer_assigned_boat_top_2_percent);
    return {
      lane: +b.racer_boat_number,
      name: b.racer_name,
      klass: b.racer_class || "-",
      st,
      local,
      motor,
      course,
      rawScore: (1 / (st || 0.3)) * (motor / 100 || 0.3) * (local / 100 || 0.3) * (course / 100 || 0.3)
    };
  }).sort((a, b) => a.lane - b.lane);

  // 評価マーク付与
  const ranked = [...players].sort((a, b) => b.rawScore - a.rawScore);
  ranked.forEach((p, i) => {
    p.mark = (i === 0 ? "◎" : i === 1 ? "○" : i === 2 ? "▲" : "✕");
  });

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
      <td>${p.local != null ? Math.round(p.local) + "%" : "-"}</td>
      <td>${p.motor != null ? Math.round(p.motor) + "%" : "-"}</td>
      <td>${p.course != null ? Math.round(p.course) + "%" : "-"}</td>
      <td class="eval-mark">${p.mark}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  // AI学習エンジンを用いたコメント＆順位予測生成
  const aiPred = await generateAIPredictions(players);
  const aiComments = await generateAIComments(players, aiPred);

  // AI買い目予想（本命・穴）
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  const mainList = aiPred.main.slice(0, 5);
  const subList = aiPred.sub.slice(0, 5);
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
  aiPred.ranks.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score.toFixed(2)}</td>`;
    rankingTableBody.appendChild(tr);
  });
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
todayBtn.onclick = () => { CURRENT_MODE = "today"; renderVenues(); };
yesterdayBtn.onclick = () => { CURRENT_MODE = "yesterday"; renderVenues(); };
refreshBtn.onclick = () => loadData(true);
backToVenuesBtn.onclick = () => showScreen("venues");
backToRacesBtn.onclick = () => showScreen("races");

/* 起動 */
loadData();