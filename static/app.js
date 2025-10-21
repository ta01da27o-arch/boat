// ================================
// 完全統合版 app.js — Part1/2
// すべてのデータ項目を表示（階級、ST、F回数、勝率、AI予測 etc）
// ================================

// DOM 要素取得
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

// 状態変数
let ALL_PROGRAMS = {};    // data.json のオブジェクト
let HISTORY = {};         // history.json のオブジェクト
let PREDICTIONS = [];     // predictions.csv の配列
let CURRENT_MODE = "today";  // “today” or “yesterday”

/* ユーティリティ関数 */
function safeNum(v) {
  if (v == null || v === "" || isNaN(Number(v))) return null;
  return Number(v);
}

// 勝率を％形式に変換
function formatRateDisplay(v) {
  const n = safeNum(v);
  if (n == null) return "-";
  // 例：7.5 → 75%
  return Math.round(n * 10) + "%";
}

// F 表示
function formatF(count) {
  const c = safeNum(count);
  if (c == null || c === 0) return "ー";
  return `F${c}`;
}

// AI 評価記号変換（スコア → ◎ ○ ▲ △ ✕）
function scoreToMark(score) {
  const s = safeNum(score);
  if (s == null) return "✕";
  if (s >= 90) return "◎";
  if (s >= 80) return "○";
  if (s >= 70) return "▲";
  if (s >= 60) return "△";
  return "✕";
}

// 日本時間 (JST) の日付キー取得
function getDateKey(offsetDays = 0) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jstTime = new Date(utc + 9 * 60 * 60000 + offsetDays * 24 * 60 * 60 * 1000);
  const yyyy = jstTime.getFullYear();
  const mm = String(jstTime.getMonth() + 1).padStart(2, "0");
  const dd = String(jstTime.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// 現在表示モードの日付キー取得
function getCurrentDateKey() {
  return CURRENT_MODE === "today" ? getDateKey(0) : getDateKey(-1);
}

// 表示切り替え
function showScreen(name) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if (name === "venues") SCREEN_VENUES.classList.add("active");
  else if (name === "races") SCREEN_RACES.classList.add("active");
  else if (name === "race") SCREEN_RACE.classList.add("active");
}

// データ読み込み
async function loadData(force = false) {
  const q = force ? `?t=${Date.now()}` : "";
  try {
    // fetch data.json
    const resP = await fetch(`data.json${q}`);
    const pjson = await resP.json();
    ALL_PROGRAMS = pjson;

    // fetch history.json
    const resH = await fetch(`history.json${q}`);
    const hjson = await resH.json();
    HISTORY = hjson;

    // predictions.csv 読み込み（任意）
    try {
      const resCsv = await fetch(`predictions.csv${q}`);
      const text = await resCsv.text();
      PREDICTIONS = parseCSV(text);
    } catch (e) {
      PREDICTIONS = [];
    }

    aiStatus.textContent = "データ取得完了";
  } catch (e) {
    console.error("データ読み込みに失敗:", e);
    aiStatus.textContent = "データ読み込み失敗";
    ALL_PROGRAMS = {};
    HISTORY = {};
    PREDICTIONS = [];
  }
}

// CSV → オブジェクト配列
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

// venue（会場）一覧表示
function renderVenues() {
  showScreen("venues");
  venuesGrid.innerHTML = "";

  const key = getCurrentDateKey();
  const obj = ALL_PROGRAMS[key];
  if (!obj) {
    venuesGrid.innerHTML = `<div>データがありません (${key})</div>`;
    return;
  }

  // obj は { jcd: { race data } , ... } または配列形式 どちらも対応
  const venueKeys = Object.keys(obj);
  venueKeys.forEach(v => {
    const card = document.createElement("div");
    card.className = "venue-card";
    card.innerHTML = `<div class="v-name">${v}</div>`;
    card.addEventListener("click", () => {
      renderRaces(v);
      showScreen("races");
    });
    venuesGrid.appendChild(card);
  });
}

// レース番号表示
function renderRaces(venue) {
  showScreen("races");
  venueTitle.textContent = `第${venue}場`;
  racesGrid.innerHTML = "";

  const key = getCurrentDateKey();
  const obj = ALL_PROGRAMS[key]?.[venue];
  if (!obj || !obj.races) {
    racesGrid.innerHTML = `<div>レースデータなし</div>`;
    return;
  }

  obj.races.forEach((race, i) => {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${i + 1}R`;
    btn.addEventListener("click", () => {
      renderRaceDetail(venue, i + 1);
      showScreen("race");
    });
    racesGrid.appendChild(btn);
  });
}

// 出走表 + AI予測 + コメント + 順位予測 描画
async function renderRaceDetail(venue, raceNo) {
  const key = getCurrentDateKey();
  const race = ALL_PROGRAMS[key]?.[venue]?.races?.[raceNo - 1];
  if (!race) {
    entryTableBody.innerHTML = `<tr><td colspan="8">出走データがありません</td></tr>`;
  } else {
    entryTableBody.innerHTML = "";
    const boats = race.boats || race.entries || [];
    const players = boats.map(b => {
      const national = safeNum(b.racer_national_win_rate || b.national_top_1_percent || b.national);
      const local = safeNum(b.racer_local_win_rate || b.local_top_1_percent || b.local);
      const motor = safeNum(b.racer_motor_win_rate || b.motor_top_2_percent || b.motor);
      const course = safeNum(b.racer_course_win_rate || b.course_top_2_percent || b.course);

      return {
        lane: b.racer_boat_number,
        klass: b.racer_class || b.class || "-",
        name: b.racer_name,
        st: safeNum(b.racer_start_timing),
        f: b.racer_flying_count || b.f || b.F || 0,
        national: national,
        local: local,
        motor: motor,
        course: course,
        rawScore: safeNum(b.rawScore) || 0
      };
    }).sort((a, b) => a.lane - b.lane);

    // AI 予測呼び出し
    let ai = null;
    try {
      ai = await analyzeRace(players);
    } catch (e) {
      console.error("AI 予測エラー:", e);
      ai = { main: [], sub: [], ranks: [], comments: [] };
    }

    // 表示描画
    players.forEach(p => {
      const tr = document.createElement("tr");
      tr.classList.add(`row-${p.lane}`);
      tr.innerHTML = `
        <td>${p.lane}</td>
        <td><div class="entry-left">
              <div class="klass">${p.klass}</div>
              <div class="name">${p.name}</div>
              <div class="st">${p.st != null ? p.st.toFixed(2) : "-"}</div>
            </div></td>
        <td>${formatF(p.f)}</td>
        <td>${formatRateDisplay(p.national)}</td>
        <td>${formatRateDisplay(p.local)}</td>
        <td>${formatRateDisplay(p.motor)}</td>
        <td>${formatRateDisplay(p.course)}</td>
        <td class="eval-mark">${scoreToMark(p.rawScore)}</td>
      `;
      entryTableBody.appendChild(tr);
    });

    // AI 本命・穴
    aiMainBody.innerHTML = "";
    aiSubBody.innerHTML = "";
    (ai.main || []).slice(0,5).forEach(r => {
      aiMainBody.innerHTML += `<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`;
    });
    (ai.sub || []).slice(0,5).forEach(r => {
      aiSubBody.innerHTML += `<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`;
    });

    // コメント
    commentTableBody.innerHTML = "";
    (ai.comments || []).forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${c.lane}</td><td>${c.comment}</td>`;
      commentTableBody.appendChild(tr);
    });

    // 順位予測
    rankingTableBody.innerHTML = "";
    (ai.ranks || []).forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${(Number(r.score)||0).toFixed(2)}</td>`;
      rankingTableBody.appendChild(tr);
    });
  }

  raceTitle.textContent = `${venue} ${raceNo}R`;
  renderResult(venue, raceNo);
}

// 結果表示
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
    r.race_stadium_number === Number(venue) &&
    r.race_number === Number(raceNo)
  );
  if (!found || !found.boats) {
    resultTableBody.innerHTML = `<tr><td colspan="4">このレースの結果なし</td></tr>`;
    resultNote.textContent = "※ レース結果なし";
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

/* タブ切替 */
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

/* 更新 */
refreshBtn.onclick = () => loadData(true);

/* 初期処理 */
(async () => {
  dateLabel.textContent = getDateKey(0);
  await loadData();
  renderVenues();
})();
// ================================
// 完全統合版 app.js — Part2/2
// AI 展開予想ロジック・コメント生成・データ反映部
// ================================

// 簡易 AI 展開予想（本命・穴・順位）
async function analyzeRace(players) {
  if (!players || players.length === 0) return { main: [], sub: [], ranks: [], comments: [] };

  // ランダムシード的な値で再現性を保つ
  const now = new Date();
  const seed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  // 仮スコア：STが速く、勝率が高いほど上位
  players.forEach(p => {
    const base = (100 - (p.st || 2) * 30) + (p.national * 10) + (p.motor * 8) + (p.local * 6) + (p.course * 4);
    const rand = Math.sin(seed + p.lane * 7.1) * 5;
    p.aiScore = base + rand;
  });

  const sorted = [...players].sort((a, b) => b.aiScore - a.aiScore);

  // 上位3艇を本命候補、次点3艇を穴候補に
  const main = sorted.slice(0, 3).map(p => ({
    combo: `${p.lane}号艇 ${p.name}`,
    prob: (95 - (sorted.indexOf(p) * 10)).toFixed(1)
  }));
  const sub = sorted.slice(3, 6).map(p => ({
    combo: `${p.lane}号艇 ${p.name}`,
    prob: (60 - (sorted.indexOf(p) * 5)).toFixed(1)
  }));

  // 順位予測
  const ranks = sorted.map((p, i) => ({
    rank: i + 1,
    lane: p.lane,
    name: p.name,
    score: p.aiScore
  }));

  // コメント生成
  const comments = makeComments(sorted);

  return { main, sub, ranks, comments };
}

// コメントパターン生成
function makeComments(sortedPlayers) {
  if (!sortedPlayers || sortedPlayers.length === 0) return [];

  const patterns = [
    "スタート抜群で展開優位",
    "差し鋭く要注意",
    "伸び足強烈で一発期待",
    "モーター気配上昇中",
    "当地相性良く信頼厚い",
    "調整成功で連勝狙う",
    "展開次第で上位食い込み",
    "波乱演出も十分あり",
    "安定感抜群の走り",
    "前走内容良化、要マーク",
    "イン逃げ有力",
    "差し狙い慎重なスタート",
    "スタート集中、前付け警戒",
    "全速攻めで勝負気配",
    "出足・伸びともに上位級",
    "地元水面で奮起",
    "展示タイム良好、侮れない",
    "展開突けば一発あり",
    "勝負駆けで気合十分",
    "調整に手応え、上積み期待"
  ];

  const result = [];
  sortedPlayers.forEach((p, i) => {
    const idx = Math.floor(Math.random() * patterns.length);
    result.push({
      lane: p.lane,
      comment: patterns[idx]
    });
  });
  return result;
}

/* ================================
   表示制御や戻る操作
================================ */
document.getElementById("backToVenues").onclick = () => showScreen("venues");
document.getElementById("backToRaces").onclick = () => showScreen("races");

// ================================
// ここまでで完全版 app.js 終了
// ================================