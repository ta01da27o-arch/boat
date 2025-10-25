// /静的/app.js — 完全構築版（開催中/非開催/終了 表示統一 + 半透明タップ不可対応）

import { generateAIComments, generateAIPredictions, learnFromResults, analyzeRace } from './ai_engine.js';

const DATA_URL = "../data/data.json";
const HISTORY_URL = "../data/history.json";
const PREDICTIONS_URL = "../data/predictions.csv";

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

/* DOM要素取得 */
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

/* 状態変数 */
let ALL_PROGRAMS = [];
let HISTORY = {};
let PREDICTIONS = [];
let CURRENT_MODE = "today";

/* 日付・ユーティリティ */
function getIsoDate(d){ return d.toISOString().slice(0,10); }
function formatToDisplay(d){
  try { return new Date(d).toLocaleDateString("ja-JP", {year:"numeric", month:"2-digit", day:"2-digit", weekday:"short"}); }
  catch { return d; }
}
function safeNum(v){ return (v == null || v === "" || isNaN(Number(v))) ? null : Number(v); }
function logStatus(msg){ console.log("[APP]", msg); if(aiStatus) aiStatus.textContent = msg; }

function showScreen(name){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  if(name === "venues") SCREEN_VENUES.classList.add("active");
  if(name === "races") SCREEN_RACES.classList.add("active");
  if(name === "race") SCREEN_RACE.classList.add("active");
}

/* 階級表記 */
function formatKlass(b){
  const map = {1:"A1",2:"A2",3:"B1",4:"B2"};
  return b.racer_class || b.klass || map[b.racer_class_number] || "-";
}

/* 勝率フォーマット */
function formatRateRaw(v){
  if(v==null||v===""||isNaN(Number(v))) return null;
  const n = Number(v);
  if(n<=1) return Math.round(n*100);
  if(n<=10) return Math.round(n*10);
  if(n<=100) return Math.round(n);
  return Math.round(n);
}
function formatRateDisplay(v){
  const pct = formatRateRaw(v);
  return pct == null ? "-" : `${pct}%`;
}

/* データ読み込み */
async function loadData(force=false){
  logStatus("データ取得中...");
  const q = force ? `?t=${Date.now()}` : "";

  async function fetchJson(url){
    try{
      const r = await fetch(url+q);
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    }catch(e){ logStatus(`${url}取得失敗`); return null; }
  }
  async function fetchText(url){
    try{
      const r = await fetch(url+q);
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    }catch(e){ return null; }
  }

  const pData = await fetchJson(DATA_URL);
  const hData = await fetchJson(HISTORY_URL);
  const csvText = await fetchText(PREDICTIONS_URL);

  ALL_PROGRAMS = Array.isArray(pData)
    ? pData
    : typeof pData==="object"
      ? Object.values(pData).flat()
      : [];

  HISTORY = hData || {};
  PREDICTIONS = csvText ? parseCSV(csvText) : [];

  dateLabel.textContent = formatToDisplay(new Date());
  try{
    await learnFromResults(HISTORY);
    logStatus("AI学習完了");
  }catch{ logStatus("AI学習スキップ"); }

  renderVenues();
}

/* CSV解析 */
function parseCSV(text){
  if(!text||!text.trim()) return [];
  const [head,...lines]=text.trim().split(/\r?\n/);
  const headers=head.split(",");
  return lines.map(l=>{
    const c=l.split(",");
    const o={}; headers.forEach((h,i)=>o[h]=c[i]);
    return o;
  });
}

/* 会場一覧（開催中/非開催 表示） */
function renderVenues(){
  showScreen("venues");
  venuesGrid.innerHTML="";
  const targetDate = (CURRENT_MODE==="today")
    ? getIsoDate(new Date())
    : getIsoDate(new Date(Date.now()-86400000));

  const activeMap={};
  ALL_PROGRAMS.forEach(p=>{
    const d=p.race_date||p.date;
    const sid=p.race_stadium_number||p.venue_id||p.jcd;
    if(d===targetDate && sid) activeMap[sid]=true;
  });

  VENUE_NAMES.forEach((name,idx)=>{
    const id=idx+1;
    const has=!!activeMap[id];
    const hit=calcHitRateText(id);
    const card=document.createElement("div");
    card.className="venue-card";
    const statusText = has ? "開催中" : "ー";
    card.innerHTML=`
      <div class="v-name">${name}</div>
      <div class="v-status">${statusText}</div>
      <div class="v-rate">${hit}</div>
    `;
    if(has){
      card.classList.add("clickable");
      card.onclick=()=>renderRaces(id);
    }else{
      card.classList.add("disabled");
      card.style.opacity="0.4";
      card.style.pointerEvents="none";
    }
    venuesGrid.appendChild(card);
  });
}

/* レース一覧 */
function renderRaces(venueId){
  showScreen("races");
  venueTitle.textContent=VENUE_NAMES[venueId-1];
  racesGrid.innerHTML="";
  const targetDate=(CURRENT_MODE==="today")
    ? getIsoDate(new Date())
    : getIsoDate(new Date(Date.now()-86400000));

  const list=ALL_PROGRAMS.filter(p=>{
    const d=p.race_date||p.date;
    const v=p.race_stadium_number||p.venue_id||p.jcd;
    return d===targetDate && v===venueId;
  });
  const exists=new Set(list.map(p=>+p.race_number||+p.race_no));
  for(let i=1;i<=12;i++){
    const btn=document.createElement("button");
    btn.textContent=`${i}R`;
    btn.className="race-btn";
    if(exists.has(i)) btn.onclick=()=>renderRaceDetail(venueId,i);
    else { btn.disabled=true; btn.classList.add("disabled"); }
    racesGrid.appendChild(btn);
  }
}

/* 出走表 */
async function renderRaceDetail(venueId,raceNo){
  showScreen("race");
  const targetDate=(CURRENT_MODE==="today")
    ? getIsoDate(new Date())
    : getIsoDate(new Date(Date.now()-86400000));
  const prog=ALL_PROGRAMS.find(p=>{
    const d=p.race_date||p.date;
    const v=p.race_stadium_number||p.venue_id||p.jcd;
    const n=+p.race_number||+p.race_no;
    return d===targetDate && v===venueId && n===raceNo;
  });
  if(!prog){
    entryTableBody.innerHTML="<tr><td colspan='8'>データなし</td></tr>";
    return;
  }

  raceTitle.textContent=`${VENUE_NAMES[venueId-1]} ${raceNo}R ${prog.race_title||""}`;
  entryTableBody.innerHTML="";

  const boats=prog.boats||prog.entries||[];
  const players=boats.map(b=>{
    const st=safeNum(b.racer_average_start_timing||b.start_timing);
    const nat=safeNum(b.racer_national_win_rate||b.national||b.racer_national_top_2_percent);
    const loc=safeNum(b.racer_local_win_rate||b.local);
    const mot=safeNum(b.motor_win_rate||b.motor);
    const cou=safeNum(b.boat_win_rate||b.course);
    return {
      lane:+b.racer_boat_number||+b.boat_no||0,
      name:b.racer_name||b.name||"-",
      klass:formatKlass(b),
      st,fCount:b.f||0,
      national:formatRateRaw(nat),
      local:formatRateRaw(loc),
      motor:formatRateRaw(mot),
      course:formatRateRaw(cou)
    };
  }).sort((a,b)=>a.lane-b.lane);

  const ranked=[...players].sort((a,b)=>(b.motor||0)-(a.motor||0));
  ranked.forEach((p,i)=>p.mark=i===0?"◎":i===1?"○":i===2?"▲":"✕");

  players.forEach(p=>{
    const fDisplay=p.fCount>0?`F${p.fCount}`:"ー";
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${p.lane}</td>
      <td><div class="klass">${p.klass}</div><div class="name">${p.name}</div><div class="st">ST:${p.st?p.st.toFixed(2):"-"}</div></td>
      <td>${fDisplay}</td>
      <td>${formatRateDisplay(p.national)}</td>
      <td>${formatRateDisplay(p.local)}</td>
      <td>${formatRateDisplay(p.motor)}</td>
      <td>${formatRateDisplay(p.course)}</td>
      <td>${p.mark}</td>`;
    entryTableBody.appendChild(tr);
  });

  try{
    logStatus("AI予測中...");
    const ai = await analyzeRace(players);
    renderAI(ai);
  }catch(e){
    console.warn("AI解析失敗",e);
    logStatus("AI予測エラー");
  }
}

/* AI表示 */
function renderAI(ai){
  aiMainBody.innerHTML="";
  aiSubBody.innerHTML="";
  commentTableBody.innerHTML="";
  rankingTableBody.innerHTML="";

  (ai.main||[]).forEach(r=>{
    aiMainBody.innerHTML+=`<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`;
  });
  (ai.sub||[]).forEach(r=>{
    aiSubBody.innerHTML+=`<tr><td>${r.combo}</td><td>${r.prob}%</td></tr>`;
  });
  (ai.comments||[]).forEach(c=>{
    commentTableBody.innerHTML+=`<tr><td>${c.lane}</td><td>${c.comment}</td></tr>`;
  });
  (ai.ranks||[]).forEach(r=>{
    rankingTableBody.innerHTML+=`<tr><td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score}</td></tr>`;
  });
  logStatus("AI予測完了");
}

/* 的中率 */
function calcHitRateText(venueId){
  let total=0,hit=0;
  for(const d in HISTORY){
    const arr=HISTORY[d]?.results||[];
    arr.forEach(r=>{
      if(r.race_stadium_number===venueId){
        total++;
        const trif=r.payouts?.trifecta?.[0]?.combination;
        const ai=(r.ai_predictions||[]).map(x=>x.combination);
        if(trif && ai.includes(trif)) hit++;
      }
    });
  }
  return total?`${Math.round(hit/total*100)}%`:"0%";
}

/* イベント */
todayBtn.onclick=()=>{CURRENT_MODE="today";todayBtn.classList.add("active");yesterdayBtn.classList.remove("active");renderVenues();};
yesterdayBtn.onclick=()=>{CURRENT_MODE="yesterday";yesterdayBtn.classList.add("active");todayBtn.classList.remove("active");renderVenues();};
refreshBtn.onclick=()=>loadData(true);
backToVenuesBtn.onclick=()=>showScreen("venues");
backToRacesBtn.onclick=()=>showScreen("races");

/* 初期化 */
loadData();

window.addEventListener("error",e=>{
  console.error("Error:",e.error||e.message);
  logStatus("エラー発生");
});