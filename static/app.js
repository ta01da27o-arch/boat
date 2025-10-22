// ======================================================
// 競艇AI予想フロントエンド（GitHub Pages対応 / data/data.json + history.json 自動反映）
// ======================================================

// ===== パス自動判定 =====
// static/ 下で動かしても /boat/ 直下でも動作するように調整
const BASE_PATH = window.location.pathname.includes("/static/")
  ? "../data"
  : "./data";

const DATA_URL = `${BASE_PATH}/data.json`;
const HISTORY_URL = `${BASE_PATH}/history.json`;

// ===== DOM要素 =====
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

// ===== グローバル変数 =====
let globalData = {};
let historyData = {};
let selectedVenue = null;
let selectedRace = null;

// ======================================================
// 初期処理
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
// 日付表示
// ======================================================
function updateDateLabel() {
  const now = new Date();
  const y = now.getFullYear();
  const m = ("0" + (now.getMonth() + 1)).slice(-2);
  const d = ("0" + now.getDate()).slice(-2);
  dateLabel.textContent = `${y}/${m}/${d}`;
}

// ======================================================
// 24場一覧画面
// ======================================================
function renderVenues() {
  venuesGrid.innerHTML = "";

  // 🔹 fetch_data.pyの出力形式対応
  const dateKeys = Object.keys(globalData);
  if (dateKeys.length === 0) {
    venuesGrid.innerHTML = "<p>データがありません。</p>";
    return;
  }

  // 最新日付のデータのみ使用
  const latestDate = dateKeys.sort().pop();
  const todayData = globalData[latestDate];

  if (!todayData) {
    venuesGrid.innerHTML = "<p>本日データなし。</p>";
    return;
  }

  // 24場表示
  Object.keys(todayData).forEach((venueName) => {
    const venue = todayData[venueName];
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">${venueName}</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">${venue?.races ? `${Object.keys(venue.races).length}R` : ""}</div>
    `;
    card.addEventListener("click", () => openVenue(latestDate, venueName));
    venuesGrid.appendChild(card);
  });
}

// ======================================================
// レース一覧画面
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
// 出走表詳細
// ======================================================
function openRace(dateKey, venueName, raceNo) {
  selectedRace = raceNo;
  screenRaces.classList.remove("active");
  screenDetail.classList.add("active");

  raceTitle.textContent = `${venueName} ${raceNo}R`;

  const raceData = globalData[dateKey]?.[venueName]?.races?.find(r => r.race_no === raceNo);
  renderEntryTable(raceData);
  renderAIPredictions(raceData);
  renderComments(raceData);
  renderRanking(raceData);
  renderResult(venueName, raceNo);
}

// ======================================================
// 出走表
// ======================================================
function renderEntryTable(raceData) {
  entryTable.innerHTML = "";
  if (!raceData?.boats) return;

  raceData.boats.forEach((b, i) => {
    const tr = document.createElement("tr");
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
      <td class="eval-mark">-</td>
    `;
    entryTable.appendChild(tr);
  });
}

// ======================================================
// AI予想（ダミー生成可）
// ======================================================
function renderAIPredictions(raceData) {
  aiMain.innerHTML = "";
  aiSub.innerHTML = "";

  if (!raceData) return;

  const dummyMain = [
    { bet: "1-2-3", rate: 42 },
    { bet: "1-3-2", rate: 21 },
    { bet: "1-2-4", rate: 13 }
  ];
  const dummySub = [
    { bet: "3-1-2", rate: 7 },
    { bet: "4-1-2", rate: 5 }
  ];

  dummyMain.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.bet}</td><td>${p.rate}%</td>`;
    aiMain.appendChild(tr);
  });
  dummySub.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.bet}</td><td>${p.rate}%</td>`;
    aiSub.appendChild(tr);
  });
}

// ======================================================
// 展開コメント
// ======================================================
function renderComments(raceData) {
  commentTable.innerHTML = "";
  if (!raceData?.boats) return;

  raceData.boats.forEach((_, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>展開予想コメント ${i + 1}</td>`;
    commentTable.appendChild(tr);
  });
}

// ======================================================
// AI順位予測（仮）
function renderRanking(raceData) {
  rankingTable.innerHTML = "";
  if (!raceData?.boats) return;

  raceData.boats.forEach((b, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${b.racer_boat_number}</td><td>${b.racer_name}</td><td>${(100 - i * 5).toFixed(1)}</td>`;
    rankingTable.appendChild(tr);
  });
}

// ======================================================
// レース結果（history.json）
// ======================================================
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
// 戻るボタン
// ======================================================
backToVenues.addEventListener("click", () => {
  screenRaces.classList.remove("active");
  screenVenues.classList.add("active");
});
backToRaces.addEventListener("click", () => {
  screenDetail.classList.remove("active");
  screenRaces.classList.add("active");
});

// ======================================================
// 更新ボタン
// ======================================================
refreshBtn.addEventListener("click", async () => {
  aiStatus.textContent = "🔄 再取得中...";
  await loadAllData();
  renderVenues();
  aiStatus.textContent = "✅ 更新完了";
});