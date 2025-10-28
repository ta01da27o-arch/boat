// 静的/app.js
// 出走表 + AI予想 + 展開コメント + 順位予測 + 履歴表示
// スマホ単体でもGitHub自動更新でも動く構成

const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const dateLabel = document.getElementById("dateLabel");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");
const aiMain = document.getElementById("aiMain").querySelector("tbody");
const aiSub = document.getElementById("aiSub").querySelector("tbody");
const aiStatus = document.getElementById("aiStatus");

let DATA_PATH = window.DATA_PATH || "../data/data.json";
let HISTORY_PATH = window.HISTORY_PATH || "../data/history.json";

let raceData = {};
let historyData = {};
let currentVenue = null;
let currentDate = "today";

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  showVenues();
  setupTabs();
  document.getElementById("refreshBtn").addEventListener("click", loadData);
  document.getElementById("backToVenues").addEventListener("click", () => switchScreen("venues"));
  document.getElementById("backToRaces").addEventListener("click", () => switchScreen("races"));
});

// -------------------- データ読込 --------------------
async function loadData() {
  aiStatus.textContent = "AIデータ読込中...";
  try {
    const res1 = await fetch(DATA_PATH + "?t=" + Date.now());
    const res2 = await fetch(HISTORY_PATH + "?t=" + Date.now());
    raceData = await res1.json();
    historyData = await res2.json();
    aiStatus.textContent = "AI最新データ反映済";
    dateLabel.textContent = new Date().toLocaleDateString("ja-JP");
  } catch (e) {
    aiStatus.textContent = "⚠ データ読込エラー";
    console.error(e);
  }
}

// -------------------- 画面切替 --------------------
function switchScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(`screen-${screen}`).classList.add("active");
}

// -------------------- タブ設定 --------------------
function setupTabs() {
  todayBtn.addEventListener("click", () => {
    currentDate = "today";
    todayBtn.classList.add("active");
    yesterdayBtn.classList.remove("active");
    showVenues();
  });
  yesterdayBtn.addEventListener("click", () => {
    currentDate = "yesterday";
    yesterdayBtn.classList.add("active");
    todayBtn.classList.remove("active");
    showVenues();
  });
}

// -------------------- 場一覧表示 --------------------
function showVenues() {
  venuesGrid.innerHTML = "";
  const venues = Object.keys(raceData || {});
  venues.forEach(venue => {
    const info = raceData[venue];
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">${venue}</div>
      <div class="v-status ${info.status || 'active'}">${info.statusText || '開催中'}</div>
    `;
    card.addEventListener("click", () => showRaces(venue));
    venuesGrid.appendChild(card);
  });
}

// -------------------- レース番号一覧 --------------------
function showRaces(venue) {
  currentVenue = venue;
  document.getElementById("venueTitle").textContent = venue;
  switchScreen("races");
  racesGrid.innerHTML = "";
  const races = raceData[venue]?.races || [];
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.disabled = !races[i];
    btn.addEventListener("click", () => showDetail(venue, i));
    racesGrid.appendChild(btn);
  }
}

// -------------------- 出走表・AI予想 --------------------
function showDetail(venue, raceNo) {
  switchScreen("detail");
  document.getElementById("raceTitle").textContent = `${venue} ${raceNo}R`;
  const race = raceData[venue]?.races?.[raceNo];
  if (!race) return;

  // 出走表
  entryTable.innerHTML = race.entries.map((e, i) => `
    <tr class="row-${i+1}">
      <td>${i+1}</td>
      <td class="entry-left">
        <span class="klass">${e.grade}</span>
        <span class="name">${e.name}</span>
        <span class="st">${e.st}</span>
      </td>
      <td>${e.f || 0}</td>
      <td>${e.national}</td>
      <td>${e.local}</td>
      <td>${e.motor}</td>
      <td>${e.course}</td>
      <td>${e.eval || '-'}</td>
    </tr>`).join("");

  // AI本命・穴
  renderTable(aiMain, race.ai_main);
  renderTable(aiSub, race.ai_sub);

  // 展開コメント
  commentTable.innerHTML = (race.comments || []).map((c, i) => `
    <tr><td>${i+1}</td><td>${c}</td></tr>`).join("");

  // AI順位予測
  rankingTable.innerHTML = (race.ranking || []).map(r =>
    `<tr><td>${r.rank}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.score}</td></tr>`).join("");

  // レース結果
  const hist = historyData[venue]?.[raceNo];
  resultTable.innerHTML = hist ? hist.map((h,i) =>
    `<tr><td>${i+1}</td><td>${h.boat}</td><td>${h.name}</td><td>${h.st}</td></tr>`).join("")
    : `<tr><td colspan="4">データなし</td></tr>`;
}

function renderTable(target, data = []) {
  target.innerHTML = data.length ? data.map(d => `
    <tr><td>${d.buy}</td><td>${d.prob}%</td></tr>`).join("") :
    `<tr><td colspan="2">データなし</td></tr>`;
}