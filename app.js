// app.js (ES module not required)
const VENUES_GRID = document.getElementById('venuesGrid');
const RACES_GRID = document.getElementById('racesGrid');
const RACES_TITLE = document.getElementById('racesTitle');
const RACE_TITLE = document.getElementById('raceTitle');
const ENTRY_TBODY = document.querySelector('#entryTable tbody');
const AI_MAIN = document.querySelector('#aiMain tbody');
const AI_SUB = document.querySelector('#aiSub tbody');
const COMMENT_TBODY = document.querySelector('#commentTable tbody');
const ENV_PILLS = document.getElementById('envPills');
const TODAY = document.getElementById('todayLabel');
const GLOBAL_HIT = document.getElementById('globalHit');
const REFRESH_BTN = document.getElementById('refreshBtn');

let DATA = null;
let CURRENT_VENUE = null;
let CURRENT_RACE_NO = null;

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id + '-screen').classList.add('active');
}

// date + initial
TODAY.textContent = new Date().toLocaleDateString('ja-JP');
showScreen('venues');

REFRESH_BTN.addEventListener('click', ()=> loadData(true));

// load data.json network-first (but uses localStorage cache)
async function loadData(force=false){
  try{
    if(!force && localStorage.getItem('boat_data')){
      DATA = JSON.parse(localStorage.getItem('boat_data'));
    }
    const url = './data.json' + (force? `?t=${Date.now()}` : '');
    const res = await fetch(url, {cache:'no-store'});
    if(res.ok){
      const parsed = await res.json();
      DATA = parsed;
      localStorage.setItem('boat_data', JSON.stringify(parsed));
    } else {
      console.warn('data.json fetch failed', res.status);
    }
    renderVenues();
    GLOBAL_HIT.textContent = DATA.ai_accuracy != null ? `${DATA.ai_accuracy}%` : '--%';
  }catch(err){
    console.error('loadData', err);
    alert('データ取得エラー: data.json を確認してください。');
  }
}

// utility: ensure 24 fixed list - if data provides fewer, fill placeholders
function getOrderedVenues(){
  const fixedOrder = [
    'kiryu','toda','edogawa','heiwajima','tamagawa','hamanako','gamagori','tokoname',
    'tsu','mikuni','biwako','suminoe','amagasaki','naruto','marugame','kojima',
    'miyajima','tokuyama','shimonoseki','wakamatsu','ashiya','fukuoka','karatsu','omura'
  ];
  const map = (DATA && DATA.venues) ? DATA.venues.reduce((acc,v)=> (acc[v.id]=v, acc), {}) : {};
  return fixedOrder.map(id => map[id] || { id, name: id, active:false, rate:0, races:[] });
}

// render 24 cards (4x6)
function renderVenues(){
  VENUES_GRID.innerHTML = '';
  const venues = getOrderedVenues();
  venues.forEach(v=>{
    const card = document.createElement('div');
    card.className = 'venue-card' + (v.active? ' button-like' : ' disabled');
    const name = `<div class="v-name">${v.name}</div>`;
    const status = `<div class="v-status">${v.active ? '開催中' : 'ー'}</div>`;
    const rate = `<div class="v-rate">${(v.rate!=null? v.rate : '--')}%</div>`;
    card.innerHTML = name + status + rate;
    if(v.active){
      card.addEventListener('click', ()=> {
        CURRENT_VENUE = v;
        renderRaces(v);
      });
    }
    VENUES_GRID.appendChild(card);
  });
  showScreen('venues');
}

// render races 1..12 (3x4)
function renderRaces(venue){
  RACES_TITLE.textContent = `${venue.name}（1〜12R）`;
  RACES_GRID.innerHTML = '';
  for(let no=1; no<=12; no++){
    const btn = document.createElement('button');
    btn.className = 'race-btn';
    btn.textContent = `${no}R`;
    const races = (DATA && DATA.races && DATA.races[venue.id]) ? DATA.races[venue.id] : venue.races || [];
    const found = races.find(r => (r.number || r.no) === no);
    if(found){
      btn.addEventListener('click', ()=> {
        CURRENT_RACE_NO = no;
        renderRaceDetail(venue, found);
      });
    } else {
      btn.classList.add('disabled');
      btn.disabled = true;
    }
    RACES_GRID.appendChild(btn);
  }
  document.getElementById('backToVenues').onclick = ()=> { CURRENT_VENUE = null; showScreen('venues'); };
  showScreen('races');
}

// helper: rank symbols by numeric array (higher better)
function rankSymbols(arr){
  // arr length should be 6
  const items = arr.map((v,i)=>({v: Number(v)||0, i}));
  items.sort((a,b)=> b.v - a.v);
  const marks = ['◎','○','△','✕','ー','ー'];
  const out = new Array(arr.length).fill('ー');
  items.forEach((it, idx)=> out[it.i] = marks[idx] || 'ー');
  return out;
}
function rankOverall(arr){
  // same as above
  return rankSymbols(arr);
}

// render race detail (entry table, ai, comments)
function renderRaceDetail(venue, race){
  RACE_TITLE.textContent = `${venue.name} ${race.number || race.no}R 出走表`;
  // env
  const env = race.env || {};
  ENV_PILLS.innerHTML = `
    <span class="pill">風向 ${env.windDir || '-'}</span>
    <span class="pill">風速 ${env.windSpeed ?? '-'} m/s</span>
    <span class="pill">波高 ${env.wave ?? '-'} cm</span>
  `;

  const entries = race.entries || [];
  // ensure 6 entries displayed
  const list = [];
  for(let i=0;i<6;i++){
    list.push(entries[i] || { waku:i+1, class:'-', name:'-', st:'-', f:'', local2:0, local3:0, motor2:0, motor3:0, course2:0, course3:0 });
  }

  // compute marks based on 2連対率 arrays
  const localVals = list.map(e => Number(e.local2) || 0);
  const motorVals = list.map(e => Number(e.motor2) || 0);
  const courseVals = list.map(e => Number(e.course2) || 0);
  const overallVals = list.map((e,i) => (localVals[i] + motorVals[i] + courseVals[i])); // simple sum
  const localMarks = rankSymbols(localVals);
  const motorMarks = rankSymbols(motorVals);
  const courseMarks = rankSymbols(courseVals);
  const overallMarks = rankOverall(overallVals);

  // render table rows
  ENTRY_TBODY.innerHTML = '';
  for(let i=0;i<6;i++){
    const e = list[i];
    const tr = document.createElement('tr');
    tr.className = `row-${i+1}`;
    tr.innerHTML = `
      <td class="mono">${e.waku}</td>
      <td style="text-align:left">
        <div style="font-size:12px;color:#6b7280">${e.class || '-'}</div>
        <div style="font-weight:900">${e.name || '-'}</div>
        <div style="font-size:13px;color:#374151">ST: ${(typeof e.st === 'number') ? e.st.toFixed(2) : e.st}</div>
      </td>
      <td>${e.f || '-'}</td>
      <td>
        <div class="mark ${localMarks[i]==='◎' ? 'red' : ''}">${localMarks[i]}</div>
        <div>${localVals[i]}%</div>
        <div style="font-size:12px;color:#374151">${(e.local3!=null? e.local3+'%':'-')}</div>
      </td>
      <td>
        <div class="mark ${motorMarks[i]==='◎' ? 'red' : ''}">${motorMarks[i]}</div>
        <div>${motorVals[i]}%</div>
        <div style="font-size:12px;color:#374151">${(e.motor3!=null? e.motor3+'%':'-')}</div>
      </td>
      <td>
        <div class="mark ${courseMarks[i]==='◎' ? 'red' : ''}">${courseMarks[i]}</div>
        <div>${courseVals[i]}%</div>
        <div style="font-size:12px;color:#374151">${(e.course3!=null? e.course3+'%':'-')}</div>
      </td>
      <td><div class="mark ${overallMarks[i]==='◎' ? 'red' : ''}">${overallMarks[i]}</div></td>
    `;
    ENTRY_TBODY.appendChild(tr);
  }

  // AI main & sub
  AI_MAIN.innerHTML = '';
  AI_SUB.innerHTML = '';
  const aiMain = (race.ai && (race.ai.main || race.predictions)) ? (race.ai.main || race.predictions).slice(0,5) : [];
  const aiSub = (race.ai && race.ai.sub) ? race.ai.sub.slice(0,5) : [];
  aiMain.forEach(it=>{
    const combo = it.combo || it.bet || it.buy || '-';
    const rate = (it.rate ?? it.probability) != null ? `${it.rate ?? it.probability}%` : '-';
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${combo}</td><td>${rate}</td>`;
    AI_MAIN.appendChild(tr);
  });
  aiSub.forEach(it=>{
    const combo = it.combo || it.bet || it.buy || '-';
    const rate = (it.rate ?? it.probability) != null ? `${it.rate ?? it.probability}%` : '-';
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${combo}</td><td>${rate}</td>`;
    AI_SUB.appendChild(tr);
  });

  // comments (1..6)
  COMMENT_TBODY.innerHTML = '';
  const comments = race.comments || [];
  for(let i=1;i<=6;i++){
    const c = (comments.find(x=>Number(x.no)===i) || {}).text || '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i}コース</td><td style="text-align:left">${c}</td>`;
    COMMENT_TBODY.appendChild(tr);
  }

  document.getElementById('backToRaces').onclick = ()=> {
    CURRENT_RACE_NO = null;
    renderRaces(CURRENT_VENUE);
  };

  showScreen('race');
}

// boot
(async ()=>{ await loadData(false); })();