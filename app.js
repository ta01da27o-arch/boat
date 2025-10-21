// ================================
// 完全統合版 app.js（修正版）
// 公式データ自動更新対応 + 24場グリッド + AI予測
// ================================

// ===== DOM 要素 =====
const dateLabel = document.getElementById("dateLabel");
const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const aiStatus = document.getElementById("aiStatus");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const entryTableBody = document.querySelector("#entryTable tbody");
const aiMainBody = document.querySelector("#aiMain tbody");
const aiSubBody = document.querySelector("#aiSub tbody");
const commentTableBody = document.querySelector("#commentTable tbody");
const rankingTableBody = document.querySelector("#rankingTable tbody");

const resultTableBody = document.querySelector("#resultTable tbody");
const resultNote = document.getElementById("resultNote");

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-detail");

// ===== 状態変数 =====
let TODAY_DATA = [];       // today.json (公式スクレイピング)
let HISTORY = {};          // history.json
let PREDICTIONS = [];      // predictions.csv（任意）
let CURRENT_MODE = "today"; // today / yesterday

// ===== ユーティリティ =====
function safeNum(v) {
  if (v == null || v === "" || isNaN(Number(v))) return null;
  return Number(v);
}

function formatRateDisplay(v) {
  const n = safeNum(v);
  if (n == null) return "-";
  return Math.round(n * 10) + "%";
}

function formatF(count) {
  const c = safeNum(count);
  if (c == null || c === 0) return "ー";
  return `F${c}`;
}

function scoreToMark(score) {
  const s = safeNum(score);
  if (s == null) return "✕";
  if (s >= 90) return "◎";
  if (s >= 80) return "○";
  if (s >= 70) return "▲";
  if (s >= 60) return "△";
  return "✕";
}

function getDateKey(offsetDays = 0) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jstTime = new Date(utc + 9 * 60 * 60000 + offsetDays * 24 * 60 * 60 * 1000);
  const yyyy = jstTime.getFullYear();
  const mm = String(jstTime.getMonth() + 1).padStart(2, "0");
  const dd = String(jstTime.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function getCurrentDateKey() {
  return CURRENT_MODE === "today" ? getDateKey(0) : getDateKey(-1);
}

function showScreen(name) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  else if (name === "races") SCREEN_RACES.classList.add("active");
  else if (name === "race") SCREEN_RACE.classList.add("active");
}

// ===== データ読み込み =====
async function loadData(force = false) {
  const q = force ? `?t=${Date.now()}` : "";
  try {
    // today.json（公式スクレイピング）
    const resToday = await fetch(`https://raw.githubusercontent.com/ta01da27o-arch/boat/main/data/today.json${q}`);
    TODAY_DATA = await resToday.json();

    // history.json
    const resHist = await fetch(`https://raw.githubusercontent.com/ta01da27o-arch/boat/main/data/history.json${q}`);
    HISTORY = await resHist.json();

    // predictions.csv（任意）
    try {
      const resCsv = await fetch(`predictions.csv${q}`);
      const text = await resCsv.text();
      PREDICTIONS = parseCSV(text);
    } catch (e) {
      PREDICTIONS = [];
    }

    aiStatus.textContent = "データ取得完了";
  } catch (e) {
    console.error("データ読み込み失敗:", e);
    aiStatus.textContent = "データ読み込み失敗";
  }
}

// ===== CSV 解析 =====
function parseCSV(text) {
  if (!text || !text.trim()) return [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map(line => {
    const cols = line.split(",");
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] || "");
    return obj;
  });
}

// ===== 会場一覧（24場）表示 =====
function renderVenues() {
  showScreen("venues");
  venuesGrid.innerHTML = "";

  if (!TODAY_DATA || TODAY_DATA.length === 0) {
    venuesGrid.innerHTML = `<div>本日のレースデータがありません</div>`;
    return;
  }

  TODAY_DATA.forEach((v, idx) => {
    const card = document.createElement("div");
    card.className = "venue-card";
    card.innerHTML = `
      <div class="v-name">${v.venue}</div>
      <div class="v-info">
        <span>風 ${v.wind || "-"}m</span> /
        <span>波 ${v.wave || "-"}m</span>
      </div>
    `;
    card.addEventListener("click", () => {
      renderRaces(v.venue);
      showScreen("races");
    });
    venuesGrid.appendChild(card);
  });
}

// ===== 各会場のレース番号表示 =====
function renderRaces(venue) {
  showScreen("races");
  venueTitle.textContent = `${venue}`;
  racesGrid.innerHTML = "";

  const venueData = TODAY_DATA.find(v => v.venue === venue);
  if (!venueData) {
    racesGrid.innerHTML = `<div>レースデータなし</div>`;
    return;
  }

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => {
      renderRaceDetail(venue, i);
      showScreen("race");
    });
    racesGrid.appendChild(btn);
  }
}

// ===== 出走表 + AI 予測表示 =====
async function renderRaceDetail(venue, raceNo) {
  entryTableBody.innerHTML = `<tr><td colspan="8">出走データを読み込み中...</td></tr>`;

  // ここでは仮データ対応（将来はJSON内の詳細レースデータを取得）
  const players = Array.from({ length: 6 }).map((_, i) => ({
    lane: i + 1,
    klass: "A1",
    name: `${venue}選手${i + 1}`,
    st: 0.15 + i * 0.02,
    f: 0,
    national: 7.2 - i * 0.4,
    local: 6.8 - i * 0.3,
    motor: 6.5 - i * 0.2,
    course: 5.9 - i * 0.1,
    rawScore: 60 + Math.random() * 30
  }));

  const ai = await analyzeRace(players);

  entryTableBody.innerHTML = "";
  players.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.lane}</td>
      <td>${p.name}</td>
      <td>${formatF(p.f)}</td>
      <td>${formatRateDisplay(p.national)}</td>
      <td>${formatRateDisplay(p.local)}</td>
      <td>${formatRateDisplay(p.motor)}</td>
      <td>${formatRateDisplay(p.course)}</td>
      <td>${scoreToMark(p.rawScore)}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  aiMainBody.innerHTML = ai.main.map(a => `<tr><td>${a.combo}</td><td>${a.prob}%</td></tr>`).join("");
  aiSubBody.innerHTML = ai.sub.map(a => `<tr><td>${a.combo}</td><td>${a.prob}%</td></tr>`).join("");
  commentTableBody.innerHTML = ai.comments.map(c => `<tr><td>${c.lane}</td><td>${c.comment}</td></tr>`).join("");
  rankingTableBody.innerHTML = ai.ranks.map(r => `<tr><td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score.toFixed(2)}</td></tr>`).join("");

  raceTitle.textContent = `${venue} ${raceNo}R`;
  renderResult(venue, raceNo);
}

// ===== 結果表示 =====
function renderResult(venue, raceNo) {
  const key = getCurrentDateKey();
  resultTableBody.innerHTML = "";

  const day = HISTORY[key];
  if (!day || !day.results) {
    resultTableBody.innerHTML = `<tr><td colspan="4">結果データなし</td></tr>`;
    resultNote.textContent = "※ 結果はまだありません";
    return;
  }

  const found = day.results.find(r =>
    r.race_stadium_number === venue && r.race_number === Number(raceNo)
  );

  if (!found || !found.boats) {
    resultTableBody.innerHTML = `<tr><td colspan="4">このレースの結果なし</td></tr>`;
    resultNote.textContent = "※ 結果なし";
    return;
  }

  const sorted = found.boats.slice().sort((a,b) => a.racer_place_number - b.racer_place_number);
  sorted.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.racer_place_number}</td>
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_name}</td>
      <td>${b.racer_start_timing != null ? b.racer_start_timing.toFixed(2) : "-"}</td>
    `;
    resultTableBody.appendChild(tr);
  });
  resultNote.textContent = `※ ${venue} ${raceNo}R の結果 (${key})`;
}

// ===== AI 展開予想 =====
async function analyzeRace(players) {
  if (!players || players.length === 0) return { main: [], sub: [], ranks: [], comments: [] };

  const seed = Date.now();
  players.forEach(p => {
    const base = (100 - (p.st || 2) * 30) + (p.national * 10) + (p.motor * 8) + (p.local * 6) + (p.course * 4);
    const rand = Math.sin(seed + p.lane * 7.1) * 5;
    p.aiScore = base + rand;
  });

  const sorted = [...players].sort((a, b) => b.aiScore - a.aiScore);
  const main = sorted.slice(0, 3).map(p => ({ combo: `${p.lane}号艇 ${p.name}`, prob: (95 - (sorted.indexOf(p) * 10)).toFixed(1) }));
  const sub = sorted.slice(3, 6).map(p => ({ combo: `${p.lane}号艇 ${p.name}`, prob: (60 - (sorted.indexOf(p) * 5)).toFixed(1) }));
  const ranks = sorted.map((p, i) => ({ rank: i + 1, lane: p.lane, name: p.name, score: p.aiScore }));
  const comments = makeComments(sorted);
  return { main, sub, ranks, comments };
}

// ===== コメント生成 =====
function makeComments(sortedPlayers) {
  const patterns = [
    "スタート抜群で展開優位", "差し鋭く要注意", "伸び足強烈で一発期待", "モーター気配上昇中",
    "当地相性良く信頼厚い", "調整成功で連勝狙う", "展開次第で上位食い込み", "波乱演出も十分あり",
    "安定感抜群の走り", "前走内容良化、要マーク", "イン逃げ有力", "差し狙い慎重なスタート",
    "スタート集中、前付け警戒", "全速攻めで勝負気配", "出足・伸びともに上位級", "地元水面で奮起",
    "展示タイム良好、侮れない", "展開突けば一発あり", "勝負駆けで気合十分", "調整に手応え、上積み期待"
  ];

  return sortedPlayers.map(p => ({
    lane: p.lane,
    comment: patterns[Math.floor(Math.random() * patterns.length)]
  }));
}

// ===== ボタン操作 =====
todayBtn.onclick = () => {
  CURRENT_MODE = "today";
  dateLabel.textContent = getDateKey(0);
  renderVenues();
};
yesterdayBtn.onclick = () => {
  CURRENT_MODE = "yesterday";
  dateLabel.textContent = getDateKey(-1);
  renderVenues();
};
refreshBtn.onclick = () => loadData(true);

document.getElementById("backToVenues").onclick = () => showScreen("venues");
document.getElementById("backToRaces").onclick = () => showScreen("races");

// ===== 初期処理 =====
(async () => {
  dateLabel.textContent = getDateKey(0);
  await loadData();
  renderVenues();
})();