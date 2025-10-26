// =========================================================
// app.js 完全安定版（Render + GitHub連携対応）
// =========================================================

const VIEW = document.getElementById("view");
const todayLabel = document.getElementById("todayLabel");
const refreshBtn = document.getElementById("refreshBtn");
let currentMode = "today";
let raceData = {};

// ✅ data.json 取得
async function fetchRaceData() {
  try {
    const res = await fetch("/data.json?cache=" + Date.now(), {
      headers: { "Cache-Control": "no-cache" }
    });
    if (!res.ok) throw new Error("サーバー応答エラー");
    const data = await res.json();
    raceData = sanitizeData(data);
    renderVenues();
  } catch (err) {
    console.error("❌ データ取得失敗:", err);
    VIEW.innerHTML = `<p class="error">データ読み込みエラー</p>`;
  }
}

// ✅ データ整形
function sanitizeData(data) {
  const clean = {};
  for (const [venue, info] of Object.entries(data || {})) {
    clean[venue] = {
      status: info?.status ?? "ー",
      hit_rate: isNaN(info?.hit_rate) ? 0 : info.hit_rate
    };
  }
  return clean;
}

// ✅ 表示更新
function renderVenues() {
  VIEW.innerHTML = "";
  const venues = Object.entries(raceData);

  if (venues.length === 0) {
    VIEW.innerHTML = `<p class="no-data">データなし</p>`;
    return;
  }

  venues.forEach(([name, info]) => {
    const status = info.status || "ー";
    const hit = info.hit_rate ?? 0;
    const active = status === "開催中";

    const card = document.createElement("div");
    card.className = "venue-card";
    card.style.opacity = active ? "1" : "0.6";
    card.style.pointerEvents = active ? "auto" : "none";

    card.innerHTML = `
      <div class="venue-header">${name}</div>
      <div class="venue-status">${status}</div>
      <div class="venue-hit">的中率 ${hit}%</div>
    `;

    VIEW.appendChild(card);
  });
}

// ✅ 日付更新
function updateDateLabel() {
  const now = new Date();
  const target =
    currentMode === "today"
      ? now
      : new Date(now.getTime() - 86400000);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, "0");
  const d = String(target.getDate()).padStart(2, "0");
  todayLabel.textContent = `${y}-${m}-${d}`;
}

// ✅ イベント
refreshBtn?.addEventListener("click", () => fetchRaceData());

// ✅ 初期実行
updateDateLabel();
fetchRaceData();