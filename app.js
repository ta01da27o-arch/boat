// ======================================
// 🏁 Boat Race AI App - data.json (race list形式)対応版
// ======================================

const mainScreen = document.getElementById("mainScreen");
const raceScreen = document.getElementById("raceScreen");
const detailScreen = document.getElementById("detailScreen");

const backToMainBtn = document.getElementById("backToMain");
const backToRaceBtn = document.getElementById("backToRace");

let groupedVenues = {};
let historyData = {};

// ======================================
// JSON取得関数
// ======================================
async function fetchJSON(path) {
  try {
    const base =
      location.pathname.includes("/boat/") ? "/boat/" : "./";
    const res = await fetch(base + path + "?t=" + new Date().getTime());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`❌ ${path} 読込失敗:`, e);
    return null;
  }
}

// ======================================
// メイン画面描画
// ======================================
async function renderMain() {
  const data = await fetchJSON("data.json");
  const history = await fetchJSON("history.json");

  if (!data || data.length === 0) {
    mainScreen.innerHTML = `<p style="color:red;">data.jsonの中身が見つかりません。</p>`;
    return;
  }

  historyData = history || {};
  mainScreen.innerHTML = "";

  // タイトル部分
  mainScreen.innerHTML += `
    <h1>🏁 AI競艇予想</h1>
    <div class="update-info">
      <button id="refreshBtn" class="blue">更新</button>
      <span class="ai-status">AI学習中...</span>
    </div>
  `;

  // ✅ 場ごとにグループ化
  groupedVenues = {};
  data.forEach((race) => {
    const stadium = race.race_stadium_number || "不明";
    if (!groupedVenues[stadium]) groupedVenues[stadium] = [];
    groupedVenues[stadium].push(race);
  });

  const wrapper = document.createElement("div");
  wrapper.className = "venue-wrapper";

  Object.entries(groupedVenues).forEach(([stadium, races]) => {
    const div = document.createElement("div");
    div.className = "venue-card";

    const name = `第${stadium}場`;
    const hitRate = calcHitRate(name);
    div.innerHTML = `
      <div class="venue-name">${name}</div>
      <div class="venue-status">開催中</div>
      <div class="venue-hit">的中率: ${hitRate}%</div>
    `;

    div.onclick = () => showRaces(name, races);
    wrapper.appendChild(div);
  });

  mainScreen.appendChild(wrapper);

  document.getElementById("refreshBtn").onclick = () => renderMain();
  showScreen(mainScreen);
}

// ======================================
// レース一覧表示
// ======================================
function showRaces(venueName, races) {
  raceScreen.innerHTML = `
    <h2>${venueName}</h2>
    <div class="race-grid"></div>
  `;
  const grid = raceScreen.querySelector(".race-grid");

  races.forEach((r) => {
    const btn = document.createElement("button");
    btn.className = "race-btn blue";
    btn.textContent = `${r.race_number}R`;
    btn.onclick = () => showDetails(venueName, r);
    grid.appendChild(btn);
  });

  showScreen(raceScreen);
}

// ======================================
// 出走表画面
// ======================================
function showDetails(venueName, race) {
  detailScreen.innerHTML = `
    <h2>${venueName} ${race.race_number}R 出走表</h2>
    <div class="table-container"></div>
    <div id="aiComment" class="ai-comment"></div>
  `;

  const table = detailScreen.querySelector(".table-container");
  const boats = race.boats || [];

  boats.forEach((b, i) => {
    const row = document.createElement("div");
    row.className = "entry-row";
    row.style.backgroundColor = getBgColor(b.racer_boat_number);

    row.innerHTML = `
      <div class="entry-cell">${b.racer_boat_number}</div>
      <div class="entry-cell">${b.racer_name}</div>
      <div class="entry-cell">${b.racer_average_start_timing || "-"}</div>
      <div class="entry-cell">${b.racer_flying_count || 0}F</div>
      <div class="entry-cell">${b.racer_national_top_3_percent || 0}%</div>
      <div class="entry-cell">${b.racer_local_top_3_percent || 0}%</div>
      <div class="entry-cell">${b.racer_class_number || ""}級</div>
    `;
    table.appendChild(row);
  });

  const comment = generateAIComment(boats);
  document.getElementById("aiComment").textContent = comment;

  showScreen(detailScreen);
}

// ======================================
// AIコメント生成
// ======================================
function generateAIComment(boats) {
  if (!boats || boats.length === 0) return "データ不足";
  const leader = boats[0];
  const tones = [
    "機力上位で首位争いへ。",
    "スタート速く安定感抜群。",
    "展開に乗ればチャンスあり。",
    "コース取り巧者で注目。",
    "スタート不安も地力でカバー。",
    "調整成功なら一発あり。"
  ];
  const tone = tones[Math.floor(Math.random() * tones.length)];
  return `${leader.racer_name}：${tone}`;
}

// ======================================
// 的中率算出
// ======================================
function calcHitRate(venueName) {
  if (!historyData || Object.keys(historyData).length === 0) return 0;
  let total = 0,
    hits = 0;

  Object.values(historyData).forEach((d) => {
    const list = d.result || d.races || [];
    list.forEach((r) => {
      const venue = r.venue || r.place || "";
      if (venue.includes(venueName)) {
        total++;
        if (r.ai_hit === true || r.ai_hit === "true" || r.ai_hit === 1) hits++;
      }
    });
  });

  return total ? Math.round((hits / total) * 100) : 0;
}

// ======================================
// 背景色設定
// ======================================
function getBgColor(num) {
  const colors = [
    "#ffffff",
    "#e3f2fd",
    "#fff3e0",
    "#f3e5f5",
    "#e8f5e9",
    "#fbe9e7"
  ];
  return colors[num - 1] || "#fff";
}

// ======================================
// 画面切替
// ======================================
function showScreen(screen) {
  [mainScreen, raceScreen, detailScreen].forEach((s) => (s.style.display = "none"));
  screen.style.display = "block";
}

backToMainBtn.onclick = () => showScreen(mainScreen);
backToRaceBtn.onclick = () => showScreen(raceScreen);

// ======================================
// 自動更新
// ======================================
setInterval(renderMain, 5 * 60 * 1000);
renderMain();