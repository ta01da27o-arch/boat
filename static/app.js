// ======================================================
// 競艇AI予想フロントエンド（2025完全対応版）
// data/data.json + history.json 自動反映 + 出走表色分け対応
// ======================================================

// ===== パス自動判定 =====
const BASE_PATH = window.location.pathname.includes("/static/")
  ? "../data"
  : "./data";

const DATA_URL = `${BASE_PATH}/data.json`;
const HISTORY_URL = `${BASE_PATH}/history.json`;

// ===== DOM要素 =====
const dateLabel = document.getElementById("dateLabel");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.getElementById("entryTable")?.querySelector("tbody");
const aiMain = document.getElementById("aiMain")?.querySelector("tbody");
const aiSub = document.getElementById("aiSub")?.querySelector("tbody");
const commentTable = document.getElementById("commentTable")?.querySelector("tbody");
const rankingTable = document.getElementById("rankingTable")?.querySelector("tbody");
const resultTable = document.getElementById("resultTable")?.querySelector("tbody");

const raceTitle = document.getElementById("raceTitle");
const venueTitle = document.getElementById("venueTitle");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

// ===== グローバル変数 =====
let globalData = {};
let historyData = {};
let selectedVenue = null;
let selectedRace = null;

// ======================================================
// 初期化処理
// ======================================================
init();

async function init() {
  await loadAllData();
  renderVenues();
  updateDateLabel();
}

// ======================================================
// データ取得
// ======================================================
async function loadAllData() {
  aiStatus.textContent = "🔄 データ読込中...";
  try {
    const [dataRes, histRes] = await Promise.all([
      fetch(DATA_URL + "?t=" + Date.now()),
      fetch(HISTORY_URL + "?t=" + Date.now())
    ]);

    if (!dataRes.ok) throw new Error("data.json 読込失敗");
    if (!histRes.ok) throw new Error("history.json 読込失敗");

    globalData = await dataRes.json();
    historyData = await histRes.json();

    aiStatus.textContent = "✅ 最新データ取得済み";
    console.log("✅ データ読込成功:", globalData, historyData);
  } catch (err) {
    console.error("⚠️ データ読込エラー:", err);
    aiStatus.textContent = "⚠️ データ読込エラー";
  }
}

// ======================================================
// 日付ラベル更新
// ======================================================
function updateDateLabel() {
  const now = new Date();
  const y = now.getFullYear();
  const m = ("0" + (now.getMonth() + 1)).slice(-2);
  const d = ("0" + now.getDate()).slice(-2);
  dateLabel.textContent = `${y}/${m}/${d}`;
}

// ======================================================
// 24場一覧
// ======================================================
function renderVenues() {
  venuesGrid.innerHTML = "";

  const dateKeys = Object.keys(globalData);
  if (dateKeys.length === 0) {
    venuesGrid.innerHTML = "<p>データがありません。</p>";
    return;
  }

  const latestDate = dateKeys.sort().pop();
  const todayData = globalData[latestDate];
  if (!todayData) {
    venuesGrid.innerHTML = "<p>本日データなし。</p>";
    return;
  }

  Object.keys(todayData).forEach((venueName) => {
    const venue = todayData[venueName];
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">${venueName}</div>
      <div class="v-status">${venue?.status || "開催中"}</div>
      <div class="v-rate">${venue?.races ? Object.keys(venue.races).length + "R" : ""}</div>
    `;
    card.addEventListener("click", () => openVenue(latestDate, venueName));
    venuesGrid.appendChild(card);
  });
}

// ======================================================
// レース一覧
// ======================================================
function openVenue(dateKey, venueName) {
  selectedVenue = venueName;
  screenVenues.classList.remove("active");
  screenRaces.classList.add("active");
  venueTitle.textContent = venueName;

  renderRaces(dateKey, venueName);
}

function renderRaces(dateKey, venueName) {
  racesGrid.innerHTML = "";
  const races = globalData[dateKey]?.[venueName]?.races || [];

  races.forEach((race) => {
    const btn = document.createElement("div");
    btn.className = "race-btn clickable";
    btn.textContent = `${race.race_no}R`;
    btn.addEventListener("click", () => openRace(dateKey, venueName, race.race_no));
    racesGrid.appendChild(btn);
  });
}

// ======================================================
// 出走表画面
// ======================================================
function openRace(dateKey, venueName, raceNo) {
  selectedRace = raceNo;
  screenRaces.classList.remove("active");
  screenDetail.classList.add("active");
  raceTitle.textContent = `${venueName} ${raceNo}R 出走表`;

  const raceData = globalData[dateKey]?.[venueName]?.races?.find(r => r.race_no === raceNo);
  renderEntryTable(raceData);
  renderAIPredictions(raceData);
  renderComments(raceData);
  renderRanking(raceData);
  renderResult(venueName, raceNo);
}

// ======================================================
// 出走表（色分け対応）
// ======================================================
function renderEntryTable(raceData) {
  entryTable.innerHTML = "";
  if (!raceData?.boats) return;

  raceData.boats.forEach((b) => {
    const tr = document.createElement("tr");
    tr.classList.add(`row-${b.racer_boat_number}`);
    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td class="entry-left">
        <div class="klass">${b.racer_class}</div>
        <div class="name">${b.racer_name}</div>
        <div class="st">ST:${b.racer_start_timing}</div>
      </td>
      <td>${b.racer_flying_count}</td>
      <td>${b.racer_national_win_rate}</td>
      <td>${b.racer_local_win_rate}</td>
      <td>${b.racer_motor_win_rate}</td>
      <td>${b.racer_course_win_rate}</td>
      <td class="eval-mark">${b.eval || "-"}</td>
    `;
    entryTable.appendChild(tr);
  });
}

// ======================================================
// AI予想・コメント・順位・結果
// ======================================================
function renderAIPredictions(raceData) {
  aiMain.innerHTML = "";
  aiSub.innerHTML = "";
  if (!raceData?.predictions) return;

  raceData.predictions.main?.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.bet}</td><td>${p.rate}%</td>`;
    aiMain.appendChild(tr);
  });

  raceData.predictions.sub?.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.bet}</td><td>${p.rate}%</td>`;
    aiSub.appendChild(tr);
  });
}

function renderComments(raceData) {
  commentTable.innerHTML = "";
  if (!raceData?.comments) return;

  raceData.comments.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${c}</td>`;
    commentTable.appendChild(tr);
  });
}

function renderRanking(raceData) {
  rankingTable.innerHTML = "";
  if (!raceData?.ranking) return;

  raceData.ranking.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.rate}%</td>`;
    rankingTable.appendChild(tr);
  });
}

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

// ======================================================
// 戻る・更新ボタン
// ======================================================
backToVenues?.addEventListener("click", () => {
  screenRaces.classList.remove("active");
  screenVenues.classList.add("active");
});

backToRaces?.addEventListener("click", () => {
  screenDetail.classList.remove("active");
  screenRaces.classList.add("active");
});

refreshBtn?.addEventListener("click", async () => {
  aiStatus.textContent = "🔄 再取得中...";
  await loadAllData();
  renderVenues();
  aiStatus.textContent = "✅ 更新完了";
});