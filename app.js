// app.js
const DATA_URL = "https://raw.githubusercontent.com/ta01da27o-arch/boat/main/data/data.json";

async function fetchData() {
  const view = document.getElementById("view");
  view.innerHTML = `<div style="padding:1em; color:#666;">⏳ データを読み込んでいます...</div>`;

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) throw new Error("データが空です");

    renderGrid(data);
  } catch (err) {
    console.error("❌ データ取得エラー:", err);
    view.innerHTML = `
      <div style="color:red; font-weight:bold; padding:1em; background:#fee; border-radius:8px;">
        ⚠️ データ取得に失敗しました。<br>
        <small>${err.message}</small>
      </div>`;
  }
}

// ----------------------------
// 🎨 24場グリッド表示
// ----------------------------
function renderGrid(data) {
  const view = document.getElementById("view");
  const today = formatDate(data[0]?.date || "");

  // 会場ごとにグループ化
  const venues = {};
  data.forEach((r) => {
    const venue = r.venue || "不明会場";
    if (!venues[venue]) venues[venue] = [];
    venues[venue].push(r);
  });

  const gridHtml = Object.keys(venues)
    .map((venue) => {
      const races = venues[venue]
        .map((r) => `<div>${r.race}R</div>`)
        .join("");
      return `
        <div class="venue-card">
          <h3>${venue}</h3>
          <div class="races">${races}</div>
        </div>
      `;
    })
    .join("");

  view.innerHTML = `
    <div style="padding:1em;">
      <h2 style="margin-bottom:1em;">🏁 ${today} レース一覧</h2>
      <div class="venue-grid">${gridHtml}</div>
    </div>
  `;
}

// ----------------------------
// 📅 日付整形
// ----------------------------
function formatDate(dateStr) {
  if (!dateStr || dateStr.length !== 8) return "日付不明";
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return `${y}年${m}月${d}日`;
}

// ----------------------------
// 💄 グリッドスタイル
// ----------------------------
const style = document.createElement("style");
style.textContent = `
  .venue-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }
  .venue-card {
    border: 1px solid #ccc;
    border-radius: 10px;
    background: #f9f9f9;
    padding: 0.6em;
    text-align: center;
  }
  .venue-card h3 {
    margin-bottom: 0.4em;
    font-size: 1.1em;
    color: #036;
  }
  .venue-card .races {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }
  .venue-card .races div {
    background: #007bff;
    color: white;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 0.85em;
  }
`;
document.head.appendChild(style);

// ----------------------------
// 🚀 実行
// ----------------------------
window.addEventListener("DOMContentLoaded", fetchData);