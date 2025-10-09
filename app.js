// ======================================
// 🏁 Boat Race AI App - 実データ対応版（data.json構造準拠）
// ======================================

const mainScreen = document.getElementById("mainScreen");
const raceScreen = document.getElementById("raceScreen");
const detailScreen = document.getElementById("detailScreen");

const backToMainBtn = document.getElementById("backToMain");
const backToRaceBtn = document.getElementById("backToRace");

let currentData = [];
let historyData = {};

// ----------------------------
// 1. JSON取得関数
// ----------------------------
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

// ----------------------------
// 2. メイン画面（場ごとの的中率表示）
// ----------------------------
async function renderMain() {
  const data = await fetchJSON("data.json");
  const history = await fetchJSON("history.json");
  if (!data) return;

  historyData = history || {};

  // stadium_numberをキーにグループ化
  const grouped = {};
  (Array.isArray(data) ? data : [data]).forEach((r) => {
    const sn = r.race_stadium_number;
    if (!grouped[sn]) grouped[sn] = [];
    grouped[sn].push(r);
  });

  mainScreen.innerHTML = "";
  Object.entries(grouped).forEach(([stadium, races]) => {
    const div = document.createElement("div");
    div.className = "venue-card";

    const venueName = getStadiumName(stadium);
    const hitRate = calcHitRate(venueName);

    div.innerHTML = `
      <div class="venue-name">${venueName}</div>
      <div class="venue-status">レース数: ${races.length}</div>
      <div class="venue-hit">的中率: ${hitRate}%</div>
    `;
    div.onclick = () => showRaces(venueName, races);
    mainScreen.appendChild(div);
  });

  showScreen(mainScreen);
}

// ----------------------------
// 3. レース一覧画面
// ----------------------------
function showRaces(venueName, races) {
  raceScreen.innerHTML = `<h2>${venueName}</h2><div class="race-grid"></div>`;
  const grid = raceScreen.querySelector(".race-grid");

  races.forEach((r) => {
    const btn = document.createElement("button");
    btn.className = "race-btn blue";
    btn.textContent = `${r.race_number}R`;
    btn.onclick = () => showDetails(r);
    grid.appendChild(btn);
  });

  showScreen(raceScreen);
}

// ----------------------------
// 4. 出走表画面
// ----------------------------
function showDetails(race) {
  detailScreen.innerHTML = `
    <h2>${getStadiumName(race.race_stadium_number)} ${race.race_number}R 出走表</h2>
    <div class="table-container"></div>
    <div id="aiComment" class="ai-comment"></div>
  `;

  const table = detailScreen.querySelector(".table-container");

  (race.boats || []).forEach((b, i) => {
    const row = document.createElement("div");
    row.className = "entry-row";
    row.style.backgroundColor = getBgColor(i + 1);
    row.innerHTML = `
      <div class="entry-cell">${i + 1}</div>
      <div class="entry-cell">${b.racer_name}</div>
      <div class="entry-cell">${b.racer_average_start_timing}</div>
      <div class="entry-cell">${b.racer_flying_count > 0 ? "F" + b.racer_flying_count : "ー"}</div>
      <div class="entry-cell">${b.racer_national_top_3_percent}%</div>
      <div class="entry-cell">${b.racer_local_top_3_percent}%</div>
      <div class="entry-cell">${b.racer_motor_percent || "-"}%</div>
      <div class="entry-cell">${b.racer_course_percent || "-"}%</div>
    `;
    table.appendChild(row);
  });

  document.getElementById("aiComment").textContent = generateAIComment(race);
  showScreen(detailScreen);
}

// ----------------------------
// 5. コメント生成
// ----------------------------
function generateAIComment(race) {
  if (!race.boats || race.boats.length === 0) return "データ不足";
  const leader = race.boats[0];
  const toneList = [
    "トップスタートから逃げ切り必至。",
    "安定感ある走りで連対濃厚。",
    "展開を味方につければ上位進出も。",
    "機力は十分、調子を維持できるか注目。",
    "仕上がりは良好、波乱を起こす可能性あり。"
  ];
  const tone = toneList[Math.floor(Math.random() * toneList.length)];
  return `${leader.racer_name}選手: ${tone}`;
}

// ----------------------------
// 6. 的中率計算（history.json対応）
// ----------------------------
function calcHitRate(venueName) {
  if (!historyData || Object.keys(historyData).length === 0) return 0;
  let total = 0;
  let hits = 0;

  Object.values(historyData).forEach((day) => {
    const races = day.result || day.races || [];
    races.forEach((r) => {
      const venue = r.venue || r.place || "";
      if (venue === venueName) {
        total++;
        if (r.ai_hit === true || r.ai_hit === "true" || r.ai_hit === 1) hits++;
      }
    });
  });

  return total > 0 ? Math.round((hits / total) * 100) : 0;
}

// ----------------------------
// 7. 共通関数
// ----------------------------
function getBgColor(num) {
  const colors = ["#fff", "#f0f0f0", "#ffe5e5", "#e5f0ff", "#fff8dc", "#e5ffe5"];
  return colors[num - 1] || "#fff";
}

function getStadiumName(num) {
  const list = {
    1: "桐生", 2: "戸田", 3: "江戸川", 4: "平和島", 5: "多摩川",
    6: "浜名湖", 7: "蒲郡", 8: "常滑", 9: "津", 10: "三国",
    11: "びわこ", 12: "住之江", 13: "尼崎", 14: "鳴門", 15: "丸亀",
    16: "児島", 17: "宮島", 18: "徳山", 19: "下関", 20: "若松",
    21: "芦屋", 22: "福岡", 23: "唐津", 24: "大村"
  };
  return list[num] || `場 ${num}`;
}

// ----------------------------
// 8. 画面切替
// ----------------------------
function showScreen(screen) {
  [mainScreen, raceScreen, detailScreen].forEach((s) => (s.style.display = "none"));
  screen.style.display = "block";
}

backToMainBtn.onclick = () => showScreen(mainScreen);
backToRaceBtn.onclick = () => showScreen(raceScreen);

// ----------------------------
// 9. 定期更新
// ----------------------------
async function autoRefresh() {
  await renderMain();
  console.log("🔄 自動更新完了");
}
setInterval(autoRefresh, 5 * 60 * 1000);

// ----------------------------
// 10. 初期起動
// ----------------------------
renderMain();