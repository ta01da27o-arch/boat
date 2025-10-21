// app.js
const DATA_URL = "https://raw.githubusercontent.com/ta01da27o-arch/boat/main/data/data.json";

// ----------------------------
// 📦 データ取得
// ----------------------------
async function fetchData() {
  const view = document.getElementById("view");
  view.innerHTML = `<div style="padding:1em; color:#666;">⏳ データを読み込んでいます...</div>`;

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("データが空です");
    }

    renderData(data);
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
// 🎨 データ描画
// ----------------------------
function renderData(data) {
  const view = document.getElementById("view");
  const today = formatDate(data[0]?.date || "");

  // 会場ごとにまとめる
  const grouped = {};
  data.forEach((r) => {
    const venue = r.venue || "不明会場";
    if (!grouped[venue]) grouped[venue] = [];
    grouped[venue].push(r);
  });

  // HTML生成
  const html = Object.keys(grouped)
    .map((venue) => {
      const races = grouped[venue]
        .map(
          (r) => `
        <li style="margin:4px 0; padding:6px 8px; border:1px solid #ccc; border-radius:6px; background:#fafafa;">
          <b>${r.race}R</b>　
          風:${r.wind ?? "-"}m／波:${r.wave ?? "-"}m　
          <span style="color:#888;">(${r.result || "結果未登録"})</span>
        </li>`
        )
        .join("");

      return `
        <section style="margin-bottom:1.2em;">
          <h3 style="margin-bottom:6px; color:#036;">🏟 ${venue}</h3>
          <ul style="list-style:none; padding-left:0;">${races}</ul>
        </section>
      `;
    })
    .join("");

  view.innerHTML = `
    <div style="padding:1em;">
      <h2 style="margin-bottom:0.5em;">🏁 ${today} のレース (${data.length}件)</h2>
      ${html}
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
// 🔁 再読み込みボタン追加
// ----------------------------
function addReloadButton() {
  const btn = document.createElement("button");
  btn.textContent = "🔄 最新データを再取得";
  btn.style.cssText =
    "display:block; margin:1em auto; padding:8px 16px; border:none; background:#007bff; color:white; border-radius:6px; cursor:pointer;";
  btn.onclick = fetchData;
  document.body.prepend(btn);
}

// ----------------------------
// 🚀 実行
// ----------------------------
window.addEventListener("DOMContentLoaded", () => {
  addReloadButton();
  fetchData();
});