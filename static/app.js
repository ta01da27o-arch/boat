// ======================================================
// 競艇AI予想フロントエンド（train-and-predict.yml連携対応版）
// ======================================================

// ===== データURL（/data/ → /static/data/ フォールバック対応）=====
const DATA_PATHS = [
  "/data/data.json",
  "/static/data/data.json"
];
const HISTORY_PATHS = [
  "/data/history.json",
  "/static/data/history.json"
];

// ===== DOM要素 =====
const dateLabel = document.getElementById("dateLabel");
const aiStatus = document.getElementById("aiStatus");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.querySelector("#entryTable tbody");
const raceTitle = document.getElementById("raceTitle");
const venueTitle = document.getElementById("venueTitle");
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");
const refreshBtn = document.getElementById("refreshBtn");

// ===== グローバル変数 =====
let globalData = {};
let historyData = {};
let selectedVenue = null;
let selectedRace = null;

// ======================================================
// 初期処理
// ======================================================
init();

async function init() {
  await loadAllData();
  renderVenues();
  updateDateLabel();
}

// ======================================================
// データ取得（train-and-predict.yml構成対応）
// ======================================================
async function loadAllData() {
  aiStatus.textContent = "🔄 データ読込中...";
  globalData = {};
  historyData = {};

  const timestamp = `?t=${Date.now()}`;
  let success = false;

  // data.json 読み込み
  for (const path of DATA_PATHS) {
    try {
      const res = await fetch(path + timestamp, { cache: "no-store" });
      if (res.ok) {
        globalData = await res.json();
        console.log(`✅ 読込成功: ${path}`);
        success = true;
        break;
      }
    } catch (e) {
      console.warn(`⚠️ 読込失敗: ${path}`);
    }
  }

  // history.json 読み込み
  for (const path of HISTORY_PATHS) {
    try {
      const res = await fetch(path + timestamp, { cache: "no-store" });
      if (res.ok) {
        historyData = await res.json();
        console.log(`✅ 読込成功: ${path}`);
        break;
      }
    } catch (e) {
      console.warn(`⚠️ 読込失敗: ${path}`);
    }
  }

  aiStatus.textContent = success ? "✅ 最新データ取得済み" : "⚠️ データ取得失敗";
  console.log("📊 globalData:", globalData);
}

// ======================================================
// 日付表示
// ======================================================
function updateDateLabel() {
  const now = new Date();
  dateLabel.textContent = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

// ======================================================
// 24場表示
// ======================================================
function renderVenues() {
  venuesGrid.innerHTML = "";

  const dates = Object.keys(globalData);
  if (!dates.length) {
    venuesGrid.innerHTML = "<p>データがありません。</p>";
    return;
  }

  const latest = dates.sort().pop();
  const todayData = globalData[latest];

  Object.keys(todayData).forEach((venue) => {
    const v = todayData[venue];
    const card = document.createElement("div");
    card.className = "venue-card clickable";
    card.innerHTML = `
      <div class="v-name">${venue}</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">${v?.races ? `${Object.keys(v.races).length}R` : ""}</div>
    `;
    card.onclick = () => openVenue(latest, venue);
    venuesGrid.appendChild(card);
  });
}

// ======================================================
// レース一覧
// ======================================================
function openVenue(dateKey, venueName) {
  selectedVenue = venueName;
  screenVenues.classList.remove("active");
  screenRaces.classList.add("active");
  venueTitle.textContent = venueName;
  renderRaces(dateKey, venueName);
}

function renderRaces(dateKey, venueName) {
  racesGrid.innerHTML = "";
  const races = globalData[dateKey]?.[venueName]?.races || [];

  races.forEach((race) => {
    const div = document.createElement("div");
    div.className = "race-btn clickable";
    div.textContent = `${race.race_no}R`;
    div.onclick = () => openRace(dateKey, venueName, race.race_no);
    racesGrid.appendChild(div);
  });
}

// ======================================================
// 出走表（色分け付き）
// ======================================================
function openRace(dateKey, venueName, raceNo) {
  selectedRace = raceNo;
  screenRaces.classList.remove("active");
  screenDetail.classList.add("active");

  raceTitle.textContent = `${venueName} ${raceNo}R`;

  const race = globalData[dateKey]?.[venueName]?.races?.find(r => r.race_no === raceNo);
  renderEntryTable(race);
}

function renderEntryTable(raceData) {
  entryTable.innerHTML = "";
  if (!raceData?.boats) return;

  raceData.boats.forEach((b, i) => {
    const tr = document.createElement("tr");
    tr.className = `waku-${b.racer_lane || (i + 1)}`;
    tr.innerHTML = `
      <td>${b.racer_lane}</td>
      <td>${b.racer_name}</td>
      <td>${b.racer_branch || "-"}</td>
      <td>${b.racer_class || "-"}</td>
      <td>${b.racer_start_timing || "-"}</td>
      <td>${b.racer_motor_win_rate || "-"}</td>
      <td>${b.racer_course_win_rate || "-"}</td>
    `;
    entryTable.appendChild(tr);
  });
}

// ======================================================
// 戻る・更新ボタン
// ======================================================
backToVenues.onclick = () => {
  screenRaces.classList.remove("active");
  screenVenues.classList.add("active");
};
backToRaces.onclick = () => {
  screenDetail.classList.remove("active");
  screenRaces.classList.add("active");
};
refreshBtn.onclick = async () => {
  aiStatus.textContent = "🔄 再取得中...";
  await loadAllData();
  renderVenues();
  aiStatus.textContent = "✅ 更新完了";
};