// app.js
const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const globalHit = document.getElementById('globalHit');
const refreshBtn = document.getElementById('refreshBtn');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_RACE   = document.getElementById('screen-race');

const venuesGrid = document.getElementById('venuesGrid');
const racesGrid = document.getElementById('racesGrid');
const venueTitle = document.getElementById('venueTitle');
const raceTitle = document.getElementById('raceTitle');
const envPills = document.getElementById('envPills');
const entryTableBody = document.querySelector('#entryTable tbody');
const aiMainBody = document.querySelector('#aiMain tbody');
const aiSubBody = document.querySelector('#aiSub tbody');
const commentTableBody = document.querySelector('#commentTable tbody');

const backToVenuesBtn = document.getElementById('backToVenues');
const backToRacesBtn = document.getElementById('backToRaces');

const STATE = {
  data: null,
  screen: 'venues', // 'venues' | 'races' | 'race'
  currentVenueId: null,
  currentRaceNo: null
};

function fmtDateISO(dstr){
  try{
    const d = new Date(dstr);
    return d.toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });
  }catch(e){ return dstr; }
}

async function loadData(force=false){
  try{
    const url = './data.json' + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    STATE.data = json;
    // header values
    todayLabel.textContent = STATE.data.date ? fmtDateISO(STATE.data.date) : new Date().toLocaleDateString();
    globalHit.textContent = (STATE.data.ai_accuracy != null) ? `${STATE.data.ai_accuracy}%` : '--%';
    return true;
  }catch(err){
    console.error(err);
    STATE.data = null;
    alert('データ取得エラー:\n' + err.message);
    return false;
  }
}

function showScreen(name){
  SCREEN_VENUES.classList.remove('active');
  SCREEN_RACES.classList.remove('active');
  SCREEN_RACE.classList.remove('active');
  if(name === 'venues') SCREEN_VENUES.classList.add('active');
  if(name === 'races') SCREEN_RACES.classList.add('active');
  if(name === 'race') SCREEN_RACE.classList.add('active');
  STATE.screen = name;
}

/* ---------- Utilities ---------- */
function produceSymbols(values){
  // values: [n1,n2,...] length 6
  const arr = values.map((v,i)=>({v: Number(v)||0, i}));
  arr.sort((a,b)=> b.v - a.v);
  const marks = ['◎','○','△','✕','ー','ー'];
  const out = Array(6).fill('ー');
  arr.forEach((it, idx)=> out[it.i] = marks[idx] || 'ー');
  return out;
}
function produceTotalMarksFromScores(scores){
  // scores array length 6
  const arr = scores.map((v,i)=>({v:Number(v)||0, i}));
  arr.sort((a,b)=> b.v - a.v);
  const marks = ['◎','○','△','✕','ー','ー'];
  const out = Array(6).fill('ー');
  arr.forEach((it, idx)=> out[it.i] = marks[idx] || 'ー');
  return out;
}

/* ---------- Renderers ---------- */

function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML = '';
  const venues = STATE.data && STATE.data.venues ? STATE.data.venues : [];

  // ensure exactly 24 items - if fewer, fill with placeholders
  const base24 = [];
  for(let i=0;i<24;i++){
    base24.push( venues[i] || { id:`v${i+1}`, name:`場${i+1}`, hasRacesToday:false, hitRate:0 } );
  }

  base24.forEach(v=>{
    const div = document.createElement('div');
    div.className = 'venue-card';
    if(v.hasRacesToday) div.classList.add('clickable'); else div.classList.add('disabled');
    div.setAttribute('data-venue', v.id);

    const name = document.createElement('div'); name.className='v-name'; name.textContent = v.name;
    const status = document.createElement('div'); status.className='v-status'; status.textContent = v.hasRacesToday ? '開催中' : 'ー';
    const rate = document.createElement('div'); rate.className='v-rate'; rate.textContent = (v.hitRate!=null) ? `${v.hitRate}%` : '--%';

    div.appendChild(name);
    div.appendChild(status);
    div.appendChild(rate);

    if(v.hasRacesToday){
      div.addEventListener('click', ()=>{
        STATE.currentVenueId = v.id;
        renderRaces();
      });
    }
    venuesGrid.appendChild(div);
  });
}

function renderRaces(){
  showScreen('races');
  const venue = STATE.data.venues.find(x=> String(x.id) === String(STATE.currentVenueId));
  venueTitle.textContent = venue ? venue.name : '未知の場';
  racesGrid.innerHTML = '';

  // Get races array from data.races keyed by id (STATE.data.races is an object keyed by id)
  const racesObj = STATE.data.races || {};
  const racesForVenue = (racesObj[venue.id] || venue.races || []);

  // show 1..12 (grid 4 cols x 3 rows)
  for(let no=1; no<=12; no++){
    const btn = document.createElement('button');
    btn.className = 'race-btn';
    const found = racesForVenue.find(r => (r.number||r.no) === no);
    btn.textContent = `${no}R`;
    if(found){
      btn.addEventListener('click', ()=>{
        STATE.currentRaceNo = no;
        renderRace();
      });
    } else {
      btn.classList.add('disabled');
      btn.disabled = true;
    }
    racesGrid.appendChild(btn);
  }

  // back button → right-side (already in DOM)
  document.getElementById('backToVenues').onclick = ()=>{
    STATE.currentVenueId = null;
    renderVenues();
  };
}

function renderRace(){
  showScreen('race');
  const venue = STATE.data.venues.find(x=> String(x.id) === String(STATE.currentVenueId));
  const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) || venue.races || [];
  const race = racesForVenue.find(r => (r.number||r.no) === STATE.currentRaceNo);
  if(!race){ alert('レースデータがありません'); renderRaces(); return; }

  raceTitle.textContent = `${venue.name} ${race.number || race.no}R`;
  // env pills
  const env = race.env || {};
  envPills.innerHTML = `<span class="pill">発走 ${race.startTime || '-'}</span> <span class="pill">風向 ${env.windDir||'-'}</span> <span class="pill">風速 ${env.windSpeed ?? '-'} m/s</span> <span class="pill">波高 ${env.wave ?? '-'} cm</span>`;

  // compute metric arrays and total
  const entries = race.entries || [];
  // ensure 6 entries slot
  const filled = [];
  for(let i=0;i<6;i++){
    filled.push(entries[i] || { waku:i+1, class:'-', name:'-', st:'-', f:'', local:[0,0], motor:[0,0], course:[0,0] });
  }

  const localVals = filled.map(e=> Array.isArray(e.local) ? Number(e.local[0]||0) : Number(e.local||0) );
  const motorVals = filled.map(e=> Array.isArray(e.motor) ? Number(e.motor[0]||0) : Number(e.motor||0) );
  const courseVals= filled.map(e=> Array.isArray(e.course)? Number(e.course[0]||0) : Number(e.course||0) );

  const localMarks = produceSymbols(localVals);
  const motorMarks = produceSymbols(motorVals);
  const courseMarks = produceSymbols(courseVals);

  // total score (weighted) for overall eval
  const scores = filled.map((e,i)=>{
    const lv = localVals[i], mv = motorVals[i], cv = courseVals[i];
    // weights: local 0.45, motor 0.35, course 0.20 (arbitrary but reasonable)
    return lv*0.45 + mv*0.35 + cv*0.20;
  });
  const totalMarks = produceTotalMarksFromScores(scores);

  // render entry table rows
  entryTableBody.innerHTML = '';
  for(let i=0;i<6;i++){
    const e = filled[i];
    const tr = document.createElement('tr');
    tr.className = `row-${i+1}`;
    const waku = `<td class="mono">${e.waku}</td>`;

    const playerCell = `<td>
      <div class="entry-left">
        <div class="klass">${e.class || '-'}</div>
        <div class="name">${e.name || '-'}</div>
        <div class="st">ST: ${(typeof e.st === 'number') ? e.st.toFixed(2) : (e.st||'-')}</div>
      </div>
    </td>`;

    const fcell = `<td>${e.f ? e.f : '-'}</td>`;

    const localCell = `<td>
      <div class="metric-symbol ${localMarks[i]==='◎' ? 'top':''}">${localMarks[i]}</div>
      <div class="metric-small">${(Array.isArray(e.local) ? (e.local[0] ?? '-') : (e.local ?? '-'))}%</div>
      <div class="metric-small">${(Array.isArray(e.local) ? (e.local[1] ?? '-') : '-') }%</div>
    </td>`;

    const motorCell = `<td>
      <div class="metric-symbol ${motorMarks[i]==='◎' ? 'top':''}">${motorMarks[i]}</div>
      <div class="metric-small">${(Array.isArray(e.motor) ? (e.motor[0] ?? '-') : (e.motor ?? '-'))}%</div>
      <div class="metric-small">${(Array.isArray(e.motor) ? (e.motor[1] ?? '-') : '-') }%</div>
    </td>`;

    const courseCell = `<td>
      <div class="metric-symbol ${courseMarks[i]==='◎' ? 'top':''}">${courseMarks[i]}</div>
      <div class="metric-small">${(Array.isArray(e.course) ? (e.course[0] ?? '-') : (e.course ?? '-'))}%</div>
      <div class="metric-small">${(Array.isArray(e.course) ? (e.course[1] ?? '-') : '-') }%</div>
    </td>`;

    const totalCell = `<td><div class="eval-mark ${totalMarks[i]==='◎' ? 'metric-symbol top' : ''}">${totalMarks[i]}</div></td>`;

    tr.innerHTML = waku + playerCell + fcell + localCell + motorCell + courseCell + totalCell;
    entryTableBody.appendChild(tr);
  }

  // AI predictions
  aiMainBody.innerHTML = '';
  aiSubBody.innerHTML = '';
  const aiMain = (race.ai && race.ai.main) ? race.ai.main.slice(0,5) : (race.predictions ? race.predictions.slice(0,5) : []);
  const aiSub = (race.ai && race.ai.sub) ? race.ai.sub.slice(0,5) : [];

  aiMain.forEach(item=>{
    const bet = item.bet || item.buy || '-';
    const prob = (item.rate ?? item.probability) != null ? `${item.rate ?? item.probability}%` : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${bet}</td><td class="mono">${prob}</td>`;
    aiMainBody.appendChild(tr);
  });
  // ensure 5 rows visible, even if empty
  while(aiMainBody.children.length < 5){
    const tr = document.createElement('tr'); tr.innerHTML = `<td>-</td><td class="mono">-</td>`; aiMainBody.appendChild(tr);
  }

  aiSub.forEach(item=>{
    const bet = item.bet || item.buy || '-';
    const prob = (item.rate ?? item.probability) != null ? `${item.rate ?? item.probability}%` : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${bet}</td><td class="mono">${prob}</td>`;
    aiSubBody.appendChild(tr);
  });
  while(aiSubBody.children.length < 5){
    const tr = document.createElement('tr'); tr.innerHTML = `<td>-</td><td class="mono">-</td>`; aiSubBody.appendChild(tr);
  }

  // comments table per course 1..6
  commentTableBody.innerHTML = '';
  const comments = race.comments || [];
  for(let i=1;i<=6;i++){
    const c = (comments.find(x=>Number(x.no)===i) || {}).text || '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i}コース</td><td style="text-align:left">${c}</td>`;
    commentTableBody.appendChild(tr);
  }

  // back button
  document.getElementById('backToRaces').onclick = ()=> {
    STATE.currentRaceNo = null;
    renderRaces();
  };
}

/* ---------- Boot ---------- */
refreshBtn.addEventListener('click', async ()=>{
  await loadData(true);
  if(STATE.screen === 'venues') renderVenues();
  else if(STATE.screen === 'races') renderRaces();
  else renderRace();
});

(async ()=>{
  const ok = await loadData(false);
  if(ok) renderVenues();
  else {
    // show placeholder venues grid
    venuesGrid.innerHTML = '<div class="card">データがありません。data.json を確認してください。</div>';
    showScreen('venues');
  }
})();