// ==========================
// /静的/app.js — 改善版（index.htmlそのまま）
// ==========================

import { analyzeRace, generateAIComments, generateAIPredictions, learnFromResults } from './ai_engine.js';

// index.html の window.DATA_PATH を優先。なければデフォルトを使う
const DATA_URL = window.DATA_PATH || "../data/data.json";
const HISTORY_URL = window.HISTORY_PATH || "../data/history.json";

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

let ALL_DATA = {};
let HISTORY = {};
let CURRENT_MODE = "today";

function showScreen(name) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  document.getElementById(`screen-${name}`).classList.add("active");
}

function logStatus(msg) {
  console.log("[APP]", msg);
  if (aiStatus) aiStatus.textContent = msg;
}

function formatRateDisplay(v) {
  if (v == null || v === "" || isNaN(v)) return "-";
  const n = Number(v);
  let pct;
  if (n <= 1) pct = Math.round(n * 100);
  else if (n <= 10) pct = Math.round(n * 10);
  else pct = Math.round(n);
  return `${pct}%`;
}

async function loadData(force = false) {
  try {
    const cacheBuster = `?v=${Date.now()}`; // キャッシュ無効化
    logStatus("データ取得中...");
    const res = await fetch(DATA_URL + (force ? cacheBuster : ""));
    if (!res.ok) throw new Error(`data.json取得失敗: ${res.status}`);
    ALL_DATA = await res.json();

    try {
      const h = await fetch(HISTORY_URL + (force ? cacheBuster : ""));
      if (h.ok) HISTORY = await h.json();
    } catch { HISTORY = {}; }

    dateLabel.textContent = new Date().toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit", weekday: "short" });
    renderVenues();
    logStatus("準備完了");
  } catch (e) {
    console.error(e);
    logStatus("データ読み込み失敗");
  }
}

function renderVenues() {
  showScreen("venues");
  venuesGrid.innerHTML = "";

  VENUE_NAMES.forEach(name => {
    const v = ALL_DATA[name];
    const isAvailable = v && v.status && v.status !== "ー" && v.races && Object.keys(v.races).length > 0;

    const card = document.createElement("div");
    card.className = "venue-card";
    if (!isAvailable) card.classList.add("disabled");

    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${v ? (v.status || "ー") : "ー"}</div>
      <div class="v-rate">${v ? `${v.hit_rate ?? 0}%` : "0%"}</div>
    `;
    if (isAvailable) card.onclick = () => renderRaces(name);
    venuesGrid.appendChild(card);
  });
}

function renderRaces(venueName) {
  showScreen("races");
  venueTitle.textContent = venueName;
  racesGrid.innerHTML = "";

  const venue = ALL_DATA[venueName];
  if (!venue || !venue.races) return;

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.className = "race-btn";
    if (venue.races[i]) btn.onclick = () => renderRaceDetail(venueName, i);
    else {
      btn.disabled = true;
      btn.classList.add("disabled");
    }
    racesGrid.appendChild(btn);
  }
}

async function renderRaceDetail(venueName, raceNo) {
  showScreen("race");
  raceTitle.textContent = `${venueName} ${raceNo}R`;

  const race = ALL_DATA[venueName]?.races?.[raceNo];
  if (!race) {
    entryTableBody.innerHTML = `<tr><td colspan="8">データなし</td></tr>`;
    return;
  }

  entryTableBody.innerHTML = "";
  race.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.number}</td>
      <td>${p.grade || "-"}</td>
      <td>${p.name || "-"}</td>
      <td>${p.st ?? "-"}</td>
      <td>${p.all ? formatRateDisplay(p.all) : "-"}</td>
      <td>${p.local ? formatRateDisplay(p.local) : "-"}</td>
      <td>${p.mt ? formatRateDisplay(p.mt) : "-"}</td>
      <td>${p.course ?? "-"}</td>
      <td>${p.eval ?? "-"}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  try {
    logStatus("AI解析中...");
    const ai = await analyzeRace(race);
    aiMainBody.innerHTML = "";
    (ai.main || []).forEach(m => aiMainBody.innerHTML += `<tr><td>${m.combo}</td><td>${m.prob}%</td></tr>`);
    logStatus("AI解析完了");
  } catch (e) {
    console.error(e);
    logStatus("AI解析エラー");
  }
}

// イベント設定
todayBtn.onclick = () => { CURRENT_MODE = "today"; renderVenues(); };
yesterdayBtn.onclick = () => { CURRENT_MODE = "yesterday"; renderVenues(); };
refreshBtn.onclick = () => loadData(true);
backToVenuesBtn.onclick = () => showScreen("venues");
backToRacesBtn.onclick = () => showScreen("races");

// 初期実行
window.addEventListener("load", () => loadData());
window.addEventListener("error", e => {
  console.error(e);
  logStatus("アプリエラー");
});