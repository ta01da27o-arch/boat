// =========================================================
// app.js（完全最適化版 / data.json & fetch_data.py 完全対応）
// =========================================================

// ---- HTML要素の取得 ----
const VIEW = document.getElementById("view");
const todayLabel = document.getElementById("todayLabel");
const refreshBtn = document.getElementById("refreshBtn");
const toggleToday = document.getElementById("toggle-today");
const togglePrev = document.getElementById("toggle-prev");

// ---- 状態管理 ----
let currentMode = "today"; // "today" or "prev"
let raceData = {}; // data.json内容を保持

// =========================================================
// ✅ データ取得処理
// =========================================================
async function fetchRaceData() {
  try {
    const res = await fetch("./data/data.json?cache=" + Date.now());
    if (!res.ok) throw new Error("サーバー応答エラー");
    const data = await res.json();

    // JSON構造を検証・正規化
    raceData = sanitizeData(data);

    // 描画
    renderVenues();
  } catch (err) {
    console.error("❌ データ取得失敗:", err);
    VIEW.innerHTML = `
      <div class="error-box">
        <p>データを読み込めませんでした。<br>fetch_data.pyまたはdata.jsonを確認して下さい。</p>
      </div>`;
  }
}

// =========================================================
// ✅ データ正規化（undefined, NaN, 空配列除外）
// =========================================================
function sanitizeData(data) {
  const clean = {};
  for (const [venue, info] of Object.entries(data || {})) {
    if (!info || typeof info !== "object") continue;
    const status = info.status || "ー";
    const hitRate = isNaN(info.hit_rate) ? 0 : Math.max(0, Math.min(100, info.hit_rate));
    clean[venue] = { status, hit_rate: hitRate };
  }
  return clean;
}

// =========================================================
// ✅ メイン描画処理
// =========================================================
function renderVenues() {
  VIEW.innerHTML = ""; // 初期化

  const venues = Object.entries(raceData);
  if (venues.length === 0) {
    VIEW.innerHTML = `<p class="no-data">データが存在しません。</p>`;
    return;
  }

  venues.forEach(([name, info]) => {
    const status = info.status || "ー";
    const hit = info.hit_rate ?? 0;
    const active = status === "開催中";

    // 各会場カード
    const card = document.createElement("div");
    card.className = "venue-card";
    card.style.opacity = active ? "1.0" : "0.5";
    card.style.pointerEvents = active ? "auto" : "none";

    // 内容構築
    card.innerHTML = `
      <div class="venue-header">${name}</div>
      <div class="venue-status ${active ? "active" : "inactive"}">${status}</div>
      <div class="venue-hit">的中率 ${hit}%</div>
    `;

    // 開催中クリック時：詳細表示 or コメントなどへ遷移（既存関数対応）
    if (active && typeof render === "function") {
      card.addEventListener("click", () => render(name, info));
    }

    VIEW.appendChild(card);
  });
}

// =========================================================
// ✅ 日付表示更新
// =========================================================
function updateDateLabel() {
  const now = new Date();
  const target =
    currentMode === "today"
      ? now
      : new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  todayLabel.textContent = `${y}-${m}-${d}`;
}

// =========================================================
// ✅ イベント設定
// =========================================================
toggleToday?.addEventListener("click", () => {
  currentMode = "today";
  updateDateLabel();
  fetchRaceData();
});

togglePrev?.addEventListener("click", () => {
  currentMode = "prev";
  updateDateLabel();
  fetchRaceData();
});

refreshBtn?.addEventListener("click", () => {
  fetchRaceData();
});

// =========================================================
// ✅ 初期起動
// =========================================================
updateDateLabel();
fetchRaceData();

// =========================================================
// ✅ スタイル補助（既存CSSで動作）
// =========================================================
// .venue-card : 背景カラー, 角丸, レイアウトは既存style.css準拠
// .inactive   : 非開催（半透明）
// .active     : 開催中（通常）
// =========================================================