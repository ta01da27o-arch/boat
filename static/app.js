// app.js : 競艇AI予想アプリ（完全統合版）

// ================================
// 初期設定
// ================================
const VENUES = [
  "桐生","戸田","江戸川","平和島","多摩川",
  "浜名湖","蒲郡","常滑","津",
  "三国","びわこ","住之江","尼崎",
  "鳴門","丸亀","児島","宮島","徳山","下関",
  "若松","芦屋","福岡","唐津","大村"
];

const venueGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

// ================================
// 状態管理
// ================================
let currentVenue = null;
let currentDateMode = "today"; // "today" or "yesterday"
let jsonData = {};
let historyData = {};
let todayStr = "";

// ================================
// 初期ロード
// ================================
window.addEventListener("DOMContentLoaded", async () => {
  todayStr = new Date().toLocaleDateString("ja-JP");
  dateLabel.textContent = todayStr;

  await loadData();
  renderVenues();

  aiStatus.textContent = "AI稼働中";
});

// ================================
// データ取得
// ================================
async function loadData() {
  aiStatus.textContent = "データ読込中...";
  try {
    const res1 = await fetch("./data/data.json", { cache: "no-store" });
    jsonData = await res1.json();

    const res2 = await fetch("./data/history.json", { cache: "no-store" });
    historyData = await res2.json();

    aiStatus.textContent = "AI稼働中";
  } catch (err) {
    console.error("データ読込失敗", err);
    aiStatus.textContent = "データ読込失敗";
  }
}

// ================================
// 24場一覧表示
// ================================
function renderVenues() {
  venueGrid.innerHTML = "";
  VENUES.forEach((v, i) => {
    const div = document.createElement("div");
    div.className = "venue-card";

    const venueNo = String(i + 1).padStart(2, "0");
    const hitRate = randomHitRate();
    const status = "-"; // 開催中 → "-" で固定

    div.innerHTML = `
      <div class="venue-name">#${venueNo} ${v}</div>
      <div class="venue-status">${status}</div>
      <div class="venue-hit">AI的中率: <span>${hitRate}%</span></div>
    `;
    // 色分け
    if (hitRate >= 70) div.classList.add("rank-A");
    else if (hitRate >= 40) div.classList.add("rank-B");
    else div.classList.add("rank-C");

    div.addEventListener("click", () => openVenue(v));
    venueGrid.appendChild(div);
  });
}

// ================================
// AI的中率：ランダム値
// ================================
function randomHitRate() {
  return Math.floor(Math.random() * 100);
}

// ================================
// 場を開く → レース一覧
// ================================
function openVenue(v) {
  currentVenue = v;
  screenVenues.classList.remove("active");
  screenRaces.classList.add("active");
  venueTitle.textContent = v;
  renderRaces(v);
}

// ================================
// レース一覧（12R）
// ================================
function renderRaces(v) {
  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => openRace(v, i));
    racesGrid.appendChild(btn);
  }
}

// ================================
// レース詳細画面
// ================================
function openRace(v, raceNo) {
  screenRaces.classList.remove("active");
  screenDetail.classList.add("active");
  raceTitle.textContent = `${v} ${raceNo}R`;

  const entries = (jsonData[v] && jsonData[v][raceNo]) ? jsonData[v][raceNo] : [];
  renderEntryTable(entries);
  renderAiPrediction(entries);
  renderComments(entries);
  renderRanking(entries);
  renderResults(v, raceNo);
}

// ================================
// 出走表
// ================================
function renderEntryTable(entries) {
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";
  entries.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.number}</td>
      <td>${e.grade || "-"} / ${e.name || "-"} / ${e.st || "-"}</td>
      <td>${e.f || "-"}</td>
      <td>${e.all || "-"}</td>
      <td>${e.local || "-"}</td>
      <td>${e.mt || "-"}</td>
      <td>${e.course || "-"}</td>
      <td>${e.eval || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ================================
// AI予想（本命・穴）
// ================================
function renderAiPrediction(entries) {
  const main = document.querySelector("#aiMain tbody");
  const sub = document.querySelector("#aiSub tbody");
  main.innerHTML = "";
  sub.innerHTML = "";
  if (entries.length === 0) return;

  for (let i = 0; i < 3; i++) {
    main.innerHTML += `<tr><td>${i + 1}-着固定</td><td>${randomHitRate()}%</td></tr>`;
    sub.innerHTML += `<tr><td>穴-${i + 1}</td><td>${randomHitRate()}%</td></tr>`;
  }
}

// ================================
// 展開予想コメント
// ================================
function renderComments(entries) {
  const tbody = document.querySelector("#commentTable tbody");
  tbody.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    tbody.innerHTML += `<tr><td>${i}</td><td>${randomComment()}</td></tr>`;
  }
}

function randomComment() {
  const list = [
    "スタート決めて逃げ濃厚",
    "差し構えで展開待ち",
    "捲り一撃狙う",
    "冷静に差し構える",
    "内寄りから展開伺う",
    "展開頼みの外伸び勝負"
  ];
  return list[Math.floor(Math.random() * list.length)];
}

// ================================
// AI順位予測
// ================================
function renderRanking(entries) {
  const tbody = document.querySelector("#rankingTable tbody");
  tbody.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const e = entries[i] || {};
    tbody.innerHTML += `
      <tr><td>${i + 1}</td><td>${e.number || "-"}</td><td>${e.name || "-"}</td><td>${randomHitRate()}</td></tr>
    `;
  }
}

// ================================
// レース結果（history.json）
// ================================
function renderResults(v, raceNo) {
  const tbody = document.querySelector("#resultTable tbody");
  tbody.innerHTML = "";
  const data = (historyData[v] && historyData[v][raceNo]) ? historyData[v][raceNo] : [];
  data.forEach((r, i) => {
    tbody.innerHTML += `
      <tr><td>${i + 1}</td><td>${r.number}</td><td>${r.name}</td><td>${r.st}</td></tr>
    `;
  });
}

// ================================
// イベント処理
// ================================
document.getElementById("backToVenues").addEventListener("click", () => {
  screenRaces.classList.remove("active");
  screenVenues.classList.add("active");
});
document.getElementById("backToRaces").addEventListener("click", () => {
  screenDetail.classList.remove("active");
  screenRaces.classList.add("active");
});

refreshBtn.addEventListener("click", async () => {
  aiStatus.textContent = "更新中...";
  await loadData();
  renderVenues();
  aiStatus.textContent = "AI稼働中";
});

todayBtn.addEventListener("click", () => switchDate("today"));
yesterdayBtn.addEventListener("click", () => switchDate("yesterday"));

function switchDate(mode) {
  currentDateMode = mode;
  todayBtn.classList.toggle("active", mode === "today");
  yesterdayBtn.classList.toggle("active", mode === "yesterday");

  const d = new Date();
  if (mode === "yesterday") d.setDate(d.getDate() - 1);
  dateLabel.textContent = d.toLocaleDateString("ja-JP");
  // 色などは維持
}

// ================================
// スタイル補助（最低限）
// ================================
const style = document.createElement("style");
style.textContent = `
.venue-card {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 8px;
  text-align: center;
  font-size: 0.9rem;
  cursor: pointer;
  transition: 0.2s;
}
.venue-card:hover { transform: scale(1.03); }
.rank-A { background: rgba(255,0,0,0.15); }
.rank-B { background: rgba(255,165,0,0.15); }
.rank-C { background: rgba(0,0,255,0.1); }
.venue-grid {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 8px;
}
`;
document.head.appendChild(style);