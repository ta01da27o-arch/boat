// ===============================
// 競艇AI予想アプリ app.js（最終統合版）
// ===============================

const DATA_PATH = window.DATA_PATH || "../data/data.json";
const HISTORY_PATH = window.HISTORY_PATH || "../data/history.json";

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");
const resultTableBody = document.querySelector("#resultTable tbody");
const aiStatus = document.getElementById("aiStatus");
const dateLabel = document.getElementById("dateLabel");

let currentVenue = null;
let currentRace = null;
let allData = {};
let historyData = {};
let showingDate = "today";

// ===============================
// 初期ロード
// ===============================
window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  renderVenues();
  setupUIEvents();
});

// ===============================
// UI イベント設定
// ===============================
function setupUIEvents() {
  document.getElementById("todayBtn").addEventListener("click", () => {
    showingDate = "today";
    document.getElementById("todayBtn").classList.add("active");
    document.getElementById("yesterdayBtn").classList.remove("active");
    loadData();
  });

  document.getElementById("yesterdayBtn").addEventListener("click", () => {
    showingDate = "yesterday";
    document.getElementById("yesterdayBtn").classList.add("active");
    document.getElementById("todayBtn").classList.remove("active");
    loadData();
  });

  document.getElementById("refreshBtn").addEventListener("click", async () => {
    aiStatus.textContent = "データ更新中...";
    await loadData(true);
    aiStatus.textContent = "AI学習中...";
    setTimeout(() => (aiStatus.textContent = "AI連携完了"), 1000);
  });

  document.getElementById("backToVenues").addEventListener("click", () => switchScreen("screen-venues"));
  document.getElementById("backToRaces").addEventListener("click", () => switchScreen("screen-races"));
}

// ===============================
// データ読み込み
// ===============================
async function loadData(forceRefresh = false) {
  try {
    const timestamp = forceRefresh ? `?t=${Date.now()}` : "";
    const [dataRes, historyRes] = await Promise.all([
      fetch(`${DATA_PATH}${timestamp}`),
      fetch(`${HISTORY_PATH}${timestamp}`)
    ]);
    allData = await dataRes.json();
    historyData = await historyRes.json();

    const today = new Date();
    const label =
      showingDate === "today"
        ? `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`
        : "前日データ";
    dateLabel.textContent = label;

    renderVenues();
  } catch (err) {
    console.error("データ読み込みエラー:", err);
  }
}

// ===============================
// 画面遷移制御
// ===============================
function switchScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ===============================
// 24場一覧表示
// ===============================
function renderVenues() {
  venuesGrid.innerHTML = "";
  for (const [venueName, info] of Object.entries(allData)) {
    const card = document.createElement("div");
    card.className = "venue-cell";

    const isActive = Object.keys(info.races || {}).length > 0;
    const label = getVenueStatus(venueName);

    card.innerHTML = `
      <div class="venue-name">${venueName}</div>
      <div class="venue-status ${label.class}">${label.text}</div>
    `;

    if (isActive) {
      card.addEventListener("click", () => {
        currentVenue = venueName;
        renderRaces(venueName);
        switchScreen("screen-races");
      });
    }
    venuesGrid.appendChild(card);
  }
}

function getVenueStatus(venue) {
  const venueData = allData[venue];
  if (!venueData || !venueData.races) return { text: "－", class: "closed" };

  const raceKeys = Object.keys(venueData.races);
  if (raceKeys.length === 0) return { text: "－", class: "closed" };

  const allFinished = raceKeys.every(r => venueData.races[r].status === "終了");
  if (allFinished) return { text: "終了", class: "finished" };

  return { text: "開催中", class: "active" };
}

// ===============================
// レース番号一覧
// ===============================
function renderRaces(venueName) {
  const venueData = allData[venueName];
  document.getElementById("venueTitle").textContent = venueName;
  racesGrid.innerHTML = "";

  if (!venueData || !venueData.races) return;

  for (const [raceNo, raceData] of Object.entries(venueData.races)) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${raceNo}R`;

    if (raceData.status === "終了") btn.classList.add("finished");
    btn.addEventListener("click", () => {
      currentRace = raceNo;
      renderRaceDetail(venueName, raceNo);
      switchScreen("screen-detail");
    });
    racesGrid.appendChild(btn);
  }
}

// ===============================
// 出走表 + AI予測 + 結果表示
// ===============================
function renderRaceDetail(venue, raceNo) {
  const race = allData[venue]?.races?.[raceNo];
  const history = historyData[venue]?.races?.[raceNo];
  document.getElementById("raceTitle").textContent = `${venue} ${raceNo}R`;

  entryTableBody.innerHTML = "";
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  commentTableBody.innerHTML = "";
  rankingTableBody.innerHTML = "";
  resultTableBody.innerHTML = "";

  // --- 出走表 ---
  (race?.entries || []).forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.lane}</td>
      <td><div>${e.rank}</div><div>${e.name}</div><div>${e.st}</div></td>
      <td>${e.f || "－"}</td>
      <td>${e.national}</td>
      <td>${e.local}</td>
      <td>${e.motor}</td>
      <td>${e.course}</td>
      <td>${e.eval || "-"}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  // --- AI予想 ---
  (race?.ai_main || []).forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.buy}</td><td>${p.rate}%</td>`;
    aiMainBody.appendChild(tr);
  });
  (race?.ai_sub || []).forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.buy}</td><td>${p.rate}%</td>`;
    aiSubBody.appendChild(tr);
  });

  // --- コメント ---
  (race?.comments || []).forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${c.course}</td><td>${c.text}</td>`;
    commentTableBody.appendChild(tr);
  });

  // --- AI順位予測 ---
  (race?.ranking || []).forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.value}</td>`;
    rankingTableBody.appendChild(tr);
  });

  // --- 結果 ---
  if (history && history.results) {
    history.results.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.st}</td>`;
      resultTableBody.appendChild(tr);
    });
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">結果データなし</td>`;
    resultTableBody.appendChild(tr);
  }
}