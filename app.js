// ===============================
// 要素取得
// ===============================
const screenVenues = document.getElementById("screen-venues"); // 場一覧
const screenRaces = document.getElementById("screen-races");   // レース一覧
const screenDetail = document.getElementById("screen-detail"); // 出走表

const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const backBtnRace = document.getElementById("backBtnRace");
const backBtnDetail = document.getElementById("backBtnDetail");

const venueList = document.getElementById("venueList");
const raceList = document.getElementById("raceList");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiCommentDiv = document.getElementById("aiComment");

// ===============================
// データ保持
// ===============================
let raceData = [];
let selectedDate = "";
let selectedVenue = "";

// ===============================
// データロード
// ===============================
async function loadRaceData() {
  try {
    const res = await fetch("data.json?nocache=" + Date.now());
    const json = await res.json();

    if (json && json.races && Array.isArray(json.races.programs)) {
      raceData = json.races.programs;
    } else {
      throw new Error("JSON形式エラー: races.programs が配列でない");
    }

    // 初期は当日
    selectedDate = getToday();
    todayBtn.classList.add("active");
    yesterdayBtn.classList.remove("active");

    showVenueList();
  } catch (e) {
    venueList.innerHTML = `<li>データ取得失敗: ${e}</li>`;
    console.error("データ読み込み失敗:", e);
  }
}

// ===============================
// 場リストを表示
// ===============================
function showVenueList() {
  screenDetail.classList.add("hidden");
  screenRaces.classList.add("hidden");
  screenVenues.classList.remove("hidden");

  venueList.innerHTML = "";

  // 選択日付でフィルタ
  const filtered = raceData.filter(r => formatDate(r.race_date) === selectedDate);
  const venues = [...new Set(filtered.map(r => r.race_stadium_number))]; // 場コードで重複除去

  venues.forEach(venue => {
    const li = document.createElement("li");
    li.textContent = `場 ${venue}`;
    li.addEventListener("click", () => {
      selectedVenue = venue;
      showRaceList();
    });
    venueList.appendChild(li);
  });
}

// ===============================
// レースリストを表示
// ===============================
function showRaceList() {
  screenVenues.classList.add("hidden");
  screenDetail.classList.add("hidden");
  screenRaces.classList.remove("hidden");

  venueTitle.textContent = `場 ${selectedVenue}`;
  raceList.innerHTML = "";

  const filtered = raceData.filter(r => formatDate(r.race_date) === selectedDate && r.race_stadium_number === selectedVenue);

  filtered.forEach(race => {
    const li = document.createElement("li");
    li.textContent = `${race.race_number}R (${race.race_closed_at})`;
    li.addEventListener("click", () => showRaceDetail(race));
    raceList.appendChild(li);
  });
}

// ===============================
// レース詳細（出走表）表示
// ===============================
function showRaceDetail(race) {
  screenRaces.classList.add("hidden");
  screenDetail.classList.remove("hidden");

  raceTitle.textContent = `場${race.race_stadium_number} ${race.race_number}R ${race.race_title}`;

  entryTableBody.innerHTML = "";
  race.boats.forEach(b => {
    const tr = document.createElement("tr");
    tr.classList.add(`lane-${b.racer_boat_number}`);
    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_name}</td>
      <td>${b.racer_national_top_1_percent?.toFixed(2) ?? "-"}</td>
      <td>${b.racer_average_start_timing ?? "-"}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  aiCommentDiv.innerHTML = `<p>${generateComment(race)}</p>`;
}

// ===============================
// 戻るボタン
// ===============================
backBtnRace.addEventListener("click", () => {
  screenRaces.classList.add("hidden");
  screenVenues.classList.remove("hidden");
});

backBtnDetail.addEventListener("click", () => {
  screenDetail.classList.add("hidden");
  screenRaces.classList.remove("hidden");
});

// ===============================
// 日付切替
// ===============================
todayBtn.addEventListener("click", () => {
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  selectedDate = getToday();
  showVenueList();
});

yesterdayBtn.addEventListener("click", () => {
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  selectedDate = getYesterday();
  showVenueList();
});

// ===============================
// 日付ヘルパー
// ===============================
function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
function formatDate(str) {
  // "2025-09-12" → "2025-09-12"
  return str.slice(0, 10);
}

// ===============================
// AIコメント生成（仮）
// ===============================
function generateComment(race) {
  if (!race.boats || race.boats.length === 0) return "データなし";
  const fav = race.boats.reduce((a, b) => (a.racer_national_top_1_percent > b.racer_national_top_1_percent ? a : b));
  return `${fav.racer_boat_number}号艇 ${fav.racer_name} が有力候補と見られます。`;
}

// ===============================
// 初期化
// ===============================
loadRaceData();