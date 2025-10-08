// ===============================
// AI競艇予想アプリ：全国勝率+30日対応版
// ===============================

// ====== 画面構成 ======
const screens = {
  venues: document.getElementById("screen-venues"),
  races: document.getElementById("screen-races"),
  detail: document.getElementById("screen-detail"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// ====== 初期ロード ======
document.addEventListener("DOMContentLoaded", async () => {
  await initApp();
});

async function initApp() {
  document.getElementById("aiStatus").innerText = "AI初期化中...";
  await fetchRaceData();
  loadVenues();
  document.getElementById("aiStatus").innerText = "AI初期化完了";
}

// ===============================
// データ取得・キャッシュ
// ===============================
async function fetchRaceData() {
  const CACHE_KEY = "boat_race_data";
  const CACHE_DATE_KEY = "boat_race_cache_date";
  const today = new Date().toISOString().slice(0, 10);

  const cached = localStorage.getItem(CACHE_KEY);
  const cacheDate = localStorage.getItem(CACHE_DATE_KEY);

  if (cached && cacheDate === today) {
    console.log("📦 キャッシュデータ使用");
    return;
  }

  console.log("🌐 新データ取得中...");
  const url = "https://boatraceopenapi.github.io/results/v2/latest.json";
  const res = await fetch(url);
  const data = await res.json();
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_DATE_KEY, today);
  console.log("✅ 新データ取得完了");
}

// ===============================
// 会場一覧（24場）
// ===============================
function loadVenues() {
  const venues = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
    "蒲郡","常滑","津","三国","びわこ","住之江",
    "尼崎","鳴門","丸亀","児島","宮島","徳山",
    "下関","若松","芦屋","福岡","唐津","大村"
  ];

  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";

  venues.forEach((v, i) => {
    const box = document.createElement("div");
    box.className = "venue-box";

    const title = document.createElement("div");
    title.className = "venue-name";
    title.innerText = v;

    const status = document.createElement("div");
    status.className = "venue-status";
    status.innerText = (Math.random() > 0.5) ? "開催中" : "ー";

    const rate = document.createElement("div");
    rate.className = "venue-rate";
    rate.innerText = `AI的中率：${(Math.random()*100).toFixed(1)}%`;

    box.appendChild(title);
    box.appendChild(status);
    box.appendChild(rate);

    box.onclick = () => loadRaces(v, i + 1);
    grid.appendChild(box);
  });
}

// ===============================
// レース一覧
// ===============================
function loadRaces(venueName, venueNo) {
  showScreen("races");
  document.getElementById("venueTitle").innerText = `${venueName}`;
  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.onclick = () => loadDetail(venueName, venueNo, i);
    grid.appendChild(btn);
  }

  document.getElementById("backToVenues").onclick = () => showScreen("venues");
}
// ===============================
// レース詳細（出走表 + AI表示）
// ===============================
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
      `<tr><td colspan="8">データなし</td></tr>`;
    return;
  }

  renderEntryTable(race);
  renderAIBuy(race);
  renderComments(race);
  renderRanking(race);
}

// ===============================
// 出走表：詳細テーブル
// ===============================
function renderEntryTable(race) {
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  race.boats.forEach((b) => {
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);

    // 全国勝率と当地勝率を短縮表示（小数→整数）
    const localRate = Math.round(b.racer_local_top_3_percent);
    const nationalRate = Math.round(b.racer_nationwide_top_3_percent || 0);

    // フライング表示
    const flying = b.racer_flying_count > 0 ? `F${b.racer_flying_count}` : "―";

    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>
        <div class="racer-rank">${["A1","A2","B1","B2"][b.racer_class_number - 1] || "?"}</div>
        <div class="racer-name">${b.racer_name}</div>
        <div class="racer-st">ST(${b.racer_average_start_timing.toFixed(2)})</div>
      </td>
      <td>${localRate}%</td>
      <td>${nationalRate}%</td>
      <td>${b.racer_assigned_motor_number}</td>
      <td>${b.racer_assigned_motor_top_3_percent.toFixed(1)}%</td>
      <td>${flying}</td>
      <td>${aiEval(b)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===============================
// AI評価記号生成
// ===============================
function aiEval(b) {
  const s =
    b.racer_local_top_3_percent +
    (b.racer_nationwide_top_3_percent || 0) +
    b.racer_assigned_motor_top_3_percent;

  if (s > 180) return "◎";
  if (s > 150) return "○";
  if (s > 120) return "△";
  return "―";
}

// ===============================
// AI予想買い目表示
// ===============================
function renderAIBuy(race) {
  const main = document.querySelector("#aiMain tbody");
  const sub = document.querySelector("#aiSub tbody");
  main.innerHTML = "";
  sub.innerHTML = "";

  // ダミー生成（※後にAI学習結果を自動反映予定）
  const mainData = [
    { combo: "1-2-3", prob: 42 },
    { combo: "1-3-2", prob: 31 },
    { combo: "1-4-2", prob: 12 },
  ];
  const subData = [
    { combo: "2-1-3", prob: 9 },
    { combo: "3-1-2", prob: 6 },
  ];

  mainData.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${m.combo}</td><td>${m.prob}%</td>`;
    main.appendChild(tr);
  });
  subData.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${m.combo}</td><td>${m.prob}%</td>`;
    sub.appendChild(tr);
  });
}

// ===============================
// コメント生成（ランダム文含む）
// ===============================
function renderComments(race) {
  const tbody = document.querySelector("#commentTable tbody");
  tbody.innerHTML = "";

  const comments = [
    "展開次第で上位可", "差し展開で浮上", "好モーター維持", "舟足安定",
    "ターン鋭く仕上がり良", "直線スピードあり", "波乱要素あり",
    "リズム上向き", "調整一息", "進入次第"
  ];

  race.boats.forEach((b) => {
    let text = "展開次第で上位可";
    const rate = b.racer_local_top_3_percent;

    if (rate > 60) text = "圧倒的展開！";
    else if (rate > 45) text = "好調維持！";
    else if (rate > 30) text = comments[Math.floor(Math.random() * comments.length)];
    else text = "厳しい展開";

    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>${text}</td>
      <td>${rate.toFixed(1)}%</td>
    `;
    tbody.appendChild(tr);
  });
}
// ===============================
// AI順位予測（評価値ソート）
// ===============================
function renderRanking(race) {
  const tbody = document.querySelector("#rankingTable tbody");
  tbody.innerHTML = "";

  const sorted = [...race.boats].sort(
    (a, b) =>
      b.racer_local_top_3_percent +
      (b.racer_nationwide_top_3_percent || 0) +
      b.racer_assigned_motor_top_3_percent -
      (a.racer_local_top_3_percent +
        (a.racer_nationwide_top_3_percent || 0) +
        a.racer_assigned_motor_top_3_percent)
  );

  sorted.forEach((b, i) => {
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);

    const evalValue = (
      b.racer_local_top_3_percent +
      (b.racer_nationwide_top_3_percent || 0) +
      b.racer_assigned_motor_top_3_percent
    ).toFixed(1);

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_name}</td>
      <td>${evalValue}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===============================
// データ更新ボタン制御
// ===============================
document.getElementById("refreshBtn").addEventListener("click", async () => {
  const btn = document.getElementById("refreshBtn");
  const status = document.getElementById("aiStatus");

  btn.disabled = true;
  status.innerText = "データ更新中...";
  try {
    await updateData();
    status.innerText = "更新完了";
  } catch (e) {
    console.error(e);
    status.innerText = "更新失敗";
  } finally {
    setTimeout(() => {
      status.innerText = "AI待機中";
      btn.disabled = false;
    }, 2000);
  }
});

// ===============================
// データ自動取得・更新
// ===============================
async function updateData() {
  const cacheBuster = `?_=${Date.now()}`;
  const res = await fetch("data.json" + cacheBuster);
  if (!res.ok) throw new Error("データ取得に失敗しました");
  const data = await res.json();
  localStorage.setItem("boatRaceData", JSON.stringify(data));
}

// ===============================
// ストレージからキャッシュ復元
// ===============================
async function loadCachedData() {
  const saved = localStorage.getItem("boatRaceData");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

// ===============================
// 日付・タブ制御
// ===============================
document.getElementById("todayBtn").addEventListener("click", () => {
  document.getElementById("todayBtn").classList.add("active");
  document.getElementById("yesterdayBtn").classList.remove("active");
  document.getElementById("dateLabel").innerText = formatDate(0);
});

document.getElementById("yesterdayBtn").addEventListener("click", () => {
  document.getElementById("yesterdayBtn").classList.add("active");
  document.getElementById("todayBtn").classList.remove("active");
  document.getElementById("dateLabel").innerText = formatDate(-1);
});

function formatDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// ===============================
// 戻るボタン処理
// ===============================
document.getElementById("backToRaces").onclick = () => showScreen("races");
document.getElementById("backToVenues").onclick = () => showScreen("venues");

// ===============================
// 初期化処理（キャッシュ対応）
// ===============================
(async () => {
  const cached = await loadCachedData();
  if (cached) console.log("✅ キャッシュからデータを読み込みました");
  loadVenues();
  document.getElementById("aiStatus").innerText = "AI初期化完了";
})();