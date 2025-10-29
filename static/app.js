// app.js
//------------------------------------------------------
// 競艇AI予想アプリ 2025対応版
// data/data.json を自動読み込みして、24場一覧を描画
// 各場ごとに：場名 / 開催状況 / AI的中率（%）を表示
//------------------------------------------------------

const VIEW = document.getElementById("view");
const todayLabel = document.getElementById("todayLabel");
const refreshBtn = document.getElementById("refreshBtn");
const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");

const DATA_URL = "./data/data.json"; // GitHub Actionsで生成されるデータ
let allData = [];

// ---------------- 日付 ----------------
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, "0");
const dd = String(now.getDate()).padStart(2, "0");
todayLabel.textContent = `${yyyy}/${mm}/${dd}`;

// ---------------- 初期化 ----------------
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  renderVenues();
});

refreshBtn.addEventListener("click", async () => {
  refreshBtn.disabled = true;
  refreshBtn.textContent = "更新中...";
  await loadData(true);
  renderVenues();
  refreshBtn.textContent = "更新";
  refreshBtn.disabled = false;
});

// ---------------- データ読込 ----------------
async function loadData(force = false) {
  try {
    const url = force ? `${DATA_URL}?t=${Date.now()}` : DATA_URL;
    const res = await fetch(url);
    if (!res.ok) throw new Error("データ取得失敗");
    allData = await res.json();
    console.log("✅ データ読み込み成功:", allData);
  } catch (e) {
    console.error("❌ データ読み込み失敗:", e);
    allData = [];
  }
}

// ---------------- 24場描画 ----------------
function renderVenues() {
  SCREEN_VENUES.innerHTML = "";

  if (!Array.isArray(allData) || allData.length === 0) {
    SCREEN_VENUES.innerHTML = `<p style="text-align:center;">データがありません。</p>`;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "venues-grid";

  allData.forEach((venue) => {
    const card = document.createElement("div");
    card.className = "venue-card clickable";

    // === 開催状態推定 ===
    let statusText = "ー";
    let statusClass = "closed";
    const raceCount = venue.races ? venue.races.length : 0;
    if (raceCount > 0) {
      statusText = "開催中";
      statusClass = "active";
    }

    // === 的中率 ===
    const rate = venue.hit_rate !== undefined ? `${venue.hit_rate}%` : "ー";

    // === カード構築 ===
    card.innerHTML = `
      <div class="v-name">${venue.venue}</div>
      <div class="v-status ${statusClass}">${statusText}</div>
      <div class="v-hit" style="font-weight:900;font-size:14px;color:#e11d48;">${rate}</div>
    `;

    // === クリックでレース一覧表示 ===
    card.addEventListener("click", () => {
      showRaces(venue);
    });

    grid.appendChild(card);
  });

  SCREEN_VENUES.appendChild(grid);
}

// ---------------- 各場のレース一覧 ----------------
function showRaces(venue) {
  SCREEN_VENUES.classList.remove("active");
  SCREEN_RACES.classList.add("active");

  SCREEN_RACES.innerHTML = `
    <button class="btn back" id="backBtn">← 戻る</button>
    <div class="card">
      <h2 class="h2">${venue.venue}（的中率 ${venue.hit_rate}%）</h2>
      <div class="h3">出走表データ</div>
      ${renderRaceTable(venue)}
    </div>
  `;

  document.getElementById("backBtn").addEventListener("click", () => {
    SCREEN_RACES.classList.remove("active");
    SCREEN_VENUES.classList.add("active");
  });
}

// ---------------- 出走表テーブル ----------------
function renderRaceTable(venue) {
  const races = venue.races || [];
  if (races.length === 0) return `<p>出走データなし。</p>`;

  let html = `<table class="table"><thead><tr><th>選手名</th><th>成績</th></tr></thead><tbody>`;
  races.forEach((r, i) => {
    html += `<tr class="row-${(i % 6) + 1}"><td>${r.racer}</td><td>${r.mark}</td></tr>`;
  });
  html += `</tbody></table>`;
  return html;
}