// ===============================
// 🚀 BOAT AI 最終統合版 app.js
// ===============================

// ✅ 定義済みパス（index.html内）
const DATA_URL = window.DATA_PATH || "./data/data.json";
const HISTORY_URL = window.HISTORY_PATH || "./data/history.json";

// ✅ 要素取得
const dateLabel = document.getElementById("dateLabel");
const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMainTable = document.getElementById("aiMain").querySelector("tbody");
const aiSubTable = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");
const rankingTable = document.getElementById("rankingTable").querySelector("tbody");
const resultTable = document.getElementById("resultTable").querySelector("tbody");

const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");

const today = new Date();
const YYYYMMDD = today.toISOString().slice(0,10).replace(/-/g,"");
dateLabel.textContent = `${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}`;

// ===============================
// JSON取得
// ===============================
async function fetchJson(url) {
  try {
    const res = await fetch(url + "?t=" + Date.now());
    if (!res.ok) throw new Error("fetch error");
    return await res.json();
  } catch (e) {
    console.error("fetchJson:", e);
    return {};
  }
}

// ===============================
// 画面切替
// ===============================
function showScreen(target) {
  [screenVenues, screenRaces, screenDetail].forEach(sc => sc.classList.remove("active"));
  target.classList.add("active");
}

// ===============================
// 🎯 24場グリッド表示
// ===============================
async function renderVenues() {
  const data = await fetchJson(DATA_URL);
  const history = await fetchJson(HISTORY_URL);
  venuesGrid.innerHTML = "";

  const VENUES = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
    "蒲郡","津","三国","びわこ","住之江","鳴門",
    "丸亀","宮島","徳山","下関","若松","芦屋",
    "福岡","唐津","大村","尼崎","児島","常滑"
  ];

  VENUES.forEach(venue => {
    const vData = data[venue];
    const hData = history[venue];
    let status = "ー", clickable = false, rate = "-";

    if (vData && vData.date === YYYYMMDD) {
      const hasRaces = vData.races && Object.keys(vData.races).length > 0;
      status = hasRaces ? "開催中" : "ー";
      clickable = hasRaces;
    }

    if (hData && hData.hitRate !== undefined) rate = hData.hitRate + "%";

    const card = document.createElement("div");
    card.className = "venue-card";
    card.innerHTML = `
      <div class="v-name">${venue}</div>
      <div class="v-status">${status}</div>
      <div class="v-rate">AI的中率: ${rate}</div>
    `;

    if (clickable) {
      card.classList.add("clickable");
      card.addEventListener("click", () => openVenue(venue, vData));
      card.style.background = "linear-gradient(180deg,#e6f7ff,#ffffff)";
    } else {
      card.classList.add("disabled");
      card.style.background = "#f5f5f5";
      card.style.color = "#999";
    }

    venuesGrid.appendChild(card);
  });
}

// ===============================
// 🏁 各会場 → レース一覧（1〜12R）
// ===============================
function openVenue(venue, vData) {
  venueTitle.textContent = venue;
  racesGrid.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const raceBtn = document.createElement("div");
    raceBtn.className = "race-btn";
    raceBtn.textContent = `${i}R`;

    if (vData && vData.races && vData.races[i]) {
      raceBtn.classList.add("clickable");
      raceBtn.addEventListener("click", () => openRace(venue, i, vData.races[i]));
    } else {
      raceBtn.classList.add("disabled");
    }
    racesGrid.appendChild(raceBtn);
  }

  showScreen(screenRaces);
}

// ===============================
// 🚤 レース詳細（出走表 + AI予測）
// ===============================
function openRace(venue, raceNum, raceData) {
  raceTitle.textContent = `${venue} ${raceNum}R`;
  showScreen(screenDetail);

  // 出走表
  entryTable.innerHTML = "";
  if (raceData.entries) {
    raceData.entries.forEach((e, idx) => {
      const tr = document.createElement("tr");
      tr.className = `row-${idx+1}`;
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td class="entry-left">
          <div class="klass">${e.class || "-"}</div>
          <div class="name">${e.name || "-"}</div>
          <div class="st">ST:${e.st || "-"}</div>
        </td>
        <td>${e.f || "ー"}</td>
        <td>${e.national || "-"}</td>
        <td>${e.local || "-"}</td>
        <td>${e.motor || "-"}</td>
        <td>${e.course || "-"}</td>
        <td class="eval-mark">${e.eval || "-"}</td>
      `;
      entryTable.appendChild(tr);
    });
  }

  // 本命・穴
  const renderPred = (table, data) => {
    table.innerHTML = "";
    (data || []).forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${p.ticket}</td><td>${p.prob}%</td>`;
      table.appendChild(tr);
    });
  };
  renderPred(aiMainTable, raceData.ai_main);
  renderPred(aiSubTable, raceData.ai_sub);

  // コメント
  commentTable.innerHTML = "";
  if (raceData.comments) {
    Object.entries(raceData.comments).forEach(([lane, text]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${lane}</td><td>${text}</td>`;
      commentTable.appendChild(tr);
    });
  }

  // 順位予測
  rankingTable.innerHTML = "";
  if (raceData.ranking) {
    raceData.ranking.forEach((r, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i+1}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score}</td>`;
      rankingTable.appendChild(tr);
    });
  }

  // 結果（history）
  resultTable.innerHTML = "";
  if (raceData.result) {
    raceData.result.forEach((r, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i+1}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.st}</td>`;
      resultTable.appendChild(tr);
    });
  }
}

// ===============================
// 戻るボタン
// ===============================
backToVenues.addEventListener("click", () => showScreen(screenVenues));
backToRaces.addEventListener("click", () => showScreen(screenRaces));

// ===============================
// 更新ボタン
// ===============================
refreshBtn.addEventListener("click", () => {
  aiStatus.textContent = "🔄 データ更新中...";
  renderVenues().then(() => {
    aiStatus.textContent = "✅ 更新完了";
    setTimeout(() => (aiStatus.textContent = ""), 2000);
  });
});

// ===============================
// 初期表示
// ===============================
renderVenues();