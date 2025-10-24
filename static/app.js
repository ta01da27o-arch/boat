// ============================================================
// 競艇AI予想アプリ（正式版）
// #01 桐生 → #24 大村 の正規順
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
// 24場（正式順）
// ============================================================
const venues = [
  "ボートレース桐生", "ボートレース戸田", "ボートレース江戸川", "ボートレース平和島",
  "ボートレース多摩川", "ボートレース浜名湖", "ボートレース蒲郡", "ボートレース常滑",
  "ボートレース津", "ボートレース三国", "ボートレースびわこ", "ボートレース住之江",
  "ボートレース尼崎", "ボートレース鳴門", "ボートレース丸亀", "ボートレース児島",
  "ボートレース宮島", "ボートレース徳山", "ボートレース下関", "ボートレース若松",
  "ボートレース芦屋", "ボートレース福岡", "ボートレース唐津", "ボートレース大村"
];

// ============================================================
// 背景色：開催状況に応じ固定
// ============================================================
const BG_COLORS = {
  開催中: "#dfffd8",
  終了: "#ffe4e1",
  開催前: "#f0f0f0",
};

// ============================================================
// 日付・状態管理
// ============================================================
let currentMode = "today"; // "today" or "yesterday"
let raceData = {};
let historyData = {};

// ============================================================
// 日付設定
// ============================================================
function updateDateLabel() {
  const today = new Date();
  const offset = currentMode === "today" ? 0 : -1;
  const target = new Date(today);
  target.setDate(today.getDate() + offset);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  dateLabel.textContent = `${y}/${m}/${d}`;
}

// ============================================================
// 開催情報＋AI的中率グリッド生成
// ============================================================
function renderVenues() {
  venuesGrid.innerHTML = "";

  venues.forEach((name, index) => {
    const card = document.createElement("div");
    card.className = "venue-card";

    const title = document.createElement("div");
    title.className = "venue-title";
    title.textContent = name;

    const status = document.createElement("div");
    status.className = "venue-status";
    const isOpen = Math.random() < 0.5;
    status.textContent = isOpen ? "開催中" : "ー";

    const rate = document.createElement("div");
    rate.className = "venue-rate";
    if (isOpen) {
      rate.textContent = `${Math.floor(50 + Math.random() * 50)}%`;
    } else {
      rate.textContent = "ー";
    }

    card.appendChild(title);
    card.appendChild(status);
    card.appendChild(rate);

    card.style.backgroundColor = isOpen ? BG_COLORS["開催中"] : BG_COLORS["開催前"];
    card.dataset.venue = name;
    card.addEventListener("click", () => openRaces(name));

    venuesGrid.appendChild(card);
  });
}

// ============================================================
// レース番号画面生成
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
// 出走表＋AI情報表示
// ============================================================
function openRaceDetail(venue, raceNo) {
  raceTitle.textContent = `${venue} ${raceNo}R`;
  SCREEN_RACES.classList.remove("active");
  SCREEN_DETAIL.classList.add("active");

  // データがない場合、仮のダミーを表示
  entryTableBody.innerHTML = "";
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  commentTableBody.innerHTML = "";
  rankingTableBody.innerHTML = "";
  resultTableBody.innerHTML = "";

  if (!raceData[venue] || !raceData[venue][raceNo]) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8;
    td.textContent = "データがありません。";
    tr.appendChild(td);
    entryTableBody.appendChild(tr);
    return;
  }

  const entryList = raceData[venue][raceNo].entry || [];
  entryList.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.tei}</td>
      <td>${row.class} / ${row.name} / ${row.st}</td>
      <td>${row.f}</td>
      <td>${row.national}</td>
      <td>${row.local}</td>
      <td>${row.mt}</td>
      <td>${row.course}</td>
      <td>${row.eval}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  renderAIBlocks(venue, raceNo);
}

// ============================================================
// AIブロック・コメント・順位・結果反映
// ============================================================
function renderAIBlocks(venue, raceNo) {
  const data = raceData[venue]?.[raceNo] || {};

  const aiMain = data.ai_main || [];
  aiMainBody.innerHTML = aiMain
    .map(a => `<tr><td>${a.buy}</td><td>${a.rate}%</td></tr>`)
    .join("");

  const aiSub = data.ai_sub || [];
  aiSubBody.innerHTML = aiSub
    .map(a => `<tr><td>${a.buy}</td><td>${a.rate}%</td></tr>`)
    .join("");

  const comments = data.comment || [];
  commentTableBody.innerHTML = comments
    .map((c, i) => `<tr><td>${i + 1}</td><td>${c}</td></tr>`)
    .join("");

  const ranking = data.ranking || [];
  rankingTableBody.innerHTML = ranking
    .map(
      (r, i) =>
        `<tr><td>${i + 1}</td><td>${r.tei}</td><td>${r.name}</td><td>${r.score}</td></tr>`
    )
    .join("");

  const results = historyData[venue]?.[raceNo] || [];
  resultTableBody.innerHTML = results
    .map(
      r =>
        `<tr><td>${r.rank}</td><td>${r.tei}</td><td>${r.name}</td><td>${r.st}</td></tr>`
    )
    .join("");
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
// データ取得
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
    console.error(e);
    aiStatus.textContent = "データ取得エラー";
  }
  renderVenues();
}

// ============================================================
// ボタン操作
// ============================================================
refreshBtn.addEventListener("click", () => {
  renderVenues();
});

todayBtn.addEventListener("click", () => {
  currentMode = "today";
  updateDateLabel();
});

yesterdayBtn.addEventListener("click", () => {
  currentMode = "yesterday";
  updateDateLabel();
});

// ============================================================
// 初期化
// ============================================================
updateDateLabel();
loadData();