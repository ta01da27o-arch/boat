// app.js
// 競艇AI予想アプリ (完全連動・AI予測対応)

const DATA_PATH = "../data/data.json";
const HISTORY_PATH = "../data/history.json";

// ===== 要素取得 =====
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMainTable = document.getElementById("aiMain").querySelector("tbody");
const aiSubTable = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");

const dateLabel = document.getElementById("dateLabel");
const aiStatus = document.getElementById("aiStatus");
const refreshBtn = document.getElementById("refreshBtn");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

let data = {};
let historyData = {};
let currentVenue = null;
let currentRace = null;

// ===== 初期化 =====
async function init() {
  aiStatus.textContent = "データ読込中...";
  dateLabel.textContent = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  try {
    const [dataRes, historyRes] = await Promise.all([
      fetch(DATA_PATH),
      fetch(HISTORY_PATH)
    ]);

    data = await dataRes.json();
    historyData = await historyRes.json();
    aiStatus.textContent = "AI連携完了";

    renderVenues();
  } catch (err) {
    console.error(err);
    aiStatus.textContent = "データ取得失敗";
  }
}

// ===== 24場グリッド表示 =====
function renderVenues() {
  venuesGrid.innerHTML = "";

  Object.keys(data).forEach((venue) => {
    const v = data[venue];
    const card = document.createElement("div");
    card.className = "venue-card clickable";

    const status = v.status || "ー";
    card.innerHTML = `
      <div class="v-name">${venue}</div>
      <div class="v-status">${status}</div>
      <div class="v-rate">${status === "開催中" ? "12R開催予定" : "非開催"}</div>
    `;

    if (status === "ー") card.classList.add("disabled");

    card.addEventListener("click", () => openRaces(venue));
    venuesGrid.appendChild(card);
  });
}

// ===== レース番号選択 =====
function openRaces(venue) {
  currentVenue = venue;
  screenVenues.classList.remove("active");
  screenRaces.classList.add("active");
  venueTitle.textContent = `${venue} のレース一覧`;

  const races = data[venue]?.races || {};
  racesGrid.innerHTML = "";

  Object.keys(races).forEach((race) => {
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = race;
    btn.addEventListener("click", () => openDetail(venue, race));
    racesGrid.appendChild(btn);
  });
}

// ===== 出走表・AI予測・結果表示 =====
function openDetail(venue, race) {
  currentRace = race;
  screenRaces.classList.remove("active");
  screenDetail.classList.add("active");
  raceTitle.textContent = `${venue} ${race}`;

  const raceData = data[venue]?.races?.[race];
  if (!raceData) return;

  // 出走表
  entryTable.innerHTML = "";
  raceData.entries.forEach((e, idx) => {
    const row = document.createElement("tr");
    row.className = `row-${e.lane}`;
    row.innerHTML = `
      <td>${e.lane}</td>
      <td class="entry-left">
        <div class="klass">${e.class}</div>
        <div class="name">${e.name}</div>
        <div class="st">${e.st.toFixed(2)}</div>
      </td>
      <td>${e.f}</td>
      <td>${e.nation}</td>
      <td>${e.local}</td>
      <td>${e.motor}</td>
      <td>${e.course}</td>
      <td class="eval-mark">${e.eval}</td>
    `;
    entryTable.appendChild(row);
  });

  // AI 本命・穴
  aiMainTable.innerHTML = "";
  raceData.ai_main.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${m.bet}</td><td>${m.prob}</td>`;
    aiMainTable.appendChild(tr);
  });

  aiSubTable.innerHTML = "";
  raceData.ai_sub.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${s.bet}</td><td>${s.prob}</td>`;
    aiSubTable.appendChild(tr);
  });

  // 展開コメント
  commentTable.innerHTML = "";
  raceData.comments.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${c.lane}</td><td>${c.comment}</td>`;
    commentTable.appendChild(tr);
  });

  // AI順位予測
  rankingTable.innerHTML = "";
  raceData.ai_rank.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.rank}</td>
      <td>${r.lane}</td>
      <td>${r.name}</td>
      <td>${r.score}</td>
    `;
    rankingTable.appendChild(tr);
  });

  // 結果データ
  renderResult(venue, race);
}

// ===== 結果表示 =====
function renderResult(venue, race) {
  resultTable.innerHTML = "";

  const result = historyData?.[venue]?.[race];
  if (!result || !result.finish) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4">結果データなし</td>`;
    resultTable.appendChild(tr);
    return;
  }

  result.finish.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.rank}</td>
      <td>${r.lane}</td>
      <td>${r.name}</td>
      <td>${r.st.toFixed(2)}</td>
    `;
    resultTable.appendChild(tr);
  });

  const note = document.getElementById("resultNote");
  note.textContent = `決まり手：${result["決まり手"]}`;
}

// ===== 画面戻る操作 =====
backToVenues.addEventListener("click", () => {
  screenRaces.classList.remove("active");
  screenVenues.classList.add("active");
});

backToRaces.addEventListener("click", () => {
  screenDetail.classList.remove("active");
  screenRaces.classList.add("active");
});

// ===== 更新ボタン =====
refreshBtn.addEventListener("click", () => {
  init();
});

// 初期起動
init();