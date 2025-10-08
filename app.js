import { generateAIComments, generateAIPredictions, learnFromResults, analyzeRace } from './ai_engine.js';

const DATA_URL = "./data.json";
const HISTORY_URL = "./history.json";
const PREDICTIONS_URL = "./predictions.csv";

const VENUE_NAMES = ["桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑","津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島","宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"];

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
let CURRENT_MODE = "today";

/* util */
function getIsoDate(d){return d.toISOString().slice(0,10);}
function formatToDisplay(dstr){try{return new Date(dstr).toLocaleDateString("ja-JP",{year:"numeric",month:"2-digit",day:"2-digit",weekday:"short"});}catch{return dstr;}}
function showScreen(n){[SCREEN_VENUES,SCREEN_RACES,SCREEN_RACE].forEach(s=>s.classList.remove("active"));if(n==="venues")SCREEN_VENUES.classList.add("active");if(n==="races")SCREEN_RACES.classList.add("active");if(n==="race")SCREEN_RACE.classList.add("active");}
function safeNum(v){return(v==null||v===""||isNaN(Number(v)))?null:Number(v);}
function logStatus(m){console.log("[APP]",m);aiStatus.textContent=m;}

/* 勝率フォーマット（数値→%整数） */
function formatRateRaw(v){if(v==null||v===""||isNaN(Number(v)))return null;const n=Number(v);if(n<=1)return Math.round(n*100);if(n<=10)return Math.round(n*10);if(n<=100)return Math.round(n);return Math.round(n);}
function formatRateDisplay(v){const pct=formatRateRaw(v);return pct==null?"-":`${pct}%`;}

/* データ読み込み */
async function loadData(force=false){
  logStatus("データ取得中...");
  try{
    const q=force?`?t=${Date.now()}`:"";
    const p=await fetch(DATA_URL+q);const j=await p.json();ALL_PROGRAMS=Array.isArray(j)?j:Object.values(j).flat();
    const h=await fetch(HISTORY_URL+q);HISTORY=await h.json();
    dateLabel.textContent=formatToDisplay(new Date());
    renderVenues();logStatus("準備完了");
  }catch(e){logStatus("データ取得失敗:"+e.message);}
}

/* 会場一覧 */
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML="";
  VENUE_NAMES.forEach((name,idx)=>{
    const id=idx+1;
    const card=document.createElement("div");
    card.className="venue-card clickable";
    card.innerHTML=`<div class="v-name">${name}</div><div class="v-status">開催中</div>`;
    card.onclick=()=>renderRaces(id);
    venuesGrid.appendChild(card);
  });
}

/* レース一覧 */
function renderRaces(id){
  showScreen("races");
  venueTitle.textContent=VENUE_NAMES[id-1];
  racesGrid.innerHTML="";
  for(let no=1;no<=12;no++){
    const b=document.createElement("button");
    b.textContent=`${no}R`;
    b.className="race-btn";
    b.onclick=()=>renderRaceDetail(id,no);
    racesGrid.appendChild(b);
  }
}

/* 出走表 + 全国勝率追加 */
async function renderRaceDetail(venueId,raceNo){
  showScreen("race");
  raceTitle.textContent=`${VENUE_NAMES[venueId-1]} ${raceNo}R`;

  // ダミー表示（AI連携箇所保持）
  const boats=Array.from({length:6}).map((_,i)=>({
    lane:i+1,name:`選手${i+1}`,klass:"A1",st:(0.12+i*0.01),
    national:70+i,local:65+i,motor:60+i,course:55+i
  }));

  entryTableBody.innerHTML="";
  boats.forEach(p=>{
    const tr=document.createElement("tr");
    tr.classList.add(`row-${p.lane}`);
    tr.innerHTML=`
      <td>${p.lane}</td>
      <td><div class="entry-left">
        <div class="klass">${p.klass}</div>
        <div class="name">${p.name}</div>
        <div class="st">ST:${p.st.toFixed(2)}</div>
      </div></td>
      <td>-</td>
      <td>${formatRateDisplay(p.national)}</td>
      <td>${formatRateDisplay(p.local)}</td>
      <td>${formatRateDisplay(p.motor)}</td>
      <td>${formatRateDisplay(p.course)}</td>
      <td>◎</td>`;
    entryTableBody.appendChild(tr);
  });

  aiMainBody.innerHTML="<tr><td>1-2-3</td><td>45%</td></tr>";
  aiSubBody.innerHTML="<tr><td>1-3-2</td><td>33%</td></tr>";
  commentTableBody.innerHTML="<tr><td>1</td><td>逃げ切り濃厚</td></tr>";
  rankingTableBody.innerHTML="<tr><td>1</td><td>1</td><td>選手1</td><td>95.0</td></tr>";
}

todayBtn.onclick=()=>{CURRENT_MODE="today";todayBtn.classList.add("active");yesterdayBtn.classList.remove("active");renderVenues();};
yesterdayBtn.onclick=()=>{CURRENT_MODE="yesterday";yesterdayBtn.classList.add("active");todayBtn.classList.remove("active");renderVenues();};
refreshBtn.onclick=()=>loadData(true);
backToVenuesBtn.onclick=()=>showScreen("venues");
backToRacesBtn.onclick=()=>showScreen("races");

loadData();