// app.js - 完全自動学習・最新データ対応版

const VIEW = document.getElementById("view");
const TITLE = document.getElementById("title");

// JSONパス設定
const DATA_URL = "data/data.json";
const HISTORY_URL = "data/history.json";

// テーマカラー（艇色）
const COLORS = ["#e60000", "#0000ff", "#ffeb00", "#00ff00", "#ff69b4", "#808080"];

// ページ状態
let currentView = "home";
let currentVenue = null;
let currentRace = null;
let raceData = null;

// =======================================
// 初期化処理
// =======================================
window.addEventListener("DOMContentLoaded", async () => {
  TITLE.textContent = "競艇AI予想アプリ 🚤";
  await loadTodayData();
});

// =======================================
// データ読み込み
// =======================================
async function loadTodayData() {
  try {
    const res = await fetch(DATA_URL + "?t=" + new Date().getTime());
    if (!res.ok) throw new Error("Fetch Error");
    const json = await res.json();
    raceData = json;
    renderVenues(json);
  } catch (e) {
    console.error("データ読み込み失敗:", e);
    VIEW.innerHTML = `<p class='text-center text-red-500 mt-8'>本日データの読み込みに失敗しました。</p>`;
  }
}

// =======================================
// 24場一覧表示
// =======================================
function renderVenues(data) {
  currentView = "home";
  VIEW.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-3 gap-3 p-3";

  Object.keys(data).forEach((venue) => {
    const btn = document.createElement("button");
    btn.textContent = venue;
    btn.className =
      "bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition-all";
    btn.onclick = () => renderRaces(venue);
    grid.appendChild(btn);
  });

  VIEW.appendChild(grid);
}

// =======================================
// レース番号一覧
// =======================================
function renderRaces(venue) {
  currentVenue = venue;
  const races = raceData[venue]?.races || {};

  VIEW.innerHTML = `
    <div class="flex items-center gap-3 mb-3">
      <button class="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded" onclick="renderVenues(raceData)">← 戻る</button>
      <h2 class="text-xl font-bold">${venue}</h2>
    </div>
  `;

  const list = document.createElement("div");
  list.className = "grid grid-cols-4 gap-2";

  Object.keys(races).forEach((raceNo) => {
    const btn = document.createElement("button");
    btn.textContent = `${raceNo}R`;
    btn.className =
      "bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg shadow";
    btn.onclick = () => renderRace(venue, raceNo);
    list.appendChild(btn);
  });

  VIEW.appendChild(list);
}

// =======================================
// 出走表画面
// =======================================
function renderRace(venue, raceNo) {
  currentRace = raceNo;
  const race = raceData[venue]?.races?.[raceNo];
  if (!race) return;

  VIEW.innerHTML = `
    <div class="flex items-center gap-3 mb-3">
      <button class="bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded" onclick="renderRaces('${venue}')">← 戻る</button>
      <h2 class="text-xl font-bold">${venue} ${raceNo}R 出走表</h2>
    </div>
  `;

  const table = document.createElement("table");
  table.className = "min-w-full border border-gray-300 text-sm text-center rounded-xl overflow-hidden";

  const header = `
    <thead class="bg-gray-100">
      <tr>
        <th class="p-2 border">枠番</th>
        <th class="p-2 border">選手名</th>
        <th class="p-2 border">級別</th>
        <th class="p-2 border">F</th>
        <th class="p-2 border">L</th>
        <th class="p-2 border">展示</th>
      </tr>
    </thead>
  `;

  const rows = race.entries
    .map((entry, i) => {
      const color = COLORS[i % COLORS.length];
      return `
        <tr style="background:${color}22">
          <td class="border p-2 font-bold" style="color:${color};">${i + 1}</td>
          <td class="border p-2">${entry.name || "不明"}</td>
          <td class="border p-2">${entry.class || "-"}</td>
          <td class="border p-2">${entry.f || "-"}</td>
          <td class="border p-2">${entry.l || "-"}</td>
          <td class="border p-2">${entry.tenji || "-"}</td>
        </tr>`;
    })
    .join("");

  table.innerHTML = header + `<tbody>${rows}</tbody>`;
  VIEW.appendChild(table);

  if (race.prediction) {
    const pred = document.createElement("div");
    pred.className = "mt-4 p-3 bg-yellow-100 border rounded-xl text-center";
    pred.innerHTML = `<strong>AI予想:</strong> ${race.prediction}`;
    VIEW.appendChild(pred);
  }
}

// =======================================
// 自動再読み込みボタン（学習後即反映用）
// =======================================
async function reloadData() {
  VIEW.innerHTML = `<p class="text-center mt-10">🔄 データ再読み込み中...</p>`;
  await loadTodayData();
}