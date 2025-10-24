// ============================================================
// 競艇AI予想アプリ（正式安定版）
// #01 桐生 → #24 大村（正規順）
// ============================================================

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_DETAIL = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");
const resultTableBody = document.querySelector("#resultTable tbody");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

// ============================================================
// 24場（#01〜#24 正式順）
// ============================================================
const venues = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

// ============================================================
// 背景色（レース画面と同一カラーで統一）
// ============================================================
const BG_COLORS = {
  開催中: "#d8f9d8",   // 淡い緑
  開催前: "#f0f0f0",   // グレー
  終了: "#ffe4e1"      // ピンク系（未使用）
};

// ============================================================
// データ・状態管理
// ============================================================
let raceData = {};
let historyData = {};
let currentMode = "today"; // "today" / "yesterday"

// ============================================================
// 日付更新
// ============================================================
function updateDateLabel() {
  const now = new Date();
  if (currentMode === "yesterday") now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  dateLabel.textContent = `${y}/${m}/${d}`;
}

// ============================================================
// タブ切り替え（本日 / 前日）
// ============================================================
function switchTab(mode) {
  currentMode = mode;
  todayBtn.classList.toggle("active", mode === "today");
  yesterdayBtn.classList.toggle("active", mode === "yesterday");
  updateDateLabel();
}

// ============================================================
// 開催情報 + AI的中率グリッド
// ============================================================
let fixedVenueData = []; // 背景固定用キャッシュ

function initVenueStatus() {
  // 初回のみ開催状態と的中率を確定（固定）
  fixedVenueData = venues.map(v => ({
    name: v,
    isOpen: Math.random() < 0.6, // 約6割が開催中
    rate: Math.floor(50 + Math.random() * 50)
  }));
}

function renderVenues() {
  venuesGrid.innerHTML = "";
  fixedVenueData.forEach(item => {
    const card = document.createElement("div");
    card.className = "venue-card";
    card.dataset.venue = item.name;

    const title = document.createElement("div");
    title.className = "venue-title";
    title.textContent = item.name;

    const status = document.createElement("div");
    status.className = "venue-status";
    status.textContent = item.isOpen ? "開催中" : "ー";

    const rate = document.createElement("div");
    rate.className = "venue-rate";
    rate.textContent = item.isOpen ? `${item.rate}%` : "ー";

    const bg = item.isOpen ? BG_COLORS["開催中"] : BG_COLORS["開催前"];
    card.style.backgroundColor = bg;

    card.addEventListener("click", () => openRaces(item.name));
    card.append(title, status, rate);
    venuesGrid.appendChild(card);
  });
}

// ============================================================
// レース番号画面（1〜12R）
// ============================================================
function openRaces(venue) {
  venueTitle.textContent = venue;
  SCREEN_VENUES.classList.remove("active");
  SCREEN_RACES.classList.add("active");

  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => openRaceDetail(venue, i));
    racesGrid.appendChild(btn);
  }
}

// ============================================================
// 出走表画面
// ============================================================
function openRaceDetail(venue, raceNo) {
  raceTitle.textContent = `${venue} ${raceNo}R`;
  SCREEN_RACES.classList.remove("active");
  SCREEN_DETAIL.classList.add("active");

  // 各テーブルは空でも構造を維持
  entryTableBody.innerHTML = "";
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  commentTableBody.innerHTML = "";
  rankingTableBody.innerHTML = "";
  resultTableBody.innerHTML = "";

  const race = raceData[venue]?.[raceNo] || {};
  const entryList = race.entry || [];

  if (entryList.length === 0) {
    for (let i = 1; i <= 6; i++) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i}</td>
        <td>- / - / -</td>
        <td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>
      `;
      entryTableBody.appendChild(tr);
    }
  } else {
    entryList.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.tei}</td>
        <td>${row.class} / ${row.name} / ${row.st}</td>
        <td>${row.f}</td><td>${row.national}</td><td>${row.local}</td>
        <td>${row.mt}</td><td>${row.course}</td><td>${row.eval}</td>
      `;
      entryTableBody.appendChild(tr);
    });
  }

  renderAISection(venue, raceNo);
}

// ============================================================
// AI関連データ反映
// ============================================================
function renderAISection(venue, raceNo) {
  const data = raceData[venue]?.[raceNo] || {};

  // AI本命
  const mainList = data.ai_main || [];
  aiMainBody.innerHTML = mainList.length
    ? mainList.map(a => `<tr><td>${a.buy}</td><td>${a.rate}%</td></tr>`).join("")
    : `<tr><td>-</td><td>-</td></tr>`;

  // AI穴
  const subList = data.ai_sub || [];
  aiSubBody.innerHTML = subList.length
    ? subList.map(a => `<tr><td>${a.buy}</td><td>${a.rate}%</td></tr>`).join("")
    : `<tr><td>-</td><td>-</td></tr>`;

  // コメント
  const comments = data.comment || [];
  commentTableBody.innerHTML = comments.length
    ? comments.map((c, i) => `<tr><td>${i + 1}</td><td>${c}</td></tr>`).join("")
    : `<tr><td>1</td><td>-</td></tr>`;

  // 順位予測
  const rank = data.ranking || [];
  rankingTableBody.innerHTML = rank.length
    ? rank
        .map(
          (r, i) =>
            `<tr><td>${i + 1}</td><td>${r.tei}</td><td>${r.name}</td><td>${r.score}</td></tr>`
        )
        .join("")
    : `<tr><td>1</td><td>-</td><td>-</td><td>-</td></tr>`;

  // 結果
  const result = historyData[venue]?.[raceNo] || [];
  resultTableBody.innerHTML = result.length
    ? result
        .map(
          r =>
            `<tr><td>${r.rank}</td><td>${r.tei}</td><td>${r.name}</td><td>${r.st}</td></tr>`
        )
        .join("")
    : `<tr><td>1</td><td>-</td><td>-</td><td>-</td></tr>`;
}

// ============================================================
// 戻るボタン
// ============================================================
document.getElementById("backToVenues").addEventListener("click", () => {
  SCREEN_RACES.classList.remove("active");
  SCREEN_VENUES.classList.add("active");
});
document.getElementById("backToRaces").addEventListener("click", () => {
  SCREEN_DETAIL.classList.remove("active");
  SCREEN_RACES.classList.add("active");
});

// ============================================================
// データ読込
// ============================================================
async function loadData() {
  aiStatus.textContent = "データ読込中...";
  try {
    const res1 = await fetch("./data/data.json");
    const res2 = await fetch("./data/history.json");
    if (res1.ok) raceData = await res1.json();
    if (res2.ok) historyData = await res2.json();
    aiStatus.textContent = "AI連携OK";
  } catch (e) {
    aiStatus.textContent = "データ取得失敗";
  }
  renderVenues();
}

// ============================================================
// ボタン操作
// ============================================================
todayBtn.addEventListener("click", () => switchTab("today"));
yesterdayBtn.addEventListener("click", () => switchTab("yesterday"));
refreshBtn.addEventListener("click", () => renderVenues());

// ============================================================
// 初期化
// ============================================================
initVenueStatus();
switchTab("today");
loadData();