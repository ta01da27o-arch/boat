// ===============================
// 競艇AI予想アプリ app.js（完全統合版）
// ===============================

// データパス（index.htmlで定義）
const DATA_PATH = window.DATA_PATH || "./data/data.json";
const HISTORY_PATH = window.HISTORY_PATH || "./data/history.json";

// 要素取得（index.htmlに完全一致）
const venueGrid = document.getElementById("venuesGrid");
const dateLabel = document.getElementById("dateLabel");
const aiStatus = document.getElementById("aiStatus");
const refreshBtn = document.getElementById("refreshBtn");

// 画面切り替え要素
const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_DETAIL = document.getElementById("screen-detail");

// 24場の正式順リスト
const VENUES = [
  "桐生", "戸田", "江戸川", "平和島", "多摩川",
  "浜名湖", "蒲郡", "常滑", "津",
  "三国", "びわこ", "住之江", "尼崎",
  "鳴門", "丸亀", "児島", "宮島",
  "徳山", "下関",
  "若松", "芦屋", "福岡", "唐津", "大村"
];

// 日付表示
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
dateLabel.textContent = `${yyyy}/${mm}/${dd}`;

// ===============================
// データ取得
// ===============================
async function fetchData() {
  try {
    const res = await fetch(DATA_PATH + "?t=" + Date.now());
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("❌ データ取得失敗:", err);
    aiStatus.textContent = "データ取得エラー";
    return {};
  }
}

// ===============================
// AI的中率（ダミー値 or JSON由来）
// ===============================
function getAIPercentage(venueName, data) {
  try {
    const value =
      data[venueName]?.ai_accuracy ??
      Math.floor(Math.random() * 40 + 60); // 仮に60〜99％のランダム値
    return `${value}%`;
  } catch {
    return "ー";
  }
}

// ===============================
// 開催判定
// ===============================
function getVenueStatus(venueName, data) {
  const venueData = data[venueName];
  if (!venueData) return "ー";

  const raceCount = venueData.races ? Object.keys(venueData.races).length : 0;
  if (raceCount > 0) return "開催中";
  return "ー";
}

// ===============================
// グリッド生成
// ===============================
function renderVenues(data) {
  venueGrid.innerHTML = "";

  VENUES.forEach(venueName => {
    const status = getVenueStatus(venueName, data);
    const accuracy = getAIPercentage(venueName, data);

    // 色分け
    let statusClass = "inactive";
    if (status === "開催中") statusClass = "active";

    const div = document.createElement("div");
    div.className = `venue-card ${statusClass}`;
    div.innerHTML = `
      <div class="venue-name">${venueName}</div>
      <div class="venue-status">${status}</div>
      <div class="venue-accuracy">AI的中率：${accuracy}</div>
    `;

    if (status === "開催中") {
      div.addEventListener("click", () => openVenue(venueName));
    }

    venueGrid.appendChild(div);
  });
}

// ===============================
// 開催中場クリック時
// ===============================
function openVenue(venueName) {
  SCREEN_VENUES.classList.remove("active");
  SCREEN_RACES.classList.add("active");
  document.getElementById("venueTitle").textContent = venueName;
  renderRaces(venueName);
}

// ===============================
// レース番号一覧（12R固定）
// ===============================
function renderRaces(venueName) {
  const racesGrid = document.getElementById("racesGrid");
  racesGrid.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => openRace(venueName, i));
    racesGrid.appendChild(btn);
  }
}

// ===============================
// 出走表画面
// ===============================
function openRace(venueName, raceNo) {
  SCREEN_RACES.classList.remove("active");
  SCREEN_DETAIL.classList.add("active");
  document.getElementById("raceTitle").textContent = `${venueName} ${raceNo}R`;
  loadRaceDetail(venueName, raceNo);
}

// ===============================
// 出走表詳細ロード
// ===============================
async function loadRaceDetail(venueName, raceNo) {
  try {
    const res = await fetch(DATA_PATH + "?t=" + Date.now());
    const data = await res.json();

    const raceData = data[venueName]?.races?.[raceNo];
    const tbody = document.querySelector("#entryTable tbody");
    tbody.innerHTML = "";

    if (!raceData || !raceData.entries) {
      tbody.innerHTML = `<tr><td colspan="8">データなし</td></tr>`;
      return;
    }

    raceData.entries.forEach(entry => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.boat}</td>
        <td>${entry.class}<br>${entry.name}<br>${entry.st}</td>
        <td>${entry.f ?? "ー"}</td>
        <td>${entry.z_win ?? "ー"}</td>
        <td>${entry.l_win ?? "ー"}</td>
        <td>${entry.m_win ?? "ー"}</td>
        <td>${entry.c_win ?? "ー"}</td>
        <td>${entry.eval ?? "ー"}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error(e);
  }
}

// ===============================
// 戻るボタン処理
// ===============================
document.getElementById("backToVenues").addEventListener("click", () => {
  SCREEN_RACES.classList.remove("active");
  SCREEN_VENUES.classList.add("active");
});

document.getElementById("backToRaces").addEventListener("click", () => {
  SCREEN_DETAIL.classList.remove("active");
  SCREEN_RACES.classList.add("active");
});

// ===============================
// 更新ボタン
// ===============================
refreshBtn.addEventListener("click", async () => {
  aiStatus.textContent = "🔄 更新中...";
  const data = await fetchData();
  renderVenues(data);
  aiStatus.textContent = "✅ 更新完了";
});

// ===============================
// 初期ロード
// ===============================
(async function init() {
  aiStatus.textContent = "データ読込中...";
  const data = await fetchData();
  renderVenues(data);
  aiStatus.textContent = "✅ 最新データ反映";
})();