// app.js

const VENUES = [
  "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
  "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
  "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
  "下関", "若松", "芦屋", "唐津", "福岡", "大村"
];

const view = document.getElementById("view");

// JSONデータURL
const DATA_URL = "https://ta01da27o-arch.github.io/boat/data/data.json";

// グリッド描画
async function renderVenues() {
  try {
    const response = await fetch(DATA_URL + "?t=" + new Date().getTime());
    const data = await response.json();

    view.innerHTML = "";

    VENUES.forEach((venue, index) => {
      const venueData = data[venue];
      const hasRaces = venueData && venueData.races && Object.keys(venueData.races).length > 0;

      // 状態と色分け
      const isActive = hasRaces;
      const status = isActive ? "開催中" : "ー";
      const hitRate = isActive ? `${calcHitRate(venueData)}%` : "-";

      const card = document.createElement("div");
      card.className = `venue-card ${isActive ? "active" : "inactive"}`;
      card.innerHTML = `
        <div class="venue-name">${venue}</div>
        <div class="venue-status">${status}</div>
        <div class="venue-hit">${hitRate}</div>
      `;

      if (isActive) {
        card.addEventListener("click", () => openVenue(venue));
      }

      view.appendChild(card);
    });

  } catch (err) {
    console.error("❌ データ取得エラー:", err);
    view.innerHTML = `<p style="color:red;">データを読み込めませんでした。</p>`;
  }
}

// AI的中率の計算（仮ロジック）
function calcHitRate(venueData) {
  if (!venueData || !venueData.races) return 0;
  const races = Object.values(venueData.races);
  if (races.length === 0) return 0;
  const total = races.length;
  const hit = races.filter(r => r.prediction && r.result && r.prediction === r.result).length;
  return Math.round((hit / total) * 100);
}

// 各場タップ時に詳細画面へ（今後拡張可）
function openVenue(venue) {
  alert(`🏁 ${venue} のレース一覧へ遷移（仮）`);
}

// 初期化
document.addEventListener("DOMContentLoaded", () => {
  renderVenues();
});