// ============================
// 競艇AI予想アプリ（フロント版）
// ============================

// ✅ データパス設定（index.html の <script> 内で指定される）
const DATA_URL = window.DATA_PATH || "../data/data.json";
const HISTORY_URL = window.HISTORY_PATH || "../data/history.json";

// ============================
// 要素取得
// ============================
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

// ============================
// グローバル変数
// ============================
let globalData = {};
let globalHistory = {};
let currentVenue = null;
let currentRace = null;

// ============================
// 初期化
// ============================
window.addEventListener("DOMContentLoaded", async () => {
  const now = new Date();
  dateLabel.textContent = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;

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
// 画面遷移制御
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

  const venues = Object.keys(globalData);
  venues.forEach(name => {
    const info = globalData[name];
    const status = info?.status || "ー";
    const hitRate = info?.hit_rate || 0;

    const card = document.createElement("button");
    card.className = "venue-card";

    // ✅ 開催中と非開催（ー）でスタイルを変える
    if (status === "開催中") {
      card.classList.add("active");
    } else {
      card.classList.add("inactive");
      card.disabled = true; // タップ不可
      card.style.opacity = "0.5";
    }

    card.innerHTML = `
      <div class="venue-name">${name}</div>
      <div class="venue-meta">
        <span class="status">${status}</span>
        <span class="hit">的中率: ${hitRate}%</span>
      </div>
    `;

    card.addEventListener("click", () => {
      if (status !== "ー") {
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
// 出走表詳細画面
// ============================
function renderRaceDetail() {
  const venueData = globalData[currentVenue];
  const raceData = venueData?.races?.[currentRace] || [];
  raceTitle.textContent = `${currentVenue} ${currentRace}R`;

  // 出走表
  entryTable.innerHTML = "";
  raceData.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.number}</td>
      <td>${r.grade} / ${r.name} / ${r.st}</td>
      <td>${r.f}</td>
      <td>${r.all}</td>
      <td>${r.local}</td>
      <td>${r.mt}</td>
      <td>${r.course}</td>
      <td>${r.eval}</td>
    `;
    entryTable.appendChild(tr);
  });

  // AI本命・穴（ダミー生成）
  aiMainTable.innerHTML = "";
  aiSubTable.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    aiMainTable.innerHTML += `<tr><td>${raceData[i]?.number || "-"}</td><td>${Math.floor(Math.random() * 90)}%</td></tr>`;
    aiSubTable.innerHTML += `<tr><td>${raceData[i + 3]?.number || "-"}</td><td>${Math.floor(Math.random() * 60)}%</td></tr>`;
  }

  // 展開コメント（例: コース別コメントをランダム生成）
  commentTable.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    const cmt = generateComment(i);
    commentTable.innerHTML += `<tr><td>${i}</td><td>${cmt}</td></tr>`;
  }

  // 順位予測（ランダム例）
  rankingTable.innerHTML = "";
  const sorted = [...raceData].sort(() => Math.random() - 0.5);
  sorted.forEach((r, idx) => {
    rankingTable.innerHTML += `<tr><td>${idx + 1}</td><td>${r.number}</td><td>${r.name}</td><td>${(Math.random() * 10).toFixed(2)}</td></tr>`;
  });

  // 最新レース結果（history.json）
  renderResult();
}

// ============================
// 最新レース結果
// ============================
function renderResult() {
  resultTable.innerHTML = "";
  const venueHist = globalHistory[currentVenue];
  const raceHist = venueHist?.[currentRace];

  if (!raceHist) {
    resultNote.textContent = "※ レース結果はまだありません。";
    return;
  }

  raceHist.forEach((r, idx) => {
    resultTable.innerHTML += `<tr>
      <td>${idx + 1}</td>
      <td>${r.number}</td>
      <td>${r.name}</td>
      <td>${r.st}</td>
    </tr>`;
  });

  resultNote.textContent = "※ 前日または本日終了レースを自動反映";
}

// ============================
// コメント自動生成（ダミー）
// ============================
function generateComment(course) {
  const patterns = [
    "スタート決めて逃げ切り狙い",
    "差し一閃の構え",
    "カドから一撃狙い",
    "展開ついて内差し",
    "外から強襲あり",
    "冷静に展開待ち"
  ];
  return patterns[(course - 1) % patterns.length];
}

// ============================
// イベントリスナー
// ============================
backToVenues.addEventListener("click", () => showScreen(screenVenues));
backToRaces.addEventListener("click", () => showScreen(screenRaces));
refreshBtn.addEventListener("click", async () => {
  await loadData();
  renderVenues();
});

// 前日・本日ボタンは暫定
todayBtn.addEventListener("click", () => {
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
});
yesterdayBtn.addEventListener("click", () => {
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
});