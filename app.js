// ====== AI競艇予想アプリ：全国勝率データ反映版 ======

// -------------------------------
// 画面切り替え制御
// -------------------------------
const screens = {
  venues: document.getElementById("screen-venues"),
  races: document.getElementById("screen-races"),
  detail: document.getElementById("screen-detail"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// -------------------------------
// 初期ロード
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadVenues();
  document.getElementById("aiStatus").innerText = "AI初期化完了";
  document.getElementById("dateLabel").innerText = getTodayLabel();
});

function getTodayLabel() {
  const d = new Date();
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// -------------------------------
// 会場一覧（24場）
// -------------------------------
async function loadVenues() {
  const venues = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
    "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
    "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
  ];

  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";

  // data.json から全国的中率データを取得
  let aiData = [];
  try {
    const res = await fetch("data.json");
    aiData = await res.json();
  } catch (e) {
    console.warn("data.json 読み込み失敗:", e);
  }

  venues.forEach((name, i) => {
    const venueNo = i + 1;
    const btn = document.createElement("button");

    const aiRate = getVenueRate(aiData, venueNo);
    const status = getVenueStatus();

    btn.innerHTML = `
      <div class="venue-name">${name}</div>
      <div class="venue-status">${status}</div>
      <div class="venue-rate">AI的中率 ${aiRate}%</div>
    `;
    btn.onclick = () => loadRaces(name, venueNo);
    grid.appendChild(btn);
  });
}

function getVenueStatus() {
  // 仮ロジック：日によって開催中・終了・なしを切替
  const rnd = Math.random();
  if (rnd > 0.7) return "開催中";
  if (rnd > 0.4) return "レース終了";
  return "開催なし";
}

function getVenueRate(aiData, venueNo) {
  if (!aiData || aiData.length === 0) return "-";
  const filtered = aiData.filter((r) => r.race_stadium_number === venueNo);
  if (filtered.length === 0) return "-";
  const avg =
    filtered.reduce((s, r) => s + (r.ai_hit_rate || 0), 0) / filtered.length;
  return Math.round(avg);
}

// -------------------------------
// レース一覧（12R）
// -------------------------------
function loadRaces(venueName, venueNo) {
  showScreen("races");
  document.getElementById("venueTitle").innerText = venueName;

  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.onclick = () => loadDetail(venueName, venueNo, i);
    grid.appendChild(btn);
  }

  document.getElementById("backToVenues").onclick = () => showScreen("venues");
}

// -------------------------------
// 出走表
// -------------------------------
async function loadDetail(venueName, venueNo, raceNo) {
  showScreen("detail");
  document.getElementById("raceTitle").innerText = `${venueName} 第${raceNo}R`;

  const res = await fetch("data.json");
  const data = await res.json();
  const race = data.find(
    (r) => r.race_stadium_number === venueNo && r.race_number === raceNo
  );

  if (!race) {
    document.querySelector("#entryTable tbody").innerHTML =
      "<tr><td colspan='7'>データなし</td></tr>";
    return;
  }

  renderEntryTable(race);
  renderAIBuy(race);
  renderComments(race);
  renderRanking(race);
}

// -------------------------------
// 出走表の描画
// -------------------------------
function renderEntryTable(race) {
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  race.boats.forEach((b) => {
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);

    const winRate = Math.round(b.racer_local_top_3_percent); // 小数点切り捨て→整数化
    const cls = ["A1", "A2", "B1", "B2"][b.racer_class_number - 1] || "-";
    const flying = b.racer_flying_count > 0 ? `F${b.racer_flying_count}` : "―";

    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>
        <div>${cls}</div>
        <div>${b.racer_name}</div>
        <div>ST ${b.racer_average_start_timing.toFixed(2)}</div>
      </td>
      <td>${flying}</td>
      <td>${winRate}%</td>
      <td>${b.racer_assigned_motor_number}</td>
      <td>${b.racer_course_number}</td>
      <td>${aiEval(b)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// -------------------------------
// AI評価ロジック
// -------------------------------
function aiEval(b) {
  const s =
    b.racer_local_top_3_percent + b.racer_assigned_motor_top_3_percent;
  if (s > 100) return "◎";
  if (s > 80) return "○";
  if (s > 60) return "△";
  return "―";
}

// -------------------------------
// AI本命・穴
// -------------------------------
function renderAIBuy(race) {
  const main = document.querySelector("#aiMain tbody");
  const sub = document.querySelector("#aiSub tbody");
  main.innerHTML = `
    <tr><td>1-2-3</td><td>42%</td></tr>
    <tr><td>1-3-2</td><td>31%</td></tr>`;
  sub.innerHTML = `
    <tr><td>2-1-3</td><td>12%</td></tr>
    <tr><td>3-1-2</td><td>9%</td></tr>`;
}

// -------------------------------
// コメント
// -------------------------------
function renderComments(race) {
  const tbody = document.querySelector("#commentTable tbody");
  tbody.innerHTML = "";
  race.boats.forEach((b) => {
    const val = b.racer_local_top_3_percent;
    let cls = "normal";
    let text = "展開次第で上位可";
    if (val > 60) {
      cls = "super";
      text = "圧倒的展開！";
    } else if (val > 45) {
      cls = "strong";
      text = "優勢な展開";
    } else if (val > 30) {
      cls = "normal";
      text = "中位安定";
    } else {
      cls = "weak";
      text = "厳しい展開";
    }
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML = `<td>${b.racer_boat_number}</td><td class='${cls}'>${text}</td>`;
    tbody.appendChild(tr);
  });
}

// -------------------------------
// AI順位予測
// -------------------------------
function renderRanking(race) {
  const tbody = document.querySelector("#rankingTable tbody");
  tbody.innerHTML = "";
  const sorted = [...race.boats].sort(
    (a, b) => b.racer_local_top_3_percent - a.racer_local_top_3_percent
  );
  sorted.forEach((b, i) => {
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_name}</td>
      <td>${Math.round(b.racer_local_top_3_percent)}%</td>`;
    tbody.appendChild(tr);
  });
}

// -------------------------------
// 戻るボタン
// -------------------------------
document.getElementById("backToRaces").onclick = () => showScreen("races");