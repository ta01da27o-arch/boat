// app.js
const DATA_URL = "https://raw.githubusercontent.com/ta01da27o-arch/boat/main/data/data.json";
const view = document.getElementById("view");

// ========== 初期化 ==========
window.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  fetchData();
});

// ========== ヘッダー ==========
function renderHeader() {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
    <header class="app-header">
      <div class="title-wrap">
        <h1 class="app-title">🏁 競艇AI予想</h1>
        <div class="meta-row">
          <span class="date-label" id="todayLabel">${getTodayLabel()}</span>
        </div>
      </div>
      <div class="header-right">
        <button class="btn refresh" onclick="fetchData()">更新</button>
      </div>
    </header>
    `
  );
}

// ========== 日付表示 ==========
function getTodayLabel() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

// ========== データ取得 ==========
async function fetchData() {
  view.innerHTML = `<div style="padding:1em;text-align:center;">⏳ 読み込み中...</div>`;
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("ネットワーク応答が不正です");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("データが空です");
    }

    renderData(data);
  } catch (err) {
    console.error("❌ データ取得に失敗:", err);
    view.innerHTML = `
      <div class="card" style="color:red; text-align:center; font-weight:bold; padding:1em;">
        ⚠️ データ取得に失敗しました。<br>
        (${err.message})
      </div>`;
  }
}

// ========== データ描画 ==========
function renderData(data) {
  const html = `
    <div class="view">
      <div class="card">
        <h2>🏁 本日のレース (${data.length}件)</h2>
        <div class="races-grid">
          ${data
            .map(
              (r) => `
              <div class="race-btn">
                ${r.date || "日付不明"}<br>
                ${r.venue || "会場不明"} 第${r.race}R<br>
                <span style="font-size:13px; color:#555;">
                  風:${r.wind ?? "-"}m 波:${r.wave ?? "-"}m
                </span>
              </div>`
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
  view.innerHTML = html;
}
