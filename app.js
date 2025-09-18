// -------------------------------
// app.js （差し替え一発OK版）
// -------------------------------

// データ保持
let DATA = [];

// 現在の選択状態
let currentVenue = null;
let currentRace = null;

// DOM 要素取得
const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_DETAIL = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.getElementById("entryTable").querySelector("tbody");

const aiMain = document.getElementById("aiMain").querySelector("tbody");
const aiSub = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const refreshBtn = document.getElementById("refreshBtn");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

// -------------------------------
// データ取得
// -------------------------------
async function loadData() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("データ取得失敗");
    DATA = await res.json();
    renderVenues();
  } catch (err) {
    console.error(err);
    venuesGrid.innerHTML = `<p style="color:red;">データを取得できませんでした。</p>`;
  }
}

// -------------------------------
// 会場一覧描画
// -------------------------------
function renderVenues() {
  SCREEN_VENUES.classList.add("active");
  SCREEN_RACES.classList.remove("active");
  SCREEN_DETAIL.classList.remove("active");

  venuesGrid.innerHTML = "";

  // 会場番号ごとにユニーク化
  const venues = [...new Set(DATA.map(r => r.race_stadium_number))];
  venues.forEach(num => {
    const btn = document.createElement("button");
    btn.textContent = `会場 ${num}`;
    btn.className = "btn venue-btn";
    btn.onclick = () => openVenue(num);
    venuesGrid.appendChild(btn);
  });
}

// -------------------------------
// 会場を開く
// -------------------------------
function openVenue(venueNum) {
  currentVenue = venueNum;
  venueTitle.textContent = `会場 ${venueNum}`;

  SCREEN_VENUES.classList.remove("active");
  SCREEN_RACES.classList.add("active");
  SCREEN_DETAIL.classList.remove("active");

  racesGrid.innerHTML = "";

  const races = DATA.filter(r => r.race_stadium_number === venueNum);
  races.forEach(race => {
    const btn = document.createElement("button");
    btn.textContent = `${race.race_number}R`;
    btn.className = "btn race-btn";
    btn.onclick = () => openRace(race);
    racesGrid.appendChild(btn);
  });
}

// -------------------------------
// レースを開く
// -------------------------------
function openRace(race) {
  currentRace = race;

  SCREEN_VENUES.classList.remove("active");
  SCREEN_RACES.classList.remove("active");
  SCREEN_DETAIL.classList.add("active");

  raceTitle.textContent = `会場 ${race.race_stadium_number} 第${race.race_number}R`;

  // 出走表描画
  entryTable.innerHTML = "";
  race.boats.forEach(boat => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${boat.lane}</td>
      <td>${boat.player}</td>
      <td>${boat.odds !== null ? boat.odds : "-"}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    `;
    entryTable.appendChild(tr);
  });

  // AI予想（先頭5件＝本命、後半5件＝穴）
  aiMain.innerHTML = "";
  aiSub.innerHTML = "";
  if (race.ai_prediction && race.ai_prediction.length) {
    race.ai_prediction.slice(0, 5).forEach(pred => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${pred}</td><td>-</td>`;
      aiMain.appendChild(tr);
    });
    race.ai_prediction.slice(5, 10).forEach(pred => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${pred}</td><td>-</td>`;
      aiSub.appendChild(tr);
    });
  }

  // コース別コメント（簡易：固定 or ランダム生成）
  commentTable.innerHTML = "";
  race.boats.forEach(boat => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${boat.lane}コース</td>
      <td>${generateComment(boat)}</td>
    `;
    commentTable.appendChild(tr);
  });
}

// -------------------------------
// コメント生成（簡易）
// -------------------------------
function generateComment(boat) {
  const templates = [
    "スタートに注目",
    "展開次第でチャンスあり",
    "インから有利か",
    "差しが決まるか",
    "要注意の一艇",
    "波乱を起こすかも"
  ];
  const idx = Math.floor(Math.random() * templates.length);
  return templates[idx];
}

// -------------------------------
// 戻るボタン
// -------------------------------
backToVenues.addEventListener("click", () => {
  renderVenues();
});

backToRaces.addEventListener("click", () => {
  openVenue(currentVenue);
});

// -------------------------------
// 更新ボタン
// -------------------------------
refreshBtn.addEventListener("click", loadData);

// -------------------------------
// 初期化
// -------------------------------
document.addEventListener("DOMContentLoaded", loadData);