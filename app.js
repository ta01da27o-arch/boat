// app.js 改良版（完全版データ保持対応）

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-race");

const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");

let allData = [];
let currentVenue = null;
let currentRace = null;

// ====== データ取得 ======
async function loadData(day = "today") {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    const json = await res.json();

    // データ形式を保持（programs配下 or 直配列）
    if (Array.isArray(json)) {
      allData = json;
    } else if (json.programs) {
      allData = json.programs;
    } else {
      allData = [];
    }

    renderVenues();
  } catch (e) {
    console.error("データ取得失敗:", e);
    alert("データ取得に失敗しました");
  }
}

// ====== 画面切替 ======
function showScreen(screen) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => (s.style.display = "none"));
  screen.style.display = "block";
}

// ====== 会場一覧 ======
function renderVenues() {
  const venues = {};
  allData.forEach(r => {
    if (!venues[r.jcd]) {
      venues[r.jcd] = r.jyo_name;
    }
  });

  SCREEN_VENUES.innerHTML = `<h2>開催場一覧</h2>`;
  Object.entries(venues).forEach(([jcd, name]) => {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.onclick = () => showRaces(jcd, name);
    SCREEN_VENUES.appendChild(btn);
  });

  showScreen(SCREEN_VENUES);
}

// ====== レース一覧 ======
function showRaces(jcd, name) {
  currentVenue = jcd;
  const races = allData.filter(r => r.jcd === jcd);

  SCREEN_RACES.innerHTML = `<h2>${name} のレース一覧</h2>`;
  races.forEach(r => {
    const btn = document.createElement("button");
    btn.textContent = `${r.race_no}R`;
    btn.onclick = () => showRace(r);
    SCREEN_RACES.appendChild(btn);
  });

  const backBtn = document.createElement("button");
  backBtn.textContent = "← 戻る";
  backBtn.onclick = () => renderVenues();
  SCREEN_RACES.appendChild(backBtn);

  showScreen(SCREEN_RACES);
}

// ====== 出走表 ======
function showRace(race) {
  currentRace = race;

  let html = `<h2>${race.jyo_name} ${race.race_no}R 出走表</h2>`;

  // header情報（保持している場合）
  if (race.header) {
    html += `<div class="race-header">
               <p>日付: ${race.header.date || "-"}</p>
               <p>${race.header.title || ""}</p>
             </div>`;
  }

  // weather情報（保持している場合）
  if (race.weather) {
    html += `<div class="race-weather">
               天候: ${race.weather.condition || "-"}　
               風速: ${race.weather.wind_speed || "-"}m　
               波高: ${race.weather.wave || "-"}cm
             </div>`;
  }

  // 出走表
  html += `<table class="race-table">
            <tr>
              <th>枠</th><th>選手名</th><th>級</th><th>ST</th><th>F</th>
              <th>モーター</th><th>ボート</th><th>コメント</th>
            </tr>`;

  race.racers.forEach(r => {
    const comment = generateComment(r);
    html += `<tr>
              <td>${r.racer_boat_number}</td>
              <td>${r.racer_name}</td>
              <td>${className(r.racer_class_number)}</td>
              <td>${r.racer_average_start_timing ?? "-"}</td>
              <td>${r.racer_flying_count}</td>
              <td>${r.racer_assigned_motor_top_2_percent ?? "-"}</td>
              <td>${r.racer_assigned_boat_top_2_percent ?? "-"}</td>
              <td>${comment}</td>
            </tr>`;
  });

  html += `</table>`;

  // AI予想
  const predictions = generatePredictions(race.racers);
  html += `<div class="prediction">
            <h3>AI予想</h3>
            <p>本命: ${predictions.main}</p>
            <p>抑え: ${predictions.sub}</p>
          </div>`;

  // 結果（保持している場合）
  if (race.result) {
    html += `<div class="race-result">
               <h3>結果</h3>
               <p>${race.result.text || JSON.stringify(race.result)}</p>
             </div>`;
  }

  html += `<button onclick="showRaces('${race.jcd}','${race.jyo_name}')">← 戻る</button>`;

  SCREEN_RACE.innerHTML = html;
  showScreen(SCREEN_RACE);
}

// ====== コメント生成 ======
function generateComment(r) {
  const comments = [];
  if (r.racer_class_number === 1) comments.push("実力上位");
  if (r.racer_average_start_timing && r.racer_average_start_timing < 0.15) comments.push("スタート鋭い");
  if (r.racer_flying_count > 0) comments.push("F持ち注意");
  if (r.racer_assigned_motor_top_2_percent >= 35) comments.push("モーター◎");
  if (r.racer_assigned_boat_top_2_percent >= 35) comments.push("ボート良");
  return comments.join("・") || "平凡";
}

// ====== AI予想 ======
function generatePredictions(racers) {
  const scores = racers.map(r => {
    let score = 0;
    if (r.racer_class_number === 1) score += 20;
    if (r.racer_class_number === 2) score += 10;
    if (r.racer_average_start_timing) score += (0.25 - r.racer_average_start_timing) * 100;
    score -= r.racer_flying_count * 5;
    score += r.racer_assigned_motor_top_2_percent || 0;
    score += r.racer_assigned_boat_top_2_percent || 0;
    return { boat: r.racer_boat_number, name: r.racer_name, score: score.toFixed(1) };
  });

  scores.sort((a, b) => b.score - a.score);

  const main = `${scores[0].boat}号艇 ${scores[0].name}`;
  const sub = `${scores[1].boat}号艇 ${scores[1].name}, ${scores[2].boat}号艇 ${scores[2].name}`;

  return { main, sub };
}

// ====== 級別変換 ======
function className(num) {
  switch (num) {
    case 1: return "A1";
    case 2: return "A2";
    case 3: return "B1";
    case 4: return "B2";
    default: return "-";
  }
}

// ====== イベント ======
todayBtn.onclick = () => loadData("today");
yesterdayBtn.onclick = () => loadData("yesterday");
refreshBtn.onclick = () => loadData();

// 初期ロード
loadData();