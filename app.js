// ======================================
// 競艇AI予想アプリ app.js（完全対応版）
// ======================================

// 画面要素
const mainScreen = document.getElementById("screen-main");
const raceScreen = document.getElementById("screen-races");
const detailScreen = document.getElementById("screen-race");

// グローバル変数
let groupedVenues = {};
let historyData = {};

// ======================================
// JSON取得関数（共通）
// ======================================
async function fetchJSON(path) {
  try {
    const res = await fetch(path + `?v=${Date.now()}`); // キャッシュ回避
    if (!res.ok) throw new Error(`${path} 読み込み失敗`);
    return await res.json();
  } catch (err) {
    console.error("fetchJSON error:", err);
    return null;
  }
}

// ======================================
// メイン画面描画
// ======================================
async function renderMain() {
  const rawData = await fetchJSON("data.json");
  const history = await fetchJSON("history.json");

  if (!rawData) {
    mainScreen.innerHTML = `<p style="color:red;">data.jsonの読み込みに失敗しました。</p>`;
    return;
  }

  // ✅ 配列でなければ配列に変換
  const data = Array.isArray(rawData) ? rawData : [rawData];

  historyData = history || {};
  mainScreen.innerHTML = "";

  mainScreen.innerHTML += `
    <h1>🏁 AI競艇予想</h1>
    <div class="update-info">
      <button id="refreshBtn" class="blue">更新</button>
      <span class="ai-status">AI学習中...</span>
    </div>
  `;

  groupedVenues = {};
  data.forEach((race) => {
    const stadium = race.race_stadium_number || "不明";
    if (!groupedVenues[stadium]) groupedVenues[stadium] = [];
    groupedVenues[stadium].push(race);
  });

  const wrapper = document.createElement("div");
  wrapper.className = "venue-wrapper";

  Object.entries(groupedVenues).forEach(([stadium, races]) => {
    const div = document.createElement("div");
    div.className = "venue-card";
    const name = `第${stadium}場`;
    const hitRate = calcHitRate(name);
    div.innerHTML = `
      <div class="venue-name">${name}</div>
      <div class="venue-status">開催中</div>
      <div class="venue-hit">的中率: ${hitRate}%</div>
    `;
    div.onclick = () => showRaces(name, races);
    wrapper.appendChild(div);
  });

  mainScreen.appendChild(wrapper);
  document.getElementById("refreshBtn").onclick = () => renderMain();
  showScreen(mainScreen);
}

// ======================================
// レース一覧表示
// ======================================
function showRaces(venueName, races) {
  raceScreen.innerHTML = `
    <button class="back-btn">← 戻る</button>
    <h2>${venueName} のレース一覧</h2>
  `;

  const list = document.createElement("div");
  list.className = "race-list";

  races.forEach((race) => {
    const div = document.createElement("div");
    div.className = "race-item";
    const num = race.race_number || "?";
    const title = race.race_title || "";
    const sub = race.race_subtitle || "";
    const grade = race.race_grade_number || "";
    const time = race.race_closed_at
      ? new Date(race.race_closed_at).toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--";

    div.innerHTML = `
      <div class="race-num">${num}R</div>
      <div class="race-info">
        <div>${title}</div>
        <div class="race-sub">${sub}</div>
      </div>
      <div class="race-time">${time}</div>
    `;
    div.onclick = () => showRaceDetail(race);
    list.appendChild(div);
  });

  raceScreen.appendChild(list);
  raceScreen.querySelector(".back-btn").onclick = () => showScreen(mainScreen);
  showScreen(raceScreen);
}

// ======================================
// レース詳細表示
// ======================================
function showRaceDetail(race) {
  detailScreen.innerHTML = `
    <button class="back-btn">← 戻る</button>
    <h2>${race.race_title || "レース詳細"}</h2>
    <p>${race.race_subtitle || ""}</p>
    <p>距離: ${race.race_distance || 1800}m</p>
    <p>締切時刻: ${
      race.race_closed_at
        ? new Date(race.race_closed_at).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--"
    }</p>
  `;

  // 出走表
  const table = document.createElement("table");
  table.className = "boat-table";
  table.innerHTML = `
    <tr>
      <th>艇</th><th>選手</th><th>登録番号</th><th>支部</th><th>級</th>
    </tr>
  `;

  (race.boats || []).forEach((b) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_name || ""}</td>
      <td>${b.racer_number || ""}</td>
      <td>${b.racer_branch_number || ""}</td>
      <td>${b.racer_class_number || ""}</td>
    `;
    table.appendChild(tr);
  });

  detailScreen.appendChild(table);
  detailScreen.querySelector(".back-btn").onclick = () =>
    showScreen(raceScreen);
  showScreen(detailScreen);
}

// ======================================
// 的中率計算（履歴から）
// ======================================
function calcHitRate(venueName) {
  if (!historyData || !Array.isArray(historyData)) return 0;

  const records = historyData.filter(
    (h) => h.race_stadium_name === venueName && h.result_hit === true
  );
  const total = historyData.filter(
    (h) => h.race_stadium_name === venueName
  ).length;

  return total > 0 ? Math.round((records.length / total) * 100) : 0;
}

// ======================================
// 画面切り替え制御
// ======================================
function showScreen(screen) {
  [mainScreen, raceScreen, detailScreen].forEach((el) => {
    el.style.display = el === screen ? "block" : "none";
  });
}

// ======================================
// 初期化
// ======================================
window.addEventListener("load", () => {
  renderMain();
});