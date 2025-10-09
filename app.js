// ======================================
// 🏁 Boat Race AI App - Perfect Version
// ✅ history.json の ai_hit から的中率を自動算出表示
// ======================================

// DOM要素取得
const mainScreen = document.getElementById("mainScreen");
const raceScreen = document.getElementById("raceScreen");
const detailScreen = document.getElementById("detailScreen");

const backToMainBtn = document.getElementById("backToMain");
const backToRaceBtn = document.getElementById("backToRace");

let allVenues = [];
let currentVenue = null;
let currentRace = null;
let historyData = {};

// ======================================
// 1. JSONデータを取得
// ======================================
async function fetchJSON(path) {
  try {
    const res = await fetch(path + "?t=" + new Date().getTime());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`❌ ${path} 読込失敗:`, e);
    return null;
  }
}

// ======================================
// 2. メイン画面生成（24場表示）
// ======================================
async function renderMain() {
  const data = await fetchJSON("data.json");
  const history = await fetchJSON("history.json");
  if (!data) return;

  historyData = history || {};
  allVenues = data.venues;
  mainScreen.innerHTML = "";

  allVenues.forEach((v) => {
    const div = document.createElement("div");
    div.className = "venue-card";

    const hitRate = calcHitRate(v.name);
    div.innerHTML = `
      <div class="venue-name">${v.name}</div>
      <div class="venue-status">${v.is_open ? "開催中" : "ー"}</div>
      <div class="venue-hit">的中率: ${hitRate}%</div>
    `;

    div.onclick = () => showRaces(v);
    mainScreen.appendChild(div);
  });

  showScreen(mainScreen);
}

// ======================================
// 3. レース一覧画面
// ======================================
function showRaces(venue) {
  currentVenue = venue;
  raceScreen.innerHTML = `<h2>${venue.name}</h2><div class="race-grid"></div>`;
  const grid = raceScreen.querySelector(".race-grid");

  venue.races.forEach((r) => {
    const btn = document.createElement("button");
    btn.className = "race-btn blue";
    btn.textContent = `${r.number}R`;
    btn.onclick = () => showDetails(r);
    grid.appendChild(btn);
  });

  showScreen(raceScreen);
}

// ======================================
// 4. 出走表画面
// ======================================
function showDetails(race) {
  currentRace = race;
  detailScreen.innerHTML = `
    <h2>${currentVenue.name} ${race.number}R 出走表</h2>
    <div class="table-container"></div>
    <div id="aiComment" class="ai-comment"></div>
  `;

  const table = detailScreen.querySelector(".table-container");

  race.entries.forEach((e, i) => {
    const row = document.createElement("div");
    row.className = "entry-row";
    row.style.backgroundColor = getBgColor(i + 1);
    row.innerHTML = `
      <div class="entry-cell">${e.rank}</div>
      <div class="entry-cell">${e.name}</div>
      <div class="entry-cell">${e.st}</div>
      <div class="entry-cell">${e.fl === 0 ? "ー" : "F" + e.fl}</div>
      <div class="entry-cell">${e.national}%</div>
      <div class="entry-cell">${e.local}%</div>
      <div class="entry-cell">${e.motor}%</div>
      <div class="entry-cell">${e.course}%</div>
      <div class="entry-cell">${e.eval}</div>
    `;
    table.appendChild(row);
  });

  // 展開予想コメント（自然言語強化版）
  const comment = generateAIComment(race.entries);
  document.getElementById("aiComment").textContent = comment;

  showScreen(detailScreen);
}

// ======================================
// 5. 自然言語コメント生成
// ======================================
function generateAIComment(entries) {
  if (!entries || entries.length === 0) return "データ不足";

  const leader = entries[0];
  const randomTone = [
    "今節はかなり好調で、展開を読み切れば首位争い濃厚。",
    "安定したスタートで信頼度は高い。",
    "攻める姿勢が光る。ここも期待できそう。",
    "序盤は苦戦も、後半の修正力に注目。",
    "調整次第で浮上の可能性あり。",
    "出足が重く、やや厳しい展開になりそう。",
    "波乱の要素も多く、過信は禁物。",
    "ここは厳しい。流れが向かなければ苦戦必至。"
  ];
  const tone = randomTone[Math.floor(Math.random() * randomTone.length)];
  return `${leader.name}選手: ${tone}`;
}

// ======================================
// 6. 背景色設定
// ======================================
function getBgColor(num) {
  const colors = ["#ffffff", "#f0f0f0", "#ffe5e5", "#e5f0ff", "#fff8dc", "#e5ffe5"];
  return colors[num - 1] || "#fff";
}

// ======================================
// 7. 的中率算出
// ======================================
function calcHitRate(venueName) {
  if (!historyData || Object.keys(historyData).length === 0) return 0;
  let total = 0;
  let hits = 0;

  Object.values(historyData).forEach((day) => {
    day?.races?.forEach((r) => {
      if (r.venue === venueName) {
        total++;
        if (r.ai_hit) hits++;
      }
    });
  });

  return total > 0 ? Math.round((hits / total) * 100) : 0;
}

// ======================================
// 8. 画面切替
// ======================================
function showScreen(screen) {
  [mainScreen, raceScreen, detailScreen].forEach((s) => (s.style.display = "none"));
  screen.style.display = "block";
}

backToMainBtn.onclick = () => showScreen(mainScreen);
backToRaceBtn.onclick = () => showScreen(raceScreen);

// ======================================
// 9. 定期更新(5分ごと自動再取得)
// ======================================
async function autoRefresh() {
  await renderMain();
  console.log("🔄 自動更新完了");
}
setInterval(autoRefresh, 5 * 60 * 1000);

// ======================================
// 10. 初期起動
// ======================================
renderMain();