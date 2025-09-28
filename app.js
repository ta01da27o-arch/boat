// app.js（24場＋評価欄修正＋背景色＋階級＋赤◎）

// --- グローバル変数 ---
let ALL_PROGRAMS = [];
let ALL_RESULTS = [];
let CURRENT_MODE = "today";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

// --- DOM取得 ---
const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES  = document.getElementById("screen-races");
const SCREEN_RACE   = document.getElementById("screen-race");

const venuesGrid     = document.getElementById("venuesGrid");
const racesGrid      = document.getElementById("racesGrid");
const raceTitle      = document.getElementById("raceTitle");
const entryTableBody = document.getElementById("entryTableBody");

const aiMainBody     = document.getElementById("aiMainBody");
const aiSubBody      = document.getElementById("aiSubBody");
const commentTableBody = document.getElementById("commentTableBody");

const todayTab    = document.getElementById("todayTab");
const yesterdayTab= document.getElementById("yesterdayTab");
const todayLabel  = document.getElementById("todayLabel");

const backBtn     = document.getElementById("backBtn");
const refreshBtn  = document.getElementById("refreshBtn");

// --- ユーティリティ ---
function getIsoDate(date){ return date.toISOString().slice(0,10); }
function showScreen(name){
  [SCREEN_VENUES,SCREEN_RACES,SCREEN_RACE].forEach(s=>s.classList.remove("active"));
  if(name==="venues") SCREEN_VENUES.classList.add("active");
  if(name==="races")  SCREEN_RACES.classList.add("active");
  if(name==="race")   SCREEN_RACE.classList.add("active");
}

// --- データロード ---
async function loadData(){
  try{
    const [progRes, resultRes] = await Promise.all([
      fetch("data/programs.json"),
      fetch("data/results.json")
    ]);
    ALL_PROGRAMS = await progRes.json();
    ALL_RESULTS  = await resultRes.json();
    renderVenues();
  }catch(e){ console.error("データ取得失敗",e); }
}

// --- 24場描画 ---
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML="";

  const targetDate = (CURRENT_MODE==="today")
    ? getIsoDate(new Date())
    : (function(){ const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d); })();

  VENUE_NAMES.forEach((name,idx)=>{
    const vid = idx+1;
    const prog = ALL_PROGRAMS.find(p => p.race_date===targetDate && Number(p.race_stadium_number)===vid);
    const results = ALL_RESULTS.filter(r => r.race_date===targetDate && Number(r.race_stadium_number)===vid);
    let hitRateText = "的中率=0%";

    if(results.length>0){
      const hitCount = results.filter(r => r.is_hit).length;
      const rate = Math.round((hitCount/results.length)*100);
      hitRateText = `的中率=${rate}%`;
    }

    const div=document.createElement("div");
    div.className="venue-card " + (prog?"clickable":"disabled");
    div.innerHTML=`
      <div class="v-name">${name}</div>
      <div class="v-status">${prog? "出走表あり":"開催なし"}</div>
      <div class="v-rate">${hitRateText}</div>
    `;
    if(prog) div.onclick=()=>renderRaces(vid);
    venuesGrid.appendChild(div);
  });
}

// --- レース一覧 ---
function renderRaces(venueId){
  showScreen("races");
  racesGrid.innerHTML="";

  const targetDate = (CURRENT_MODE==="today")
    ? getIsoDate(new Date())
    : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();

  const races = ALL_PROGRAMS.filter(p =>
    p.race_date===targetDate &&
    Number(p.race_stadium_number)===venueId
  );

  for(let i=1;i<=12;i++){
    const prog = races.find(p=>Number(p.race_number)===i);
    const btn=document.createElement("div");
    btn.className="race-btn "+(prog?"":"disabled");
    btn.textContent = i+"R";
    if(prog) btn.onclick=()=>renderRaceDetail(venueId,i);
    racesGrid.appendChild(btn);
  }
}

// --- 出走表 ---
function renderRaceDetail(venueId, raceNo){
  showScreen("race");

  const targetDate = (CURRENT_MODE==="today")
    ? getIsoDate(new Date())
    : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();

  const prog = ALL_PROGRAMS.find(p =>
    p.race_date===targetDate &&
    p.race_stadium_number===venueId &&
    Number(p.race_number)===Number(raceNo)
  );

  if(!prog){ alert("レースデータがありません"); renderRaces(venueId); return; }

  raceTitle.textContent = `${VENUE_NAMES[venueId-1]} ${raceNo}R ${prog.race_title || ""}`;

  const boats = Array.isArray(prog.boats)
    ? prog.boats.slice().sort((a,b)=> (a.racer_boat_number||0)-(b.racer_boat_number||0))
    : [];

  entryTableBody.innerHTML="";

  // スコア算出
  const scores = boats.map(b=>{
    const local = Number(b.racer_local_top_1_percent||b.racer_local_win_rate||0);
    const motor = Number(b.racer_assigned_motor_top_2_percent||b.racer_motor_win_rate||0);
    const course= Number(b.racer_assigned_boat_top_2_percent||b.racer_course_win_rate||0);

    return {
      boatNo:b.racer_boat_number,
      name:b.racer_name,
      klass:b.racer_class||"-",
      st:b.racer_average_start_timing,
      fcount:b.racer_flying_count||0,
      local, motor, course,
      score:local+motor+course
    };
  });

  // スコア降順で順位付与
  const sorted=[...scores].sort((a,b)=>b.score-a.score);
  sorted.forEach((s,idx)=>{
    let mark="ー";
    if(idx===0) mark="<span class='metric-symbol top'>◎</span>";
    else if(idx===1) mark="<span class='metric-symbol'>○</span>";
    else if(idx===2) mark="<span class='metric-symbol'>△</span>";
    else if(idx===3) mark="<span class='metric-symbol'>✕</span>";
    s.mark=mark;
  });

  // 出走表行
  scores.forEach(r=>{
    const s = sorted.find(x=>x.boatNo===r.boatNo) || {};
    const mark = s.mark || "ー";

    const stText = (r.st!=null)?`ST:${Number(r.st).toFixed(2)}`:"ST:-";
    const fText  = (r.fcount>0)?`F${r.fcount}`:"ー";

    const localText = r.local ? (Math.round(r.local*10)+"%") : "-";
    const motorText = r.motor ? (Math.round(r.motor)+"%") : "-";
    const courseText= r.course? (Math.round(r.course)+"%") : "-";

    const tr=document.createElement("tr");
    tr.classList.add(`row-${r.boatNo}`); // 背景色

    tr.innerHTML=`
      <td class="mono">${r.boatNo}</td>
      <td class="entry-left">
        <div class="klass">${r.klass}</div>
        <div class="name">${r.name}</div>
        <div class="st">${stText}</div>
      </td>
      <td>${fText}</td>
      <td>${localText}</td>
      <td>${motorText}</td>
      <td>${courseText}</td>
      <td>${mark}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  // AI予想欄はダミー
  if(aiMainBody) aiMainBody.innerHTML = '<tr><td>-</td><td class="mono">-</td></tr>'.repeat(5);
  if(aiSubBody) aiSubBody.innerHTML  = '<tr><td>-</td><td class="mono">-</td></tr>'.repeat(5);
  if(commentTableBody) commentTableBody.innerHTML="";
}

// --- イベント ---
todayTab.onclick = ()=>{ CURRENT_MODE="today"; todayTab.classList.add("active"); yesterdayTab.classList.remove("active"); renderVenues(); };
yesterdayTab.onclick=()=>{ CURRENT_MODE="yesterday"; yesterdayTab.classList.add("active"); todayTab.classList.remove("active"); renderVenues(); };

backBtn.onclick=()=>{
  if(SCREEN_RACE.classList.contains("active")) showScreen("races");
  else if(SCREEN_RACES.classList.contains("active")) showScreen("venues");
};
refreshBtn.onclick=()=>loadData();

// --- 初期化 ---
(function(){
  const d=new Date();
  todayLabel.textContent=`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  loadData();
})();