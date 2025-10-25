// app.js（完全構築・本物data.json反映版）

// =======================
// 定数定義
// =======================
const VIEW = document.getElementById("view");
const todayLabel = document.getElementById("todayLabel");
const refreshBtn = document.getElementById("refreshBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-race");

const RACES_LIST = document.getElementById("races-list");
const RACE_TABLE = document.getElementById("race-table");
const BACK_TO_VENUES = document.getElementById("back-to-venues");
const BACK_TO_RACES = document.getElementById("back-to-races");

// 24場 正式順リスト
const VENUES = [
  "桐生","戸田","江戸川","平和島","多摩川",
  "浜名湖","蒲郡","常滑","津",
  "三国","びわこ","住之江","尼崎",
  "鳴門","丸亀","児島","宮島","徳山","下関",
  "若松","芦屋","福岡","唐津","大村"
];

// =======================
// 日付制御
// =======================
let baseDate = new Date();
function updateDateLabel() {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth() + 1;
  const d = baseDate.getDate();
  todayLabel.textContent = `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}`;
}

// =======================
// データ読込
// =======================
async function loadData() {
  try {
    const response = await fetch("./data/data.json", { cache: "no-store" });
    if (!response.ok) throw new Error("data.json取得失敗");
    return await response.json();
  } catch (e) {
    console.error("データ読み込みエラー:", e);
    return null;
  }
}

// =======================
// 24場画面構築
// =======================
async function renderVenues() {
  const data = await loadData();
  if (!data) {
    SCREEN_VENUES.innerHTML = `<p>データの読み込みに失敗しました。</p>`;
    return;
  }

  SCREEN_VENUES.innerHTML = "";
  SCREEN_VENUES.className = "venues-grid";

  VENUES.forEach((name) => {
    const info = data[name];
    const div = document.createElement("div");
    div.className = "venue-card";

    const status = info?.status || "-";
    const hitRate = (typeof info?.hit_rate === "number") ? `${info.hit_rate}%` : "-";

    // 背景色設定
    if (status === "開催中") {
      div.classList.add("active");
      div.onclick = () => openVenue(name, info);
    } else {
      div.classList.add("inactive");
      div.onclick = null;
    }

    div.innerHTML = `
      <div class="venue-name">${name}</div>
      <div class="venue-status">${status}</div>
      <div class="venue-hit">${hitRate}</div>
    `;

    SCREEN_VENUES.appendChild(div);
  });

  showScreen("venues");
}

// =======================
// 開催中場 → レース番号画面
// =======================
function openVenue(name, info) {
  RACES_LIST.innerHTML = "";
  const races = info?.races || {};

  const header = document.createElement("h2");
  header.textContent = `${name} のレース一覧`;
  RACES_LIST.appendChild(header);

  Object.keys(races).forEach((num) => {
    const btn = document.createElement("button");
    btn.textContent = `${num}R`;
    btn.className = "race-btn";
    btn.onclick = () => openRace(name, num, races[num]);
    RACES_LIST.appendChild(btn);
  });

  if (Object.keys(races).length === 0) {
    RACES_LIST.innerHTML += `<p>レースデータがありません。</p>`;
  }

  showScreen("races");
}

// =======================
// 出走表画面
// =======================
function openRace(venue, num, raceData) {
  RACE_TABLE.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = `${venue} ${num}R 出走表`;
  RACE_TABLE.appendChild(title);

  const table = document.createElement("table");
  table.className = "race-table";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>艇</th><th>選手名</th><th>級</th><th>ST</th>
      <th>F</th><th>全国</th><th>当地</th><th>モーター</th><th>コース</th><th>評価</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  if (Array.isArray(raceData)) {
    raceData.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.number ?? "-"}</td>
        <td>${r.name ?? "-"}</td>
        <td>${r.grade ?? "-"}</td>
        <td>${r.st ?? "-"}</td>
        <td>${r.f ?? "-"}</td>
        <td>${r.all ?? "-"}</td>
        <td>${r.local ?? "-"}</td>
        <td>${r.mt ?? "-"}</td>
        <td>${r.course ?? "-"}</td>
        <td>${r.eval ?? "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="10">出走データなし</td>`;
    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  RACE_TABLE.appendChild(table);
  showScreen("race");
}

// =======================
// 画面遷移制御
// =======================
function showScreen(name) {
  SCREEN_VENUES.style.display = name === "venues" ? "grid" : "none";
  SCREEN_RACES.style.display = name === "races" ? "block" : "none";
  SCREEN_RACE.style.display = name === "race" ? "block" : "none";
}

// =======================
// イベント定義
// =======================
refreshBtn.onclick = () => renderVenues();

prevBtn.onclick = () => {
  baseDate.setDate(baseDate.getDate() - 1);
  updateDateLabel();
  renderVenues();
};
nextBtn.onclick = () => {
  baseDate.setDate(baseDate.getDate() + 1);
  updateDateLabel();
  renderVenues();
};

BACK_TO_VENUES.onclick = () => showScreen("venues");
BACK_TO_RACES.onclick = () => showScreen("races");

// =======================
// 初期実行
// =======================
updateDateLabel();
renderVenues();