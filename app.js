// app.js
const DATA_URL = "https://raw.githubusercontent.com/ta01da27o-arch/boat/main/data/data.json";

async function fetchData() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("データが空です");
    }

    renderData(data);
  } catch (err) {
    console.error("❌ データ取得に失敗:", err);
    document.getElementById("view").innerHTML = `
      <div style="color:red; font-weight:bold; padding:1em;">
        ⚠️ データ取得に失敗しました。<br>
        (${err.message})
      </div>`;
  }
}

function renderData(data) {
  const container = document.getElementById("view");
  container.innerHTML = `
    <h2>🏁 本日のレース (${data.length}件)</h2>
    <ul>
      ${data
        .map(
          (r) => `
        <li>
          ${r.date || "日付不明"} - ${r.venue || "場不明"} 第${r.race}R
          （風:${r.wind}m 波:${r.wave}m）
        </li>`
        )
        .join("")}
    </ul>
  `;
}

// ページロード時に実行
fetchData();
