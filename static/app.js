// ==============================================
// app.js（完全統合版）
// ==============================================

// HTML要素取得
const GRID = document.getElementById("venues-grid");
const TODAY_LABEL = document.getElementById("todayLabel");

// ====== 本日の日付を表示 ======
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");
TODAY_LABEL.textContent = `${yyyy}/${mm}/${dd}`;

// ====== データ読込（出走データ＋予測データ） ======
let raceData = {};
let predictionData = {};

async function loadAllData() {
  try {
    // 出走データ（data.json）
    const res1 = await fetch("../data/data.json?_=" + new Date().getTime());
    if (!res1.ok) throw new Error("data.json 取得失敗");
    raceData = await res1.json();

    // 予測データ（predictions.json）
    const res2 = await fetch("../data/predictions.json?_=" + new Date().getTime());
    if (res2.ok) {
      predictionData = await res2.json();
    } else {
      console.warn("⚠️ predictions.json 読込失敗（初回など）");
    }

    renderVenues(raceData);
  } catch (err) {
    console.error("❌ データ読み込み失敗:", err);
    GRID.innerHTML = "<p style='color:red;'>データ読み込みに失敗しました。</p>";
  }
}

// ====== 24場グリッド表示 ======
function renderVenues(data) {
  GRID.innerHTML = "";
  const venues = Object.keys(data);
  if (venues.length === 0) {
    GRID.innerHTML = "<p>本日のデータがありません。</p>";
    return;
  }

  venues.forEach((venue) => {
    const div = document.createElement("div");
    div.className = "venue";
    div.textContent = venue;
    div.onclick = () => showRaces(venue, data[venue]);
    GRID.appendChild(div);
  });
}

// ====== レース一覧表示 ======
function showRaces(venue, venueData) {
  GRID.innerHTML = `<h2>${venue}</h2>`;
  const races = venueData?.races || {};
  if (Object.keys(races).length === 0) {
    GRID.innerHTML += "<p>出走データなし。</p>";
    return;
  }

  Object.keys(races).forEach((no) => {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${no}R`;
    btn.onclick = () => showRaceDetail(venue, no, races[no]);
    GRID.appendChild(btn);
  });
}

// ====== 出走表＋AI予測表示 ======
function showRaceDetail(venue, no, race) {
  GRID.innerHTML = `<h2>${venue} ${no}R 出走表</h2>`;

  const table = document.createElement("table");
  table.className = "race-table";

  // テーブルヘッダー
  const header = document.createElement("tr");
  header.innerHTML = "<th>艇</th><th>選手名</th><th>級</th><th>F</th><th>L</th><th>展示</th><th>AI予測</th>";
  table.appendChild(header);

  const colors = ["#ff0000", "#0000ff", "#008000", "#ffcc00", "#ff66cc", "#999999"];

  (race.entries || []).forEach((e, idx) => {
    const tr = document.createElement("tr");
    tr.style.backgroundColor = colors[idx] || "#eee";

    // 該当AI予測を取得
    const predKey = `${venue}_${no}`;
    const pred = predictionData?.[predKey] || null;
    const aiText = pred
      ? `${pred.result}（確率${Math.round(pred.prob * 100)}%）`
      : "-";

    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${e.name}</td>
      <td>${e.class}</td>
      <td>${e.f}</td>
      <td>${e.l}</td>
      <td>${e.tenji}</td>
      <td style="font-weight:bold;">${aiText}</td>
    `;
    table.appendChild(tr);
  });

  GRID.appendChild(table);

  // 戻るボタン
  const back = document.createElement("button");
  back.textContent = "← 戻る";
  back.onclick = () => showRaces(venue, raceData[venue]);
  GRID.appendChild(back);
}

// ====== 実行 ======
loadAllData();