// ✅ app.js（統合最終版）
// データ連動・AI的中率付き・24場固定グリッド対応

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMainTable = document.getElementById("aiMain").querySelector("tbody");
const aiSubTable = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const dateLabel = document.getElementById("dateLabel");
const aiStatus = document.getElementById("aiStatus");
const refreshBtn = document.getElementById("refreshBtn");

const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");

let allData = {};
let historyData = {};
let currentVenue = null;
let currentRace = null;
let dateMode = "today"; // "today" or "yesterday"

// 24場リスト固定
const VENUES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","唐津","大村","福岡"
];

// 🕒 日付処理
const today = new Date();
const yesterday = new Date(today.getTime() - 86400000);
const YYYYMMDD = (date) => date.toISOString().split("T")[0].replace(/-/g, "");
const todayStr = YYYYMMDD(today);
const ydayStr = YYYYMMDD(yesterday);

// 📦 データ取得
async function loadData() {
  aiStatus.textContent = "データ取得中...";
  try {
    const [dataRes, histRes] = await Promise.all([
      fetch(window.DATA_PATH || "./data/data.json").then(r => r.json()),
      fetch(window.HISTORY_PATH || "./data/history.json").then(r => r.json())
    ]);
    allData = dataRes;
    historyData = histRes;
    renderVenues();
    aiStatus.textContent = "AI連動完了";
  } catch (e) {
    console.error(e);
    aiStatus.textContent = "データ取得エラー";
  }
}

// 🟦 24場グリッド描画
function renderVenues() {
  venuesGrid.innerHTML = "";
  const targetDate = (dateMode === "today") ? todayStr : ydayStr;
  dateLabel.textContent = targetDate.slice(0,4) + "/" + targetDate.slice(4,6) + "/" + targetDate.slice(6);

  VENUES.forEach(venue => {
    const vData = allData[venue];
    const hData = historyData[venue];
    let status = "ー", clickable = false, rate = "-";

    if (vData && vData.date === targetDate) {
      const hasRaces = vData.races && Object.keys(vData.races).length > 0;
      status = hasRaces ? "開催中" : "ー";
      clickable = hasRaces;
    }

    if (hData && hData.hitRate !== undefined) rate = hData.hitRate + "%";

    const card = document.createElement("div");
    card.className = "venue-card";
    card.innerHTML = `
      <div class="v-name">${venue}</div>
      <div class="v-status">${status}</div>
      <div class="v-rate">${rate}</div>
    `;

    if (clickable) {
      card.classList.add("clickable");
      card.addEventListener("click", () => openVenue(venue, vData));
      card.style.background = "linear-gradient(180deg,#e6f7ff,#ffffff)";
    } else {
      card.classList.add("disabled");
      card.style.background = "#f5f5f5";
      card.style.color = "#999";
    }

    venuesGrid.appendChild(card);
  });
}

// 🏁 各場 → レース番号画面へ
function openVenue(venue, data) {
  currentVenue = venue;
  venueTitle.textContent = venue;
  racesGrid.innerHTML = "";

  const races = data.races || {};
  for (let i = 1; i <= 12; i++) {
    const rKey = `${i}R`;
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = rKey;

    if (races[rKey]) {
      btn.classList.add("active");
      btn.addEventListener("click", () => openRace(rKey, races[rKey]));
    } else {
      btn.disabled = true;
      btn.classList.add("disabled");
    }
    racesGrid.appendChild(btn);
  }

  switchScreen(screenRaces);
}

// 🧭 レース詳細画面へ
function openRace(rKey, raceData) {
  currentRace = rKey;
  raceTitle.textContent = `${currentVenue} ${rKey}`;
  renderEntry(raceData.entries || []);
  renderPredictions(raceData.predictions || {});
  renderComments(raceData.comments || []);
  renderRanking(raceData.rankings || []);
  renderResult(raceData.results || []);
  switchScreen(screenDetail);
}

// 出走表
function renderEntry(entries) {
  entryTable.innerHTML = "";
  entries.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.number}</td>
      <td>${e.class} / ${e.name} / ${e.st}</td>
      <td>${e.f}</td>
      <td>${e.national}</td>
      <td>${e.local}</td>
      <td>${e.mt}</td>
      <td>${e.course}</td>
      <td>${e.rating}</td>
    `;
    entryTable.appendChild(tr);
  });
}

// AI予想
function renderPredictions(pred) {
  aiMainTable.innerHTML = "";
  aiSubTable.innerHTML = "";

  if (pred.main) {
    pred.main.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.combo}</td><td>${p.rate}%</td>`;
      aiMainTable.appendChild(tr);
    });
  }
  if (pred.sub) {
    pred.sub.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.combo}</td><td>${p.rate}%</td>`;
      aiSubTable.appendChild(tr);
    });
  }
}

// コメント
function renderComments(list) {
  commentTable.innerHTML = "";
  list.forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${c}</td>`;
    commentTable.appendChild(tr);
  });
}

// 順位予測
function renderRanking(list) {
  rankingTable.innerHTML = "";
  list.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.value}</td>`;
    rankingTable.appendChild(tr);
  });
}

// 結果
function renderResult(list) {
  resultTable.innerHTML = "";
  list.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i + 1}</td><td>${r.boat}</td><td>${r.name}</td><td>${r.st}</td>`;
    resultTable.appendChild(tr);
  });
}

// 画面切替
function switchScreen(target) {
  [screenVenues, screenRaces, screenDetail].forEach(s => s.classList.remove("active"));
  target.classList.add("active");
}

// イベント
document.getElementById("backToVenues").addEventListener("click", () => switchScreen(screenVenues));
document.getElementById("backToRaces").addEventListener("click", () => switchScreen(screenRaces));
refreshBtn.addEventListener("click", loadData);

todayBtn.addEventListener("click", () => {
  dateMode = "today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  renderVenues();
});

yesterdayBtn.addEventListener("click", () => {
  dateMode = "yesterday";
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  renderVenues();
});

// 初期起動
loadData();