// ================================
// app.js（完全統合版 2025/10/23）
// 出走表・結果・AI予測・ステータス連動
// ================================

// DOM取得
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

// 状態
let ALL_PROGRAMS = {};
let HISTORY = {};
let CURRENT_MODE = "today";

/* =====================
   時刻ユーティリティ
===================== */
function getJSTDate(offsetDays = 0) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utc + 9 * 60 * 60000 + offsetDays * 86400000);
  const yyyy = jst.getFullYear();
  const mm = String(jst.getMonth() + 1).padStart(2, "0");
  const dd = String(jst.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function safeNum(v) {
  if (v == null || v === "" || isNaN(Number(v))) return null;
  return Number(v);
}
function formatRate(v) {
  const n = safeNum(v);
  if (n == null) return "-";
  return Math.round(n * 10) + "%";
}
function formatF(v) {
  if (!v || v === "0" || v === "ー") return "ー";
  return v;
}
function mark(score) {
  const s = safeNum(score);
  if (s == null) return "✕";
  if (s >= 90) return "◎";
  if (s >= 80) return "○";
  if (s >= 70) return "▲";
  if (s >= 60) return "△";
  return "✕";
}

/* =====================
   データ取得
===================== */
async function loadData(force = false) {
  const cacheBust = force ? `?t=${Date.now()}` : "";
  try {
    const dataRes = await fetch(`data/data.json${cacheBust}`);
    ALL_PROGRAMS = await dataRes.json();

    const histRes = await fetch(`data/history.json${cacheBust}`);
    HISTORY = await histRes.json();

    aiStatus.textContent = "✅ 最新データ読込完了";
  } catch (e) {
    console.error(e);
    aiStatus.textContent = "❌ 読込エラー";
  }
}

/* =====================
   画面遷移
===================== */
function showScreen(name) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  else if (name === "races") SCREEN_RACES.classList.add("active");
  else if (name === "race") SCREEN_RACE.classList.add("active");
}

/* =====================
   会場一覧
===================== */
function renderVenues() {
  showScreen("venues");
  venuesGrid.innerHTML = "";

  const obj = ALL_PROGRAMS;
  if (!obj || Object.keys(obj).length === 0) {
    venuesGrid.innerHTML = `<div>データなし (${getJSTDate(0)})</div>`;
    return;
  }

  Object.entries(obj).forEach(([venue, info]) => {
    const status = info.status || "ー";
    const color =
      status === "開催中" ? "#00b894" :
      status === "終了" ? "#636e72" :
      "#b2bec3";

    const card = document.createElement("div");
    card.className = "venue-card";
    card.innerHTML = `
      <div class="v-name">${venue}</div>
      <div class="v-status" style="color:${color}">${status}</div>
    `;
    card.onclick = () => {
      if (status === "ー") return;
      renderRaces(venue);
      showScreen("races");
    };
    venuesGrid.appendChild(card);
  });
}

/* =====================
   レース一覧
===================== */
function renderRaces(venue) {
  showScreen("races");
  venueTitle.textContent = venue;
  racesGrid.innerHTML = "";

  const info = ALL_PROGRAMS[venue];
  if (!info || !info.races) {
    racesGrid.innerHTML = `<div>レースなし</div>`;
    return;
  }

  info.races.forEach((r, i) => {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i + 1}R`;
    btn.onclick = () => {
      renderRaceDetail(venue, i + 1);
      showScreen("race");
    };
    racesGrid.appendChild(btn);
  });
}

/* =====================
   出走表詳細
===================== */
async function renderRaceDetail(venue, raceNo) {
  entryTableBody.innerHTML = "";
  aiMainBody.innerHTML = "";
  aiSubBody.innerHTML = "";
  commentTableBody.innerHTML = "";
  rankingTableBody.innerHTML = "";
  resultTableBody.innerHTML = "";

  const info = ALL_PROGRAMS[venue];
  const race = info?.races?.find(r => r.no === raceNo);
  if (!race) {
    entryTableBody.innerHTML = `<tr><td colspan="8">出走データなし</td></tr>`;
    return;
  }

  const entries = race.entries || [];
  entries.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.waku}</td>
      <td>
        <div class="klass">${b.klass}</div>
        <div class="name">${b.name}</div>
        <div class="st">${b.st || "-"}</div>
      </td>
      <td>${formatF(b.f)}</td>
      <td>${formatRate(b.national)}</td>
      <td>${formatRate(b.local)}</td>
      <td>${formatRate(b.motor)}</td>
      <td>${formatRate(b.course)}</td>
      <td>${mark(b.rawScore)}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  const ai = await analyzeRace(entries);
  aiMainBody.innerHTML = ai.main.map(a => `<tr><td>${a.combo}</td><td>${a.prob}%</td></tr>`).join("");
  aiSubBody.innerHTML = ai.sub.map(a => `<tr><td>${a.combo}</td><td>${a.prob}%</td></tr>`).join("");
  commentTableBody.innerHTML = ai.comments.map(c => `<tr><td>${c.lane}</td><td>${c.comment}</td></tr>`).join("");
  rankingTableBody.innerHTML = ai.ranks.map(r => `<tr><td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score.toFixed(1)}</td></tr>`).join("");

  renderResult(venue, raceNo);
}

/* =====================
   結果反映
===================== */
function renderResult(venue, raceNo) {
  resultTableBody.innerHTML = "";

  const hist = HISTORY[venue];
  if (!hist || !hist[String(raceNo)]) {
    resultNote.textContent = "※ 結果未発表";
    resultTableBody.innerHTML = `<tr><td colspan="4">結果なし</td></tr>`;
    return;
  }

  const data = hist[String(raceNo)];
  const res = data.result || [];
  const style = data.style || "-";

  if (res.length === 0) {
    resultTableBody.innerHTML = `<tr><td colspan="4">結果未発表</td></tr>`;
  } else {
    res.forEach((pos, i) => {
      resultTableBody.innerHTML += `<tr><td>${i + 1}</td><td>${pos}</td><td>-</td><td>${style}</td></tr>`;
    });
  }
  resultNote.textContent = `※ ${venue} ${raceNo}R（${style}）`;
}

/* =====================
   AI予測ロジック
===================== */
async function analyzeRace(players) {
  if (!players || players.length === 0) return { main: [], sub: [], ranks: [], comments: [] };

  players.forEach(p => {
    const st = safeNum(p.st) || 2.0;
    const score =
      (100 - st * 30) +
      (safeNum(p.national) * 10) +
      (safeNum(p.motor) * 8) +
      (safeNum(p.local) * 6) +
      (safeNum(p.course) * 4);
    p.aiScore = score + Math.random() * 5;
  });

  const sorted = [...players].sort((a, b) => b.aiScore - a.aiScore);
  const main = sorted.slice(0, 3).map((p, i) => ({ combo: `${p.waku}号艇 ${p.name}`, prob: (95 - i * 10).toFixed(1) }));
  const sub = sorted.slice(3, 6).map((p, i) => ({ combo: `${p.waku}号艇 ${p.name}`, prob: (65 - i * 5).toFixed(1) }));
  const ranks = sorted.map((p, i) => ({ rank: i + 1, lane: p.waku, name: p.name, score: p.aiScore }));

  const comments = makeComments(sorted);
  return { main, sub, ranks, comments };
}

function makeComments(players) {
  const list = [
    "イン逃げ有力", "差し一撃注意", "展開向けば上位", "伸び足抜群",
    "安定したターン力", "波乱の立役者", "地元水面で奮闘",
    "出足強化で上昇ムード", "スタート切れ良し", "巧者の捌き注目"
  ];
  return players.map(p => ({
    lane: p.waku,
    comment: list[Math.floor(Math.random() * list.length)]
  }));
}

/* =====================
   イベント
===================== */
todayBtn.onclick = () => { CURRENT_MODE = "today"; dateLabel.textContent = getJSTDate(0); renderVenues(); };
yesterdayBtn.onclick = () => { CURRENT_MODE = "yesterday"; dateLabel.textContent = getJSTDate(-1); renderVenues(); };
refreshBtn.onclick = () => loadData(true);
document.getElementById("backToVenues").onclick = () => showScreen("venues");
document.getElementById("backToRaces").onclick = () => showScreen("races");

/* =====================
   初期化
===================== */
(async () => {
  dateLabel.textContent = getJSTDate(0);
  await loadData();
  renderVenues();
})();