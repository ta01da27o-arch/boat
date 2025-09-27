// app.js

const VENUES = [
  { id: 1, name: "桐生" },
  { id: 2, name: "戸田" },
  { id: 3, name: "江戸川" },
  { id: 4, name: "平和島" },
  { id: 5, name: "多摩川" },
  { id: 6, name: "浜名湖" },
  { id: 7, name: "蒲郡" },
  { id: 8, name: "常滑" },
  { id: 9, name: "津" },
  { id: 10, name: "三国" },
  { id: 11, name: "びわこ" },
  { id: 12, name: "住之江" },
  { id: 13, name: "尼崎" },
  { id: 14, name: "鳴門" },
  { id: 15, name: "丸亀" },
  { id: 16, name: "児島" },
  { id: 17, name: "宮島" },
  { id: 18, name: "徳山" },
  { id: 19, name: "下関" },
  { id: 20, name: "若松" },
  { id: 21, name: "芦屋" },
  { id: 22, name: "福岡" },
  { id: 23, name: "唐津" },
  { id: 24, name: "大村" }
];

// JSONデータのURL
const PROGRAMS_URL = "./data.json";     // 出走表
const HISTORY_URL  = "./history.json";  // 過去結果（AI学習・的中率算出用）

// DOMコンテナ
const container = document.getElementById("view");

// データ保持
let programs = [];
let historyData = {};

// メイン処理
async function loadData() {
  try {
    const [programsRes, historyRes] = await Promise.all([
      fetch(PROGRAMS_URL),
      fetch(HISTORY_URL)
    ]);

    programs = await programsRes.json();
    historyData = await historyRes.json();

    renderVenues();
  } catch (err) {
    console.error("データ取得エラー:", err);
    container.innerHTML = "<p>データを読み込めませんでした。</p>";
  }
}

// 会場ごとの表示
function renderVenues() {
  container.innerHTML = "";

  VENUES.forEach(venue => {
    // 開催中かどうかを判定
    const isActive = programs.some(p => p.race_stadium_number === venue.id);
    const status = isActive ? "開催中" : "ー";

    // 各場の的中率を計算
    const hitRate = calcHitRate(venue.id);

    const div = document.createElement("div");
    div.className = "venue-card";
    div.innerHTML = `
      <h2>${venue.name}</h2>
      <p>状態: ${status}</p>
      <p>的中率: ${hitRate}</p>
    `;
    container.appendChild(div);
  });
}

// 的中率を計算（history.jsonから）
function calcHitRate(venueId) {
  let total = 0;
  let hit = 0;

  for (const dateKey in historyData) {
    const day = historyData[dateKey];
    if (!day.results) continue;

    day.results.forEach(race => {
      if (race.race_stadium_number === venueId) {
        total++;

        // AI予想（三連単）と実際の結果を比較
        const trifectaResult = race.payouts?.trifecta?.[0]?.combination;
        const aiPredictions = race.ai_predictions || []; // 事前に保存されているAI予想配列

        if (trifectaResult && aiPredictions.includes(trifectaResult)) {
          hit++;
        }
      }
    });
  }

  if (total === 0) return "--%";
  return Math.round((hit / total) * 100) + "%";
}

// 初期化
loadData();