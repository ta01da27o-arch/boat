// ===============================
//  app.js（安定動作版）
// ===============================

// --- 要素取得 ---
const VIEW = document.getElementById("view");
const todayLabel = document.getElementById("todayLabel");
const refreshBtn = document.getElementById("refreshBtn");

// --- 日付表示 ---
const today = new Date();
const y = today.getFullYear();
const m = String(today.getMonth() + 1).padStart(2, "0");
const d = String(today.getDate()).padStart(2, "0");
todayLabel.textContent = `${y}/${m}/${d}`;

// --- データ取得 ---
async function loadRaceData() {
  try {
    const res = await fetch("../data/data.json?_=" + Date.now()); // キャッシュ回避
    if (!res.ok) throw new Error("データ取得失敗");
    const data = await res.json();

    if (!Array.isArray(data)) throw new Error("不正なデータ形式");
    renderVenues(data);
  } catch (err) {
    console.error("❌ データ読み込みエラー:", err);
    VIEW.innerHTML = `<p style="color:red;">データの読み込みに失敗しました。</p>`;
  }
}

// --- 競艇場一覧表示 ---
function renderVenues(data) {
  VIEW.innerHTML = "";

  data.forEach((item) => {
    const div = document.createElement("div");
    div.className = "venue-card";

    const isOpen = item.races && item.races.length > 0;
    const status = isOpen ? "開催中" : "ー";
    const hitRate = item.hit_rate ? `${item.hit_rate}%` : "ー";

    div.innerHTML = `
      <div class="venue-name">${item.venue}</div>
      <div class="venue-status">${status}</div>
      <div class="venue-hit">${hitRate}</div>
    `;

    if (isOpen) {
      div.addEventListener("click", () => showRaces(item));
      div.style.cursor = "pointer";
    }

    VIEW.appendChild(div);
  });
}

// --- 出走表表示 ---
function showRaces(item) {
  VIEW.innerHTML = `
    <button id="backBtn" class="back-btn">← 戻る</button>
    <h2>${item.venue}（的中率：${item.hit_rate || "ー"}%）</h2>
  `;

  if (!item.races || item.races.length === 0) {
    VIEW.innerHTML += `<p>出走表データがありません。</p>`;
  } else {
    const list = document.createElement("ul");
    list.className = "race-list";

    item.races.forEach((r) => {
      const li = document.createElement("li");
      li.textContent = `${r.racer}${r.mark ? `（${r.mark}）` : ""}`;
      list.appendChild(li);
    });

    VIEW.appendChild(list);
  }

  document.getElementById("backBtn").addEventListener("click", loadRaceData);
}

// --- 更新ボタン ---
refreshBtn.addEventListener("click", loadRaceData);

// --- 初期表示 ---
loadRaceData();