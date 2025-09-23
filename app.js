// app.js 完全版

const VIEW = document.querySelector(".view");
const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_DETAIL = document.getElementById("screen-detail");

const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const refreshBtn = document.getElementById("refreshBtn");
const dateLabel = document.getElementById("dateLabel");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const aiMain = document.getElementById("aiMain").querySelector("tbody");
const aiSub = document.getElementById("aiSub").querySelector("tbody");
const commentTable = document.getElementById("commentTable").querySelector("tbody");

let appData = null;
let currentVenue = null;
let currentRace = null;

// ==== データ取得 ==== //
async function fetchData() {
  try {
    const res = await fetch("https://ta01da27o-arch.github.io/boat/data.json", {cache:"no-store"});
    if (!res.ok) throw new Error("データ取得失敗");
    const data = await res.json();
    appData = data;
    renderVenues();
    const today = new Date();
    dateLabel.textContent = `${today.getMonth()+1}/${today.getDate()}/${today.getFullYear()}`;
  } catch (e) {
    console.error(e);
    venuesGrid.innerHTML = `<div style="padding:12px;color:red;">データ取得失敗</div>`;
  }
}

// ==== 出走表評価計算 ==== //
function calculateEvaluation(racer) {
  const local = racer.racer_local_top_1_percent || 0;
  const motor = racer.racer_assigned_motor_top_2_percent || 0;
  const course = racer.racer_course_win_rate || 0;
  return local * motor * course;
}

function assignMarks(racers) {
  racers.forEach(r => r.evaluation = calculateEvaluation(r));
  const sorted = [...racers].sort((a,b) => b.evaluation - a.evaluation);
  const marks = ["◎","○","△","✕","✕","✕"];
  sorted.forEach((r,i)=> r.mark = marks[i] || "✕");
}

// ==== コメント生成 ==== //
function makeRacerComment(r) {
  const mark = r.mark;
  const templates = {
    "◎": [
      "イン有利の展開が見込める。機力も上位で信頼度高い一戦。",
      "地元実績が光り、好モーターも後押し。主役の座は揺るがない。",
      "機力・展開ともに恵まれそう。軸として期待大。",
      "持ち味のスタート力を生かし、押し切り濃厚の構図。"
    ],
    "○": [
      "展開を突ける脚あり。主役を脅かす存在となりそうだ。",
      "機力上々で逆転可能性も十分。侮れない。",
      "安定感あり。流れを掴めば一気に浮上も狙える。",
      "自在戦で食い下がるか。二番手評価にふさわしい。"
    ],
    "△": [
      "展開ひとつで浮上の可能性。連下候補に一考。",
      "機力は中堅級も侮れない存在。穴で一撃狙う。",
      "際立つ材料は少ないが流れ次第で台頭も。",
      "展開に恵まれれば舟券絡みも十分ある。"
    ],
    "✕": [
      "機力は見劣る印象。展開待ちで抑え評価まで。",
      "近況の動き平凡。連下でも手広く押さえたい程度。",
      "勝負気配薄く厳しい戦いか。穴党向けの一考材料。",
      "展開頼みの感は否めず、舟券妙味は薄い。"
    ]
  };
  const arr = templates[mark] || ["データ不足で評価困難。"];
  return arr[Math.floor(Math.random()*arr.length)];
}

// ==== 買い目生成 ==== //
function generateBets(racers){
  const top = racers.filter(r => r.mark === "◎" || r.mark === "○");
  if(top.length < 2) return {main:[], sub:[]};
  let main = [], sub = [];
  for(let i=3;i<=7;i++){
    if(main.length < 5) main.push(`${top[0].racer_boat_number}-${top[1].racer_boat_number}-${i}`);
    if(sub.length < 5) sub.push(`${top[1].racer_boat_number}-${top[0].racer_boat_number}-${i}`);
  }
  return {main, sub};
}

// ==== 画面描画 ==== //
function renderVenues() {
  if(!appData?.venues){ return; }
  venuesGrid.innerHTML = "";
  appData.venues.forEach(venue => {
    const div = document.createElement("div");
    div.className = "venue-card clickable";
    div.innerHTML = `
      <div class="v-name">${venue.venue_name}</div>
      <div class="v-status">${venue.races.length}R</div>
      <div class="v-rate">--</div>
    `;
    div.addEventListener("click", ()=> {
      currentVenue = venue;
      renderRaces(venue);
      showScreen(SCREEN_RACES);
    });
    venuesGrid.appendChild(div);
  });
}

function renderRaces(venue) {
  racesGrid.innerHTML = "";
  venue.races.forEach(race=>{
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${race.race_number}R`;
    btn.addEventListener("click", ()=>{
      currentRace = race;
      renderRaceDetail(race);
      showScreen(SCREEN_DETAIL);
    });
    racesGrid.appendChild(btn);
  });
}

function renderRaceDetail(race){
  const racers = race.racers;
  assignMarks(racers);
  entryTable.innerHTML = "";
  racers.forEach(r=>{
    const tr = document.createElement("tr");
    tr.className = `row-${r.racer_boat_number}`;
    tr.innerHTML = `
      <td>${r.racer_boat_number}</td>
      <td class="entry-left">
        <span class="klass">級:${r.racer_class_number}</span>
        <span class="name">${r.racer_name}</span>
        <span class="st">ST:${r.racer_average_start_timing}</span>
      </td>
      <td>${r.racer_flying_count}</td>
      <td>${r.racer_local_top_1_percent}</td>
      <td>${r.racer_assigned_motor_top_2_percent}</td>
      <td>${r.racer_course_win_rate}</td>
      <td class="eval-mark ${r.mark==="◎"?"metric-symbol top":"metric-symbol"}">${r.mark}</td>
    `;
    entryTable.appendChild(tr);
  });

  // 買い目
  const bets = generateBets(racers);
  aiMain.innerHTML = "";
  bets.main.forEach(b=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${b}</td><td>--%</td>`;
    aiMain.appendChild(tr);
  });
  aiSub.innerHTML = "";
  bets.sub.forEach(b=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${b}</td><td>--%</td>`;
    aiSub.appendChild(tr);
  });

  // コメント
  commentTable.innerHTML = "";
  racers.forEach(r=>{
    const tr = document.createElement("tr");
    const tdCourse = document.createElement("td");
    tdCourse.textContent = `${r.racer_boat_number}号艇`;
    const tdComment = document.createElement("td");
    tdComment.textContent = makeRacerComment(r);
    tr.appendChild(tdCourse);
    tr.appendChild(tdComment);
    commentTable.appendChild(tr);
  });
}

function showScreen(screen){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_DETAIL].forEach(s=>s.classList.remove("active"));
  screen.classList.add("active");
}

// ==== イベント ==== //
todayBtn.addEventListener("click", ()=>{
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  fetchData();
});
yesterdayBtn.addEventListener("click", ()=>{
  // 前日は未実装
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  venuesGrid.innerHTML = `<div style="padding:12px;">前日データは未対応です</div>`;
});
refreshBtn.addEventListener("click", ()=>{
  fetchData();
});

// ==== 起動 ==== //
fetchData();