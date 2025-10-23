// app.js
const venuesGrid = document.getElementById("venuesGrid");
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venueTitle = document.getElementById("venueTitle");
const racesGrid = document.getElementById("racesGrid");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

const DATA_URL = "https://ta01da27o-arch.github.io/boat/data/data.json";

let currentDate = new Date();
let mode = "today"; // today / yesterday
let allData = {};
let selectedVenue = null;

// === 日付フォーマット ===
function formatDate(date) {
  const y = date.getFullYear();
  const m = ("0" + (date.getMonth() + 1)).slice(-2);
  const d = ("0" + date.getDate()).slice(-2);
  return `${y}${m}${d}`;
}

// === 画面切替 ===
function showScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// === 開催中かどうか判定 ===
function getVenueStatus(venueData, dateStr) {
  if (!venueData) return "非開催";
  if (venueData.date !== dateStr) return "非開催";
  const raceKeys = Object.keys(venueData.races || {});
  if (raceKeys.length > 0) return "開催中";
  return "非開催";
}

// === 24場リスト ===
const VENUE_LIST = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","津","三国","びわこ","住之江","鳴門",
  "丸亀","児島","宮島","徳山","下関","若松",
  "芦屋","唐津","大村","常滑","福岡","尼崎"
];

// === グリッド生成 ===
function renderVenues() {
  venuesGrid.innerHTML = "";
  const dateStr = formatDate(currentDate);

  VENUE_LIST.forEach(name => {
    const data = allData[name];
    const status = getVenueStatus(data, dateStr);

    const div = document.createElement("div");
    div.className = "venue-card";
    div.innerHTML = `
      <div class="venue-name">${name}</div>
      <div class="venue-status ${status === "開催中" ? "active" : "inactive"}">
        ${status === "開催中" ? "開催中" : "ー"}
      </div>
    `;

    if (status === "開催中") {
      div.addEventListener("click", () => openVenue(name));
    } else {
      div.classList.add("disabled");
    }

    venuesGrid.appendChild(div);
  });
}

// === レース画面 ===
function openVenue(name) {
  selectedVenue = name;
  venueTitle.textContent = name;
  showScreen(screenRaces);

  const venueData = allData[name];
  const raceList = Object.keys(venueData?.races || {});
  racesGrid.innerHTML = "";

  if (raceList.length === 0) {
    racesGrid.innerHTML = "<div class='no-data'>本日レースデータなし</div>";
    return;
  }

  raceList.forEach(rno => {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${rno}R`;
    btn.addEventListener("click", () => openRaceDetail(rno));
    racesGrid.appendChild(btn);
  });
}

// === 出走表画面 ===
function openRaceDetail(rno) {
  const raceData = allData[selectedVenue]?.races?.[rno];
  showScreen(screenDetail);
  document.getElementById("raceTitle").textContent = `${selectedVenue} ${rno}R`;

  // 出走表描画（簡易）
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  if (!raceData || !raceData.entries) {
    tbody.innerHTML = "<tr><td colspan='8'>出走表データなし</td></tr>";
    return;
  }

  raceData.entries.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.number}</td>
      <td>${e.grade || ""} ${e.name || ""}</td>
      <td>${e.f || "-"}</td>
      <td>${e.rate_national || "-"}</td>
      <td>${e.rate_local || "-"}</td>
      <td>${e.mt || "-"}</td>
      <td>${e.course || "-"}</td>
      <td>${e.eval || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// === データ取得 ===
async function loadData() {
  try {
    const res = await fetch(DATA_URL + "?t=" + Date.now());
    if (!res.ok) throw new Error("データ取得失敗");
    allData = await res.json();
    renderVenues();
    updateDateLabel();
  } catch (err) {
    console.error("データ読み込み失敗:", err);
    venuesGrid.innerHTML = "<div class='error'>データ読み込みエラー</div>";
  }
}

// === 日付表示 ===
function updateDateLabel() {
  const y = currentDate.getFullYear();
  const m = ("0" + (currentDate.getMonth() + 1)).slice(-2);
  const d = ("0" + currentDate.getDate()).slice(-2);
  dateLabel.textContent = `${y}/${m}/${d}`;
}

// === 日付切り替え ===
todayBtn.addEventListener("click", () => {
  mode = "today";
  currentDate = new Date();
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  loadData();
});

yesterdayBtn.addEventListener("click", () => {
  mode = "yesterday";
  currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 1);
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  loadData();
});

// === 更新ボタン ===
refreshBtn.addEventListener("click", loadData);
backToVenues.addEventListener("click", () => showScreen(screenVenues));
backToRaces.addEventListener("click", () => showScreen(screenRaces));

// 初期ロード
loadData();