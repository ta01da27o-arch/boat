// =====================================
// 競艇AI予想アプリ (2025改良版)
// data.json / history.json 両方を自動反映
// =====================================

// ▼ GitHub上のデータURL
const DATA_URL = "https://raw.githubusercontent.com/ta01da27o-arch/boat/main/data/data.json";
const HISTORY_URL = "https://raw.githubusercontent.com/ta01da27o-arch/boat/main/data/history.json";

// ▼ DOM取得
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");

const dateLabel = document.getElementById("dateLabel");
const aiStatus = document.getElementById("aiStatus");
const refreshBtn = document.getElementById("refreshBtn");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

// =====================================
// 共通ユーティリティ
// =====================================

// 24場リスト固定（全国ボート場）
const VENUES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

function formatDateStr(dateStr) {
  return `${dateStr.slice(0,4)}/${dateStr.slice(4,6)}/${dateStr.slice(6,8)}`;
}

// =====================================
// データ取得
// =====================================
async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return await res.json();
}

async function loadData() {
  aiStatus.textContent = "🔄 データ更新中...";
  try {
    const [data, history] = await Promise.all([
      fetchJSON(DATA_URL),
      fetchJSON(HISTORY_URL)
    ]);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("本日のデータが空です");
    }

    renderVenues(data);
    renderResults(history);

    const latestDate = data[0].date;
    dateLabel.textContent = formatDateStr(latestDate);
    aiStatus.textContent = "✅ データ取得完了";

  } catch (err) {
    console.error("❌ データ取得エラー:", err);
    aiStatus.textContent = "⚠️ データ取得に失敗しました";
    venuesGrid.innerHTML = `<div style="color:red;font-weight:bold;">${err.message}</div>`;
  }
}

// =====================================
// 24場グリッド表示
// =====================================
function renderVenues(data) {
  const todayVenues = [...new Set(data.map(d => d.venue))];
  venuesGrid.innerHTML = "";

  VENUES.forEach(name => {
    const active = todayVenues.includes(name);
    const card = document.createElement("div");
    card.className = `venue-card ${active ? "clickable" : "disabled"}`;
    card.innerHTML = `
      <div class="v-name">${name}</div>
      <div class="v-status">${active ? "開催中" : "開催なし"}</div>
      <div class="v-rate">${active ? "📊 データあり" : "—"}</div>
    `;
    if (active) {
      card.addEventListener("click", () => openVenue(name, data));
    }
    venuesGrid.appendChild(card);
  });
}

// =====================================
// レース一覧（12R）表示
// =====================================
function openVenue(venue, data) {
  screenVenues.classList.remove("active");
  screenRaces.classList.add("active");
  venueTitle.textContent = venue;

  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    const raceData = data.find(d => d.venue === venue && d.race === i);
    if (raceData) {
      btn.addEventListener("click", () => openRace(raceData));
    } else {
      btn.classList.add("disabled");
    }
    racesGrid.appendChild(btn);
  }
}

// =====================================
// 出走表・AI予想・コメントなど（仮データ対応）
// =====================================
function openRace(raceData) {
  screenRaces.classList.remove("active");
  screenDetail.classList.add("active");
  raceTitle.textContent = `${raceData.venue} 第${raceData.race}R`;

  renderEntryTable(raceData);
  renderAIPrediction();
  renderComments();
  renderRanking();
}

// 出走表（仮表示）
function renderEntryTable(race) {
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    tbody.innerHTML += `
      <tr class="row-${i}">
        <td>${i}</td>
        <td class="entry-left">
          <div class="klass">A${Math.floor(Math.random() * 3 + 1)}</div>
          <div class="name">選手${i}</div>
          <div class="st">ST:${(Math.random() * 0.2 + 0.1).toFixed(2)}</div>
        </td>
        <td>-</td><td>6.${Math.floor(Math.random() * 80)}</td>
        <td>5.${Math.floor(Math.random() * 90)}</td>
        <td>${(Math.random() * 10).toFixed(1)}</td>
        <td>${i}</td>
        <td><span class="eval-mark">◎</span></td>
      </tr>
    `;
  }
}

// AI予想（ダミーデータ）
function renderAIPrediction() {
  const mainTbody = document.querySelector("#aiMain tbody");
  const subTbody = document.querySelector("#aiSub tbody");
  mainTbody.innerHTML = "";
  subTbody.innerHTML = "";

  const combos = ["1-2-3", "1-3-2", "1-2-4", "2-1-3"];
  combos.forEach((c, i) => {
    mainTbody.innerHTML += `<tr><td>${c}</td><td>${(70 - i * 10)}%</td></tr>`;
    subTbody.innerHTML += `<tr><td>${c}</td><td>${(30 - i * 5)}%</td></tr>`;
  });
}

// コメント（仮）
function renderComments() {
  const tbody = document.querySelector("#commentTable tbody");
  tbody.innerHTML = "";
  const sample = ["逃げ切り期待", "差し狙い", "まくり一発", "まくり差し巧者", "展開待ち", "スタート勝負"];
  for (let i = 1; i <= 6; i++) {
    tbody.innerHTML += `<tr><td>${i}</td><td>${sample[i - 1]}</td></tr>`;
  }
}

// 順位予測（仮）
function renderRanking() {
  const tbody = document.querySelector("#rankingTable tbody");
  tbody.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    tbody.innerHTML += `<tr><td>${i}</td><td>${i}</td><td>選手${i}</td><td>${(90 - i * 10)}</td></tr>`;
  }
}

// レース結果(history.json)から最新10件を表示
function renderResults(history) {
  const tbody = document.querySelector("#resultTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const recent = history.slice(-10).reverse();
  recent.forEach((r, idx) => {
    tbody.innerHTML += `
      <tr>
        <td>${idx + 1}</td>
        <td>${r.race}</td>
        <td>${r.venue}</td>
        <td>${r.result || "—"}</td>
      </tr>
    `;
  });
}

// =====================================
// イベント
// =====================================
refreshBtn.addEventListener("click", loadData);
todayBtn.addEventListener("click", () => {
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  loadData();
});
yesterdayBtn.addEventListener("click", () => {
  todayBtn.classList.remove("active");
  yesterdayBtn.classList.add("active");
  // 仮: 前日データ（今後API対応）
  aiStatus.textContent = "前日データは準備中";
});

backToVenues.addEventListener("click", () => {
  screenRaces.classList.remove("active");
  screenVenues.classList.add("active");
});

backToRaces.addEventListener("click", () => {
  screenDetail.classList.remove("active");
  screenRaces.classList.add("active");
});

// =====================================
// 初期実行
// =====================================
loadData();