// ==============================
// 競艇AI予想アプリ app.js（完全統合版）
// ==============================

// DOM取得
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");

const raceTitle = document.getElementById("raceTitle");
const venueTitle = document.getElementById("venueTitle");

const resultTable = document.getElementById("resultTable")?.querySelector("tbody");
const resultNote = document.getElementById("resultNote");

// ------------------------------
// グローバル変数
// ------------------------------
let allData = {};        // data.json（出走表）
let historyData = {};    // history.json（結果）
let currentVenue = null;
let currentDateType = "today"; // "today" or "yesterday"

// ------------------------------
// ユーティリティ関数群
// ------------------------------
function formatRateDisplay(value) {
  if (!value) return "-";
  const num = parseFloat(value);
  return Math.round(num * 10) + "%";
}

function formatFDisplay(count) {
  if (!count || count === 0) return "ー";
  return `F${count}`;
}

function scoreToMark(score) {
  if (score >= 90) return "◎";
  if (score >= 80) return "○";
  if (score >= 70) return "▲";
  if (score >= 60) return "△";
  return "✕";
}

function getJPDate(offset = 0) {
  const now = new Date();
  now.setHours(now.getHours() + 9 + offset * 24);
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDateKey(offset = 0) {
  const now = new Date();
  now.setHours(now.getHours() + 9 + offset * 24);
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function setActiveTab(type) {
  currentDateType = type;
  todayBtn.classList.toggle("active", type === "today");
  yesterdayBtn.classList.toggle("active", type === "yesterday");

  const jpDate = type === "today" ? getJPDate(0) : getJPDate(-1);
  dateLabel.textContent = jpDate;

  loadAndRender();
}

// ------------------------------
// データ読み込み
// ------------------------------
async function loadData() {
  const res = await fetch("data.json?time=" + Date.now());
  allData = await res.json();
}

async function loadHistory() {
  const res = await fetch("history.json?time=" + Date.now());
  historyData = await res.json();
}

// ------------------------------
// 表示制御
// ------------------------------
function showScreen(target) {
  [screenVenues, screenRaces, screenDetail].forEach(s => s.classList.remove("active"));
  target.classList.add("active");
}

// ------------------------------
// 24場一覧表示
// ------------------------------
function renderVenues() {
  venuesGrid.innerHTML = "";
  const dateKey = getDateKey(currentDateType === "today" ? 0 : -1);
  const todayData = allData[dateKey];

  if (!todayData) {
    venuesGrid.innerHTML = `<p>データがありません (${dateKey})</p>`;
    return;
  }

  const venues = Object.keys(todayData);
  venues.forEach(v => {
    const btn = document.createElement("button");
    btn.className = "venue-btn";
    btn.textContent = v;
    btn.onclick = () => {
      currentVenue = v;
      renderRaces(v);
      showScreen(screenRaces);
    };
    venuesGrid.appendChild(btn);
  });
}

// ------------------------------
// レース番号一覧表示
// ------------------------------
function renderRaces(venue) {
  racesGrid.innerHTML = "";
  venueTitle.textContent = `${venue} のレース一覧`;
  const dateKey = getDateKey(currentDateType === "today" ? 0 : -1);
  const races = allData[dateKey]?.[venue];

  if (!races) {
    racesGrid.innerHTML = "<p>データなし</p>";
    return;
  }

  races.forEach((race, i) => {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i + 1}R`;
    btn.onclick = () => renderEntryTable(venue, i + 1);
    racesGrid.appendChild(btn);
  });
}

// ------------------------------
// 出走表表示
// ------------------------------
function renderEntryTable(venue, raceNum) {
  const dateKey = getDateKey(currentDateType === "today" ? 0 : -1);
  const race = allData[dateKey]?.[venue]?.[raceNum - 1];
  if (!race) return;

  raceTitle.textContent = `${venue} ${raceNum}R 出走表`;
  entryTable.innerHTML = "";

  race.entry.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="boat-${b.boat_number}">${b.boat_number}</td>
      <td>
        <div>${b.class || "-"}</div>
        <div>${b.name || "-"}</div>
        <div>ST:${b.st ?? "-"}</div>
      </td>
      <td>${formatFDisplay(b.f_count)}</td>
      <td>${formatRateDisplay(b.rate_all)}</td>
      <td>${formatRateDisplay(b.rate_local)}</td>
      <td>${formatRateDisplay(b.rate_motor)}</td>
      <td>${formatRateDisplay(b.rate_course)}</td>
      <td>${scoreToMark(b.ai_score)}</td>
    `;
    entryTable.appendChild(tr);
  });

  renderRanking(race.ai_rank || []);
  renderComments(race.comments || []);
  renderResultTable(venue, raceNum);

  showScreen(screenDetail);
}
// ------------------------------
// AI順位予測表示
// ------------------------------
function renderRanking(rankData) {
  rankingTable.innerHTML = "";
  if (!rankData || rankData.length === 0) {
    rankingTable.innerHTML = "<tr><td colspan='4'>データなし</td></tr>";
    return;
  }

  rankData.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td class="boat-${r.boat}">${r.boat}</td>
      <td>${r.name}</td>
      <td>${r.score}</td>
    `;
    rankingTable.appendChild(tr);
  });
}

// ------------------------------
// コメント表示
// ------------------------------
function renderComments(comments) {
  commentTable.innerHTML = "";
  if (!comments || comments.length === 0) {
    commentTable.innerHTML = "<tr><td colspan='2'>データなし</td></tr>";
    return;
  }

  comments.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${c}</td>`;
    commentTable.appendChild(tr);
  });
}

// ------------------------------
// 🆕 最新レース結果表示（history.json）
// ------------------------------
function renderResultTable(venue, raceNum) {
  if (!resultTable) return;
  resultTable.innerHTML = "";
  resultNote.textContent = "";

  const dateKey = getDateKey(currentDateType === "today" ? 0 : -1);
  const dayData = historyData[dateKey];
  if (!dayData) {
    resultTable.innerHTML = "<tr><td colspan='4'>結果データなし</td></tr>";
    resultNote.textContent = "※ 結果データ未取得";
    return;
  }

  const resultRace = dayData.results?.find(
    r => r.race_stadium_number === venue && r.race_number === raceNum
  );

  if (!resultRace) {
    resultTable.innerHTML = "<tr><td colspan='4'>このレースの結果はまだありません</td></tr>";
    return;
  }

  const sorted = resultRace.boats.sort((a, b) => a.racer_place_number - b.racer_place_number);

  sorted.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.racer_place_number}</td>
      <td class="boat-${b.racer_boat_number}">${b.racer_boat_number}</td>
      <td>${b.racer_name}</td>
      <td>${b.racer_start_timing.toFixed(2)}</td>
    `;
    resultTable.appendChild(tr);
  });

  resultNote.textContent = `※ ${venue} ${raceNum}R の結果を表示中`;
}

// ------------------------------
// 更新ボタン
// ------------------------------
refreshBtn.addEventListener("click", async () => {
  aiStatus.textContent = "更新中...";
  await loadData();
  await loadHistory();
  renderVenues();
  aiStatus.textContent = "最新データを読み込みました";
});

// ------------------------------
// 日付タブ
// ------------------------------
todayBtn.addEventListener("click", () => setActiveTab("today"));
yesterdayBtn.addEventListener("click", () => setActiveTab("yesterday"));

// ------------------------------
// 戻るボタン
// ------------------------------
document.getElementById("backToVenues").onclick = () => showScreen(screenVenues);
document.getElementById("backToRaces").onclick = () => showScreen(screenRaces);

// ------------------------------
// 初期化
// ------------------------------
async function loadAndRender() {
  aiStatus.textContent = "データ読み込み中...";
  await loadData();
  await loadHistory();
  renderVenues();
  aiStatus.textContent = "AI学習完了";
}

// ------------------------------
// 起動時処理（自動的に本日を表示）
// ------------------------------
window.addEventListener("DOMContentLoaded", async () => {
  setActiveTab("today"); // 本日モードで起動
});