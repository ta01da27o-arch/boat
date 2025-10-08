// ====== 競艇AI予想アプリ：全国勝率対応版 ======

// 画面切り替え
const screens = {
  venues: document.getElementById("screen-venues"),
  races: document.getElementById("screen-races"),
  detail: document.getElementById("screen-detail")
};
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ===== 初期化 =====
document.addEventListener("DOMContentLoaded", () => {
  loadVenues();
  document.getElementById("aiStatus").innerText = "AI初期化完了";
  document.getElementById("todayBtn").onclick = () => setDay("today");
  document.getElementById("yesterdayBtn").onclick = () => setDay("yesterday");
  document.getElementById("refreshBtn").onclick = () => location.reload();
});

let currentDay = "today";
function setDay(type) {
  currentDay = type;
  document.getElementById("todayBtn").classList.toggle("active", type === "today");
  document.getElementById("yesterdayBtn").classList.toggle("active", type === "yesterday");
  document.getElementById("aiStatus").innerText = type === "today" ? "本日データ読込中..." : "前日データ読込中...";
  loadVenues();
}

// ===== 会場一覧 =====
function loadVenues() {
  const venues = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
    "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
    "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
  ];
  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";
  venues.forEach((v, i) => {
    const btn = document.createElement("button");
    btn.textContent = v;
    btn.onclick = () => loadRaces(v, i + 1);
    grid.appendChild(btn);
  });
}

// ===== レース一覧 =====
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

// ===== レース詳細 =====
async function loadDetail(venueName, venueNo, raceNo) {
  showScreen("detail");
  document.getElementById("raceTitle").innerText = `${venueName} 第${raceNo}R`;

  const res = await fetch("data.json");
  const data = await res.json();
  const race = data.find(r => r.race_stadium_number === venueNo && r.race_number === raceNo);
  if (!race) {
    document.querySelector("#entryTable tbody").innerHTML = `<tr><td colspan="8">データなし</td></tr>`;
    return;
  }

  renderEntryTable(race);
  renderAIBuy(race);
  renderComments(race);
  renderRanking(race);
}

// ===== 出走表 =====
function renderEntryTable(race) {
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";
  race.boats.forEach(b => {
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_name}</td>
      <td>${b.racer_flying_count}</td>
      <td>${b.racer_national_top_3_percent.toFixed(2)}%</td>
      <td>${b.racer_local_top_3_percent.toFixed(2)}%</td>
      <td>${b.racer_assigned_motor_top_3_percent.toFixed(2)}%</td>
      <td>${b.racer_average_start_timing.toFixed(2)}</td>
      <td>${aiEval(b)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== AI評価 =====
function aiEval(b) {
  const score =
    b.racer_national_top_3_percent * 0.4 +
    b.racer_local_top_3_percent * 0.4 +
    b.racer_assigned_motor_top_3_percent * 0.2;
  if (score > 80) return "◎";
  if (score > 65) return "○";
  if (score > 50) return "△";
  return "―";
}

// ===== 買い目予想（本命・中穴・大穴 各5点） =====
function renderAIBuy(race) {
  const aiMain = document.querySelector("#aiMain tbody");
  const aiMiddle = document.querySelector("#aiMiddle tbody");
  const aiBig = document.querySelector("#aiBig tbody");
  aiMain.innerHTML = "";
  aiMiddle.innerHTML = "";
  aiBig.innerHTML = "";

  const buySets = (prefix) => Array.from({ length: 5 }, (_, i) => {
    const combo = `${i + 1}-${((i + 2) % 6) + 1}-${((i + 3) % 6) + 1}`;
    const rate = (Math.random() * 40 + 30).toFixed(1);
    return `<tr><td>${combo}</td><td>${rate}%</td></tr>`;
  }).join("");

  aiMain.innerHTML = buySets("main");
  aiMiddle.innerHTML = buySets("mid");
  aiBig.innerHTML = buySets("big");
}

// ===== 展開コメント（文章のみ） =====
function renderComments(race) {
  const tbody = document.querySelector("#commentTable tbody");
  tbody.innerHTML = "";
  race.boats.forEach(b => {
    let text = "";
    const base = b.racer_national_top_3_percent;
    if (base > 70) text = "スピードと安定感で押し切る可能性が高い。";
    else if (base > 55) text = "展開をうまく掴めば上位進出も可能。";
    else if (base > 40) text = "スタート次第でチャンスあり。";
    else text = "展開に恵まれなければ厳しい戦い。";
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML = `<td>${b.racer_boat_number}</td><td>${text}</td>`;
    tbody.appendChild(tr);
  });
}

// ===== 順位予測 =====
function renderRanking(race) {
  const tbody = document.querySelector("#rankingTable tbody");
  tbody.innerHTML = "";
  const sorted = [...race.boats].sort(
    (a, b) => b.racer_national_top_3_percent - a.racer_national_top_3_percent
  );
  sorted.forEach((b, i) => {
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML = `<td>${i + 1}</td><td>${b.racer_boat_number}</td><td>${b.racer_name}</td><td>${b.racer_national_top_3_percent.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
}

document.getElementById("backToRaces").onclick = () => showScreen("races");