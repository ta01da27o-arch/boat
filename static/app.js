// ============================
// 競艇AI予想アプリ（フロント版・修正版）
// ============================

const DATA_URL = window.DATA_PATH || "../data/data.json";
const HISTORY_URL = window.HISTORY_PATH || "../data/history.json";

// 要素取得
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMainTable = document.getElementById("aiMain").querySelector("tbody");
const aiSubTable = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");
const resultNote = document.getElementById("resultNote");

const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

let globalData = {};
let globalHistory = {};
let currentVenue = null;
let currentRace = null;

// ============================
// 日付操作ユーティリティ
// ============================
let viewDate = new Date();

function formatDate(d) {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function setDateLabel() {
  dateLabel.textContent = formatDate(viewDate);
}

// ============================
// 初期化
// ============================
window.addEventListener("DOMContentLoaded", async () => {
  setDateLabel();
  await loadData();
  renderVenues();
});

// ============================
// データ読み込み
// ============================
async function loadData() {
  aiStatus.textContent = "AIデータ更新中…";

  try {
    const [dataRes, historyRes] = await Promise.all([
      fetch(DATA_URL + "?t=" + Date.now()),
      fetch(HISTORY_URL + "?t=" + Date.now())
    ]);

    globalData = await dataRes.json();
    globalHistory = await historyRes.json();

    aiStatus.textContent = "AI更新完了 ✅";
  } catch (err) {
    console.error("データ読み込み失敗:", err);
    aiStatus.textContent = "⚠️ データ取得エラー";
  }
}

// ============================
// 画面切替
// ============================
function showScreen(screen) {
  [screenVenues, screenRaces, screenDetail].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// ============================
// 競艇場一覧表示
// ============================
function renderVenues() {
  venuesGrid.innerHTML = "";

  Object.keys(globalData).forEach(name => {
    const info = globalData[name];
    const status = info?.status || "ー";
    const hitRate = info?.hit_rate ?? 0;

    const card = document.createElement("button");
    card.className = "venue-card";

    // 開催状況による制御
    if (status === "開催中") {
      card.classList.add("active");
      card.disabled = false;
      card.style.opacity = "1";
    } else {
      card.classList.add("inactive");
      card.disabled = true;
      card.style.opacity = "0.5";
    }

    // ✅ デザイン整理：場名・開催状況・的中率
    card.innerHTML = `
      <div class="venue-name">${name}</div>
      <div class="venue-status">${status}</div>
      <div class="venue-hit">${hitRate}%</div>
    `;

    card.addEventListener("click", () => {
      if (status === "開催中") {
        currentVenue = name;
        renderRaces();
        showScreen(screenRaces);
      }
    });

    venuesGrid.appendChild(card);
  });
}

// ============================
// レース番号画面
// ============================
function renderRaces() {
  racesGrid.innerHTML = "";
  venueTitle.textContent = currentVenue;

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => {
      currentRace = String(i);
      renderRaceDetail();
      showScreen(screenDetail);
    });
    racesGrid.appendChild(btn);
  }
}

// ============================
// 出走表詳細
// ============================
function renderRaceDetail() {
  const venueData = globalData[currentVenue];
  const raceData = venueData?.races?.[currentRace] || [];
  raceTitle.textContent = `${currentVenue} ${currentRace}R`;

  entryTable.innerHTML = "";
  raceData.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.number}</td>
      <td>${r.grade} / ${r.name}</td>
      <td>${r.st}</td>
      <td>${r.f}</td>
      <td>${r.all}</td>
      <td>${r.local}</td>
      <td>${r.mt}</td>
      <td>${r.course}</td>
      <td>${r.eval}</td>
    `;
    entryTable.appendChild(tr);
  });

  // AI情報仮表示
  aiMainTable.innerHTML = "";
  aiSubTable.innerHTML = "";
  raceData.slice(0, 3).forEach(r => {
    aiMainTable.innerHTML += `<tr><td>${r.number}</td><td>${Math.floor(Math.random() * 90)}%</td></tr>`;
  });
  raceData.slice(3, 6).forEach(r => {
    aiSubTable.innerHTML += `<tr><td>${r.number}</td><td>${Math.floor(Math.random() * 60)}%</td></tr>`;
  });

  // コメント
  commentTable.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    commentTable.innerHTML += `<tr><td>${i}</td><td>${generateComment(i)}</td></tr>`;
  }

  // 順位予測
  rankingTable.innerHTML = "";
  [...raceData].sort(() => Math.random() - 0.5).forEach((r, idx) => {
    rankingTable.innerHTML += `<tr><td>${idx + 1}</td><td>${r.number}</td><td>${r.name}</td></tr>`;
  });

  renderResult();
}

// ============================
// 結果表示
// ============================
function renderResult() {
  resultTable.innerHTML = "";
  const venueHist = globalHistory[currentVenue];
  const raceHist = venueHist?.[currentRace];

  if (!raceHist) {
    resultNote.textContent = "※ レース結果なし";
    return;
  }

  raceHist.forEach((r, idx) => {
    resultTable.innerHTML += `<tr><td>${idx + 1}</td><td>${r.number}</td><td>${r.name}</td><td>${r.st}</td></tr>`;
  });

  resultNote.textContent = "※ 最新レース結果を表示";
}

// ============================
// コメント生成（簡易版）
// ============================
function generateComment(course) {
  const patterns = [
    "スタート決めて逃げ切り",
    "差し構え",
    "まくり勝負",
    "展開ついて差し",
    "外から強襲",
    "冷静に様子見"
  ];
  return patterns[(course - 1) % patterns.length];
}

// ============================
// イベント
// ============================
backToVenues.addEventListener("click", () => showScreen(screenVenues));
backToRaces.addEventListener("click", () => showScreen(screenRaces));
refreshBtn.addEventListener("click", async () => {
  await loadData();
  renderVenues();
});

todayBtn.addEventListener("click", () => {
  viewDate = new Date();
  setDateLabel();
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
});

yesterdayBtn.addEventListener("click", () => {
  viewDate = new Date();
  viewDate.setDate(viewDate.getDate() - 1);
  setDateLabel();
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
});