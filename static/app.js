// ============================================================
// app.js（data.json連動・完全安定版）
// 2025-10-25 最終構築
// ============================================================

// ----------- DOM取得セクション -----------
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMain = document.getElementById("aiMain").querySelector("tbody");
const aiSub = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");

const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

// ----------- データパス指定 -----------
const DATA_PATH = window.DATA_PATH || "./data/data.json";
const HISTORY_PATH = window.HISTORY_PATH || "./data/history.json";

// ----------- 全24場名（順番固定）-----------
const VENUES = [
  "桐生","戸田","江戸川","平和島","多摩川",
  "浜名湖","蒲郡","常滑","津",
  "三国","びわこ","住之江","尼崎",
  "鳴門","丸亀","児島","宮島","徳山","下関",
  "若松","芦屋","福岡","唐津","大村"
];

// ----------- カラー設定 -----------
const COLOR_ACTIVE = "#e3f2fd";     // 開催中（アクティブ）
const COLOR_NORMAL = "#ffffff";     // デフォルト
const COLOR_DISABLED = "#e0e0e0";   // 非開催（グレーアウト）

// ----------- 状態変数 -----------
let currentMode = "today"; // "today" or "yesterday"
let currentDate = new Date();
let jsonData = null;
let historyData = null;

// ============================================================
// 初期化処理
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  initDate();
  bindEvents();
  fetchAllData(); // 初回ロード時にデータ取得
});

// ============================================================
// 日付関連処理
// ============================================================

// 日付初期化
function initDate() {
  updateDateLabel();
}

// 日付ラベル更新
function updateDateLabel() {
  const y = currentDate.getFullYear();
  const m = ("0" + (currentDate.getMonth() + 1)).slice(-2);
  const d = ("0" + currentDate.getDate()).slice(-2);
  dateLabel.textContent = `${y}/${m}/${d}`;
}

// 「本日」「前日」切替ボタン動作
function bindEvents() {
  todayBtn.addEventListener("click", () => switchMode("today"));
  yesterdayBtn.addEventListener("click", () => switchMode("yesterday"));
  refreshBtn.addEventListener("click", fetchAllData);
  backToVenues.addEventListener("click", () => switchScreen("venues"));
  backToRaces.addEventListener("click", () => switchScreen("races"));
}

// 日付モード切替
function switchMode(mode) {
  if (mode === currentMode) return; // 同一モードならスキップ
  currentMode = mode;

  const base = new Date();
  currentDate = (mode === "today")
    ? base
    : new Date(base.setDate(base.getDate() - 1));

  updateDateLabel();

  // ボタン色連動
  todayBtn.classList.toggle("active", mode === "today");
  yesterdayBtn.classList.toggle("active", mode === "yesterday");
}

// ============================================================
// 画面遷移管理
// ============================================================

function switchScreen(name) {
  screenVenues.classList.remove("active");
  screenRaces.classList.remove("active");
  screenDetail.classList.remove("active");

  if (name === "venues") screenVenues.classList.add("active");
  if (name === "races") screenRaces.classList.add("active");
  if (name === "detail") screenDetail.classList.add("active");
}

// ============================================================
// データ取得処理
// ============================================================

// data.json と history.json を同時取得
async function fetchAllData() {
  aiStatus.textContent = "データ取得中...";
  try {
    const [dataRes, histRes] = await Promise.all([
      fetch(DATA_PATH),
      fetch(HISTORY_PATH)
    ]);

    jsonData = await dataRes.json();
    historyData = await histRes.json();

    aiStatus.textContent = "AIデータ更新済";

    // 取得後に24場グリッド再構築
    buildVenueGrid();

  } catch (err) {
    console.error("データ取得エラー:", err);
    aiStatus.textContent = "データ取得失敗";
  }
}

// ============================================================
// 24場グリッド構築（data.json 反映）
// ============================================================

function buildVenueGrid() {
  venuesGrid.innerHTML = "";

  VENUES.forEach((name) => {
    // data.json内の該当場データを検索
    const venueData = jsonData?.find(v => v.name === name);

    // 開催中判定・的中率取得
    const isActive = venueData ? venueData.is_active : false;
    const hitRate = venueData && venueData.hit_rate != null
      ? `${venueData.hit_rate}%`
      : "ー";

    // 開催中 or 非開催 表示テキスト
    const activeText = isActive ? "開催中" : "ー";

    // DOM生成
    const div = document.createElement("div");
    div.className = "venue-cell";
    div.innerHTML = `
      <div class="venue-name">${name}</div>
      <div class="venue-status">${activeText}</div>
      <div class="venue-hit">${hitRate}</div>
    `;

    // 背景色・タップ可否設定
    div.style.background = isActive ? COLOR_ACTIVE : COLOR_DISABLED;
    div.style.pointerEvents = isActive ? "auto" : "none";

    if (isActive) {
      div.addEventListener("click", () => openVenue(name));
    }

    venuesGrid.appendChild(div);
  });
}

// ============================================================
// レース番号画面生成
// ============================================================

function openVenue(name) {
  venueTitle.textContent = name;
  buildRaceButtons(name);
  switchScreen("races");
}

function buildRaceButtons(venueName) {
  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => openRace(venueName, i));
    racesGrid.appendChild(btn);
  }
}

// ============================================================
// 出走表画面構築
// ============================================================

function openRace(venue, raceNo) {
  raceTitle.textContent = `${venue} ${raceNo}R`;
  switchScreen("detail");
  buildEmptyTables();

  // 実際は data.json または history.json からレースデータ取得可能
  // 現時点では空のまま（データ構造維持）
}

function buildEmptyTables() {
  entryTable.innerHTML = `<tr><td colspan="8">データなし</td></tr>`;
  aiMain.innerHTML = `<tr><td colspan="2">-</td></tr>`;
  aiSub.innerHTML = `<tr><td colspan="2">-</td></tr>`;
  commentTable.innerHTML = `<tr><td colspan="2">-</td></tr>`;
  rankingTable.innerHTML = `<tr><td colspan="4">-</td></tr>`;
  resultTable.innerHTML = `<tr><td colspan="4">-</td></tr>`;
}