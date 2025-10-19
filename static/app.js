// app.js
// 競艇AI予想アプリ：data/data.jsonを反映するメインスクリプト

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const dateLabel = document.getElementById("dateLabel");

const raceTitle = document.getElementById("raceTitle");
const venueTitle = document.getElementById("venueTitle");

const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMain = document.getElementById("aiMain").querySelector("tbody");
const aiSub = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");

// 📂 JSONファイルのURL（Render用に相対パス指定）
const DATA_URL = "data/data.json";

// 📅 日付ラベル設定
const today = new Date();
const dateStr = today.toISOString().split("T")[0].replace(/-/g, "/");
dateLabel.textContent = dateStr;

// グローバル変数
let allData = [];
let selectedVenue = null;

// --------------------------------------------------
// 初期化
// --------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  fetchData();
});

refreshBtn.addEventListener("click", () => {
  aiStatus.textContent = "再取得中...";
  fetchData(true);
});

// --------------------------------------------------
// JSONデータ取得
// --------------------------------------------------
async function fetchData(forceReload = false) {
  try {
    const response = await fetch(DATA_URL + (forceReload ? `?t=${Date.now()}` : ""));
    if (!response.ok) throw new Error("データ取得に失敗しました");
    allData = await response.json();

    aiStatus.textContent = "✅ データ取得完了";
    renderVenues(allData);
  } catch (err) {
    console.error(err);
    aiStatus.textContent = "⚠ データ取得エラー";
    venuesGrid.innerHTML = `<p style="color:red;">データを取得できませんでした。</p>`;
  }
}

// --------------------------------------------------
// 24場一覧を生成
// --------------------------------------------------
function renderVenues(data) {
  const venues = [...new Set(data.map(item => item.venue))];
  venuesGrid.innerHTML = "";

  venues.forEach(venue => {
    const btn = document.createElement("button");
    btn.className = "venue-btn";
    btn.textContent = venue;
    btn.addEventListener("click", () => showRaces(venue));
    venuesGrid.appendChild(btn);
  });

  showScreen("venues");
}

// --------------------------------------------------
// 選択された場のレース一覧を表示
// --------------------------------------------------
function showRaces(venue) {
  selectedVenue = venue;
  venueTitle.textContent = `${venue} のレース一覧`;
  racesGrid.innerHTML = "";

  const races = allData.filter(item => item.venue === venue);

  races.forEach(r => {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${r.race}R`;
    btn.addEventListener("click", () => showRaceDetail(r));
    racesGrid.appendChild(btn);
  });

  showScreen("races");
}

// --------------------------------------------------
// 出走表・AI予想などの詳細画面を表示
// --------------------------------------------------
function showRaceDetail(raceData) {
  raceTitle.textContent = `${raceData.venue} 第${raceData.race}R`;

  // 仮出走表
  entryTable.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i}</td>
      <td>選手${i} / A${i}級 / ST:${(Math.random()*0.2+0.05).toFixed(2)}</td>
      <td>${Math.random() < 0.1 ? "F1" : "-"}</td>
      <td>${(6.0 + Math.random()).toFixed(2)}</td>
      <td>${(6.0 + Math.random()).toFixed(2)}</td>
      <td>${(0.15 + Math.random()*0.1).toFixed(2)}</td>
      <td>${i}</td>
      <td>${["◎","◯","▲","△","☆","×"][i-1]}</td>
    `;
    entryTable.appendChild(tr);
  }

  // AI予想（仮）
  aiMain.innerHTML = `
    <tr><td>1-2-3</td><td>42%</td></tr>
    <tr><td>1-3-2</td><td>31%</td></tr>
    <tr><td>2-1-3</td><td>17%</td></tr>
  `;
  aiSub.innerHTML = `
    <tr><td>3-1-2</td><td>6%</td></tr>
    <tr><td>4-1-2</td><td>4%</td></tr>
  `;

  // 展開コメント（仮）
  commentTable.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i}</td><td>${["逃げ有力","差し警戒","まくり警戒","自在戦","スタート勝負","展開待ち"][i-1]}</td>`;
    commentTable.appendChild(tr);
  }

  // AI順位（仮）
  rankingTable.innerHTML = "";
  [1,2,3,4,5,6].forEach((i, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx+1}</td><td>${i}</td><td>選手${i}</td><td>${(80 - idx*5).toFixed(1)}</td>`;
    rankingTable.appendChild(tr);
  });

  // 最新結果（仮）
  resultTable.innerHTML = "";
  for (let i = 1; i <= 3; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i}</td><td>${i}</td><td>選手${i}</td><td>${(0.1 + Math.random()*0.1).toFixed(2)}</td>`;
    resultTable.appendChild(tr);
  }

  showScreen("detail");
}

// --------------------------------------------------
// 画面切り替え
// --------------------------------------------------
function showScreen(name) {
  [screenVenues, screenRaces, screenDetail].forEach(s => s.classList.remove("active"));
  if (name === "venues") screenVenues.classList.add("active");
  if (name === "races") screenRaces.classList.add("active");
  if (name === "detail") screenDetail.classList.add("active");
}

// --------------------------------------------------
// 戻るボタン
// --------------------------------------------------
document.getElementById("backToVenues").addEventListener("click", () => {
  showScreen("venues");
});
document.getElementById("backToRaces").addEventListener("click", () => {
  showScreen("races");
});