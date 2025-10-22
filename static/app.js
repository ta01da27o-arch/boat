// app.js
// ======================================================
// 競艇AI予想フロントエンド（GitHub data/data.json + history.json 自動反映）
// ======================================================

const API_BASE = "./data"; // dataフォルダ直下を参照
const DATA_URL = `${API_BASE}/data.json`;
const HISTORY_URL = `${API_BASE}/history.json`;

// DOM参照
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
const aiMain = document.getElementById("aiMain").querySelector("tbody");
const aiSub = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");

const raceTitle = document.getElementById("raceTitle");
const venueTitle = document.getElementById("venueTitle");

const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

let globalData = {};
let historyData = {};
let selectedVenue = null;
let selectedRace = null;
let dateMode = "today";

// ====== 初期ロード ======
init();
async function init() {
  await loadAllData();
  renderVenues();
  updateDateLabel();
}

// ====== データ取得 ======
async function loadAllData() {
  aiStatus.textContent = "🔄 データ読込中...";
  try {
    const [dataRes, histRes] = await Promise.all([
      fetch(DATA_URL + "?t=" + Date.now()),
      fetch(HISTORY_URL + "?t=" + Date.now())
    ]);

    globalData = await dataRes.json();
    historyData = await histRes.json();

    aiStatus.textContent = "✅ 最新データ取得済み";
  } catch (err) {
    console.error(err);
    aiStatus.textContent = "⚠️ データ読込エラー";
  }
}

// ====== 日付表示 ======
function updateDateLabel() {
  const now = new Date();
  const y = now.getFullYear();
  const m = ("0" + (now.getMonth() + 1)).slice(-2);
  const d = ("0" + now.getDate()).slice(-2);
  dateLabel.textContent = `${y}/${m}/${d}`;
}

// ====== 24場画面 ======
function renderVenues() {
  venuesGrid.innerHTML = "";
  if (!globalData?.venues) return;

  Object.keys(globalData.venues).forEach((venueName) => {
    const v = globalData.venues[venueName];
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">${venueName}</div>
      <div class="v-status">${v.status || "開催中"}</div>
      <div class="v-rate">${v.comment || ""}</div>
    `;
    card.addEventListener("click", () => openVenue(venueName));
    venuesGrid.appendChild(card);
  });
}

// ====== レース一覧画面 ======
function openVenue(venueName) {
  selectedVenue = venueName;
  screenVenues.classList.remove("active");
  screenRaces.classList.add("active");
  venueTitle.textContent = `${venueName}`;
  renderRaces(venueName);
}

function renderRaces(venueName) {
  racesGrid.innerHTML = "";
  const races = globalData.venues[venueName]?.races || {};
  Object.keys(races).forEach((raceNo) => {
    const btn = document.createElement("div");
    btn.className = "race-btn clickable";
    btn.textContent = `${raceNo}R`;
    btn.addEventListener("click", () => openRace(venueName, raceNo));
    racesGrid.appendChild(btn);
  });
}

// ====== 出走表詳細 ======
function openRace(venueName, raceNo) {
  selectedRace = raceNo;
  screenRaces.classList.remove("active");
  screenDetail.classList.add("active");

  raceTitle.textContent = `${venueName} ${raceNo}R`;

  const raceData = globalData.venues[venueName]?.races?.[raceNo];
  renderEntryTable(raceData);
  renderAIPredictions(raceData);
  renderComments(raceData);
  renderRanking(raceData);
  renderResult(venueName, raceNo);
}

// ====== 出走表 ======
function renderEntryTable(raceData) {
  entryTable.innerHTML = "";
  if (!raceData?.entries) return;

  raceData.entries.forEach((e, i) => {
    const tr = document.createElement("tr");
    tr.className = `row-${i + 1}`;
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td class="entry-left">
        <div class="klass">${e.grade || ""}</div>
        <div class="name">${e.name || ""}</div>
        <div class="st">ST:${e.st || "-"}</div>
      </td>
      <td>${e.f || ""}</td>
      <td>${e.all || ""}</td>
      <td>${e.local || ""}</td>
      <td>${e.mt || ""}</td>
      <td>${e.course || ""}</td>
      <td class="eval-mark">${e.eval || ""}</td>
    `;
    entryTable.appendChild(tr);
  });
}

// ====== AI予想 ======
function renderAIPredictions(raceData) {
  aiMain.innerHTML = "";
  aiSub.innerHTML = "";

  if (raceData?.ai_main) {
    raceData.ai_main.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.bet}</td><td>${p.rate}%</td>`;
      aiMain.appendChild(tr);
    });
  }

  if (raceData?.ai_sub) {
    raceData.ai_sub.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.bet}</td><td>${p.rate}%</td>`;
      aiSub.appendChild(tr);
    });
  }
}

// ====== 展開コメント ======
function renderComments(raceData) {
  commentTable.innerHTML = "";
  if (raceData?.comments) {
    raceData.comments.forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i + 1}</td><td>${c}</td>`;
      commentTable.appendChild(tr);
    });
  }
}

// ====== AI順位予測 ======
function renderRanking(raceData) {
  rankingTable.innerHTML = "";
  if (raceData?.ranking) {
    raceData.ranking.forEach((r, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i + 1}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.value}</td>`;
      rankingTable.appendChild(tr);
    });
  }
}

// ====== レース結果（history.json） ======
function renderResult(venueName, raceNo) {
  resultTable.innerHTML = "";
  const results = historyData?.[venueName]?.[raceNo];
  if (!results) return;

  results.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${r.boat}</td>
      <td>${r.name}</td>
      <td>${r.st}</td>
    `;
    resultTable.appendChild(tr);
  });
}

// ====== 戻る ======
backToVenues.addEventListener("click", () => {
  screenRaces.classList.remove("active");
  screenVenues.classList.add("active");
});
backToRaces.addEventListener("click", () => {
  screenDetail.classList.remove("active");
  screenRaces.classList.add("active");
});

// ====== 更新ボタン ======
refreshBtn.addEventListener("click", async () => {
  aiStatus.textContent = "🔄 再取得中...";
  await loadAllData();
  renderVenues();
  aiStatus.textContent = "✅ 更新完了";
});