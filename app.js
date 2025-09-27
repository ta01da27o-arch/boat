// app.js

const VENUES = [
  { id: 1, name: "桐生" }, { id: 2, name: "戸田" }, { id: 3, name: "江戸川" },
  { id: 4, name: "平和島" }, { id: 5, name: "多摩川" }, { id: 6, name: "浜名湖" },
  { id: 7, name: "蒲郡" }, { id: 8, name: "常滑" }, { id: 9, name: "津" },
  { id: 10, name: "三国" }, { id: 11, name: "びわこ" }, { id: 12, name: "住之江" },
  { id: 13, name: "尼崎" }, { id: 14, name: "鳴門" }, { id: 15, name: "丸亀" },
  { id: 16, name: "児島" }, { id: 17, name: "宮島" }, { id: 18, name: "徳山" },
  { id: 19, name: "下関" }, { id: 20, name: "若松" }, { id: 21, name: "芦屋" },
  { id: 22, name: "福岡" }, { id: 23, name: "唐津" }, { id: 24, name: "大村" }
];

const PROGRAMS_URL = "./data.json";     // 出走表
const HISTORY_URL  = "./history.json";  // 過去結果（AI学習用）

const container = document.getElementById("view");

let programs = [];
let historyData = {};

// -------------------- メイン処理 --------------------
async function loadData() {
  try {
    const [programsRes, historyRes] = await Promise.all([
      fetch(PROGRAMS_URL),
      fetch(HISTORY_URL)
    ]);

    const data = await programsRes.json();
    programs = data.programs || data;  // data.jsonの形式に対応
    historyData = await historyRes.json();

    renderVenues();
  } catch (err) {
    console.error("データ取得エラー:", err);
    container.innerHTML = "<p>データを読み込めませんでした。</p>";
  }
}

// -------------------- 会場ごとの表示 --------------------
function renderVenues() {
  container.innerHTML = "";

  VENUES.forEach(venue => {
    const prog = programs.find(p => p.race_stadium_number === venue.id);
    const status = prog ? "開催中" : "ー";

    const hitRate = calcHitRate(venue.id);

    const div = document.createElement("div");
    div.className = "venue-card";
    div.innerHTML = `
      <h2>${venue.name}</h2>
      <p>状態: ${status}</p>
      <p>的中率: ${hitRate}</p>
    `;
    if (prog) {
      div.addEventListener("click", () => renderRaces(venue.id));
    }
    container.appendChild(div);
  });
}

// -------------------- レース一覧 --------------------
function renderRaces(venueId) {
  container.innerHTML = "";

  const races = programs.filter(p => p.race_stadium_number === venueId);

  races.forEach(race => {
    const div = document.createElement("div");
    div.className = "race-card";
    div.innerHTML = `
      <h3>${race.race_number}R ${race.race_title}</h3>
      <p>${race.race_subtitle || ""}</p>
    `;
    div.addEventListener("click", () => renderRaceDetail(race));
    container.appendChild(div);
  });

  const backBtn = document.createElement("button");
  backBtn.textContent = "← 戻る";
  backBtn.addEventListener("click", renderVenues);
  container.appendChild(backBtn);
}

// -------------------- レース詳細（選手データ表示） --------------------
function renderRaceDetail(race) {
  container.innerHTML = `
    <h2>${race.race_number}R ${race.race_title}</h2>
    <p>距離: ${race.race_distance}m</p>
  `;

  race.boats.forEach(boat => {
    const div = document.createElement("div");
    div.className = "boat-card";

    // 当地勝率（×10で%表示）
    const localWinRate = boat.racer_local_top_1_percent;
    const localWinRatePercent = localWinRate ? Math.round(localWinRate * 10) + "%" : "--";

    div.innerHTML = `
      <h4>${boat.racer_boat_number}号艇 ${boat.racer_name}</h4>
      <p>登録番号: ${boat.racer_number}</p>
      <p>級別: ${boat.racer_class_number}</p>
      <p>平均ST: ${boat.racer_average_start_timing}</p>
      <p>当地勝率: ${localWinRatePercent}</p>
      <p>モーター2連率: ${boat.racer_assigned_motor_top_2_percent || "--"}%</p>
      <p>ボート2連率: ${boat.racer_assigned_boat_top_2_percent || "--"}%</p>
    `;
    container.appendChild(div);
  });

  const backBtn = document.createElement("button");
  backBtn.textContent = "← 戻る";
  backBtn.addEventListener("click", () => renderRaces(race.race_stadium_number));
  container.appendChild(backBtn);
}

// -------------------- 的中率を計算 --------------------
function calcHitRate(venueId) {
  let total = 0;
  let hit = 0;

  for (const dateKey in historyData) {
    const day = historyData[dateKey];
    if (!day.results) continue;

    day.results.forEach(race => {
      if (race.race_stadium_number === venueId) {
        total++;
        const trifectaResult = race.payouts?.trifecta?.[0]?.combination;
        const aiPredictions = race.ai_predictions || [];

        if (trifectaResult && aiPredictions.includes(trifectaResult)) {
          hit++;
        }
      }
    });
  }

  if (total === 0) return "--%";
  return Math.round((hit / total) * 100) + "%";
}

// -------------------- 初期化 --------------------
loadData();