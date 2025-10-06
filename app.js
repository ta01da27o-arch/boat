import { generateAIComments, generateAIPredictions, learnFromResults } from './ai_engine.js';

const DATA_URL = "./data.json";
const HISTORY_URL = "./history.json";
const PREDICTIONS_URL = "./predictions.csv";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

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

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-detail");

const backToVenuesBtn = document.getElementById("backToVenues");
const backToRacesBtn = document.getElementById("backToRaces");

let ALL_PROGRAMS = [];
let HISTORY = {};
let PREDICTIONS = [];
let CURRENT_MODE = "today";

function getIsoDate(d){ return d.toISOString().slice(0,10); }
function formatToDisplay(dstr){ try { return new Date(dstr).toLocaleDateString("ja-JP",{month:"2-digit",day:"2-digit",weekday:"short"});} catch{return dstr;} }
function showScreen(name){ [SCREEN_VENUES,SCREEN_RACES,SCREEN_RACE].forEach(s=>s.classList.remove("active")); document.getElementById(`screen-${name}`).classList.add("active"); }
function logStatus(msg){ aiStatus.textContent=msg; console.log("[APP]",msg); }

async function loadData(force=false){
  logStatus("データ取得中...");
  const q = force?`?t=${Date.now()}`:"";
  const getJson = async(url)=>{try{const r=await fetch(url+q);if(!r.ok)return null;return await r.json();}catch{return null;}};
  const getText = async(url)=>{try{const r=await fetch(url+q);if(!r.ok)return null;return await r.text();}catch{return null;}};
  const pData=await getJson(DATA_URL);
  const hData=await getJson(HISTORY_URL);
  const csvText=await getText(PREDICTIONS_URL);

  ALL_PROGRAMS = Array.isArray(pData)?pData:Object.values(pData||{}).flat();
  HISTORY = hData || {};
  PREDICTIONS = csvText?parseCSV(csvText):[];

  dateLabel.textContent = formatToDisplay(new Date());
  await learnFromResults(HISTORY);
  renderVenues();
  logStatus("準備完了");
}

function parseCSV(text){
  const [header,...lines]=text.trim().split(/\r?\n/);
  const heads=header.split(",");
  return lines.map(l=>{const c=l.split(",");const o={};heads.forEach((h,i)=>o[h]=c[i]);return o;});
}

function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML="";
  const targetDate=(CURRENT_MODE==="today")?getIsoDate(new Date()):getIsoDate(new Date(Date.now()-86400000));
  const hasMap={};
  ALL_PROGRAMS.forEach(p=>{
    const d=p.race_date||p.date;const v=p.race_stadium_number||p.jcd||p.venue_id;
    if(d===targetDate&&v)hasMap[v]=true;
  });
  VENUE_NAMES.forEach((n,i)=>{
    const id=i+1;const has=!!hasMap[id];
    const div=document.createElement("div");
    div.className="venue-card "+(has?"active":"disabled");
    div.innerHTML=`<div class="venue-name">${n}</div>`;
    if(has)div.onclick=()=>renderRaces(id);
    venuesGrid.appendChild(div);
  });
}

function renderRaces(venueId){
  showScreen("races");
  venueTitle.textContent=VENUE_NAMES[venueId-1];
  racesGrid.innerHTML="";
  const targetDate=(CURRENT_MODE==="today")?getIsoDate(new Date()):getIsoDate(new Date(Date.now()-86400000));
  const progs=ALL_PROGRAMS.filter(p=>(p.race_date||p.date)===targetDate&&(p.race_stadium_number||p.jcd||p.venue_id)===venueId);
  const exists=new Set(progs.map(p=>+p.race_number||+p.race_no));
  for(let no=1;no<=12;no++){
    const btn=document.createElement("div");
    btn.className="race-card "+(exists.has(no)?"active":"disabled");
    btn.textContent=`${no}R`;
    if(exists.has(no))btn.onclick=()=>renderRaceDetail(venueId,no);
    racesGrid.appendChild(btn);
  }
}

async function renderRaceDetail(venueId,raceNo){
  showScreen("race");
  const targetDate=(CURRENT_MODE==="today")?getIsoDate(new Date()):getIsoDate(new Date(Date.now()-86400000));
  const prog=ALL_PROGRAMS.find(p=>(p.race_date||p.date)===targetDate&&(p.race_stadium_number||p.jcd||p.venue_id)===venueId&&(+p.race_number||+p.race_no)===raceNo);
  raceTitle.textContent=`${VENUE_NAMES[venueId-1]} ${raceNo}R`;

  if(!prog){ entryTableBody.innerHTML="<tr><td colspan='7'>データなし</td></tr>"; return; }

  const boats=prog.boats||prog.entries||[];
  entryTableBody.innerHTML="";
  const players=boats.map(b=>({
    lane:+b.racer_boat_number||+b.racer_course_number,
    name:b.racer_name||b.name,
    klass:b.racer_class||b.class||"-",
    st:+b.racer_average_start_timing||0.2,
    local:+b.local_win_rate||0.3,
    motor:+b.motor_win_rate||0.3,
    course:+b.course_win_rate||0.3
  }));
  players.forEach(p=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${p.lane}</td><td>${p.name}</td><td>${p.klass}</td>
    <td>${(p.local*100).toFixed(0)}%</td><td>${(p.motor*100).toFixed(0)}%</td><td>${(p.course*100).toFixed(0)}%</td><td></td>`;
    entryTableBody.appendChild(tr);
  });

  const aiPred=await generateAIPredictions(players);
  const aiComments=await generateAIComments(players,aiPred);

  commentTableBody.innerHTML="";
  aiComments.forEach(c=>{
    const tr=document.createElement("tr");
    tr.classList.add("comment-row");
    const score=Math.min(Math.max(c.strength||0,0),1);
    const level=Math.ceil(score*5);
    tr.classList.add(`lvl-${level}`);
    tr.innerHTML=`<td>${c.lane}</td><td>
      <div class="comment-text">${c.comment}</div>
      <div class="comment-bar"><div class="bar-fill" style="width:${score*100}%"></div></div>
    </td>`;
    commentTableBody.appendChild(tr);
  });

  rankingTableBody.innerHTML="";
  (aiPred.ranks||[]).forEach(r=>{
    rankingTableBody.innerHTML+=`<tr><td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score.toFixed(2)}</td></tr>`;
  });
}

todayBtn.onclick=()=>{CURRENT_MODE="today";renderVenues();};
yesterdayBtn.onclick=()=>{CURRENT_MODE="yesterday";renderVenues();};
refreshBtn.onclick=()=>loadData(true);
backToVenuesBtn.onclick=()=>showScreen("venues");
backToRacesBtn.onclick=()=>showScreen("races");
loadData();