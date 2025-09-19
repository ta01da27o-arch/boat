// app.js (会場ごと的中率対応版)
const DATA_URL = './data.json'; // 必要に応じて変更
const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

// DOM
const dateLabel = document.getElementById('dateLabel');
const todayBtn = document.getElementById('todayBtn');
const yesterdayBtn = document.getElementById('yesterdayBtn');
const refreshBtn = document.getElementById('refreshBtn');

const venuesGrid = document.getElementById('venuesGrid');
const racesGrid = document.getElementById('racesGrid');
const venueTitle = document.getElementById('venueTitle');
const raceTitle = document.getElementById('raceTitle');

const entryTableBody = document.querySelector('#entryTable tbody');
const aiMainBody = document.querySelector('#aiMain tbody');
const aiSubBody = document.querySelector('#aiSub tbody');
const commentTableBody = document.querySelector('#commentTable tbody');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_RACE   = document.getElementById('screen-detail');

const backToVenuesBtn = document.getElementById('backToVenues');
const backToRacesBtn = document.getElementById('backToRaces');

// State
let ALL_PROGRAMS = [];
let AI_HIT_RESULTS = {};  // { venueId: {win: X, total: Y} }
let CURRENT_MODE = 'today';
let CURRENT_VENUE_ID = null;
let CURRENT_RACE_NO = null;

// util
function getIsoDate(d){ return d.toISOString().slice(0,10); }
function formatToDisplay(dstr){
  try { const d = new Date(dstr); return d.toLocaleDateString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'});}
  catch(e){ return dstr; }
}
function showScreen(name){
  SCREEN_VENUES.classList.remove('active');
  SCREEN_RACES.classList.remove('active');
  SCREEN_RACE.classList.remove('active');
  if(name==='venues') SCREEN_VENUES.classList.add('active');
  if(name==='races') SCREEN_RACES.classList.add('active');
  if(name==='race') SCREEN_RACE.classList.add('active');
}

// load
async function loadData(force=false){
  try{
    const url = DATA_URL + (force?`?t=${Date.now()}`:'');
    const res = await fetch(url,{cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();

    let progs=null;
    if(json && json.races && Array.isArray(json.races.programs)) progs=json.races.programs;
    else if(Array.isArray(json.programs)) progs=json.programs;
    else if(Array.isArray(json)) progs=json;
    if(!progs) throw new Error('JSON構造不正: programs');

    ALL_PROGRAMS = progs;
    AI_HIT_RESULTS = json.ai_hit_results || {}; // ← 的中データ追加

    const d=new Date();
    dateLabel.textContent=formatToDisplay(d.toISOString());
    renderVenues();
    return true;
  }catch(err){
    console.error('データ読み込み失敗',err);
    venuesGrid.innerHTML=`<div class="card">データ取得エラー:${err.message}</div>`;
    return false;
  }
}

// venues
function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML='';
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  const hasMap={};
  ALL_PROGRAMS.forEach(p=>{
    if(p.race_date===targetDate && p.race_stadium_number){
      hasMap[p.race_stadium_number]=true;
    }
  });

  for(let i=0;i<24;i++){
    const id=i+1;
    const name=VENUE_NAMES[i]||`場${id}`;
    const has=!!hasMap[id];
    const card=document.createElement('div');
    card.className='venue-card '+(has?'clickable':'disabled');
    card.setAttribute('data-venue',id);

    const vname=document.createElement('div'); vname.className='v-name'; vname.textContent=name;
    const status=document.createElement('div'); status.className='v-status'; status.textContent=has?'開催中':'ー';

    // 的中率
    let rateText="--%";
    if(AI_HIT_RESULTS[id]){
      const {win,total}=AI_HIT_RESULTS[id];
      if(total>0) rateText=`${Math.round((win/total)*100)}%`;
      else rateText="0%";
    }
    const rate=document.createElement('div'); rate.className='v-rate'; rate.textContent=rateText;

    card.appendChild(vname);
    card.appendChild(status);
    card.appendChild(rate);

    if(has){
      card.addEventListener('click',()=>{
        CURRENT_VENUE_ID=id;
        renderRaces(id);
      });
    }
    venuesGrid.appendChild(card);
  }
}

// races
function renderRaces(venueId){
  showScreen('races');
  CURRENT_VENUE_ID=venueId;
  venueTitle.textContent=VENUE_NAMES[venueId-1]||`場${venueId}`;
  racesGrid.innerHTML='';

  const targetDate=(CURRENT_MODE==='today')?getIsoDate(new Date()):(function(){const d=new Date();d.setDate(d.getDate()-1);return getIsoDate(d);})();
  const progs=ALL_PROGRAMS.filter(p=>p.race_date===targetDate&&p.race_stadium_number===venueId);
  const existing=new Set(progs.map(p=>Number(p.race_number)));

  for(let no=1;no<=12;no++){
    const btn=document.createElement('button'); btn.className='race-btn';
    const found=existing.has(no);
    btn.textContent=`${no}R`;
    if(found){
      btn.addEventListener('click',()=>{
        CURRENT_RACE_NO=no;
        renderRaceDetail(venueId,no);
      });
    }else{
      btn.classList.add('disabled');
      btn.disabled=true;
    }
    racesGrid.appendChild(btn);
  }
}

// race detail (省略、前回の完全版と同じロジック)
// --- 中略：renderRaceDetail(), comments生成など、既存のコードそのまま ---
// (容量を維持するため省略部分は前回の完全版と同じ内容)

// events
todayBtn.addEventListener('click',()=>{
  CURRENT_MODE='today';
  todayBtn.classList.add('active'); yesterdayBtn.classList.remove('active');
  loadData(true);
});
yesterdayBtn.addEventListener('click',()=>{
  CURRENT_MODE='yesterday';
  yesterdayBtn.classList.add('active'); todayBtn.classList.remove('active');
  loadData(true);
});
refreshBtn.addEventListener('click',()=>loadData(true));
backToVenuesBtn?.addEventListener('click',()=>{CURRENT_VENUE_ID=null;CURRENT_RACE_NO=null;renderVenues();});
backToRacesBtn?.addEventListener('click',()=>{CURRENT_RACE_NO=null;renderRaces(CURRENT_VENUE_ID);});

// boot
(async()=>{
  todayBtn.classList.add('active');
  await loadData(false);
})();