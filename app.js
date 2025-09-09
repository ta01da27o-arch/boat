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

// ---------- Utilities ----------
function fmtDateISO(dstr){
  try{
    const d = new Date(dstr);
    return d.toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });
  }catch(e){ return dstr; }
}

// Fetch data.json, ネット優先
async function loadData(force=false){
  try{
    const url = './data.json' + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    STATE.data = json;

    // header values
    todayLabel.textContent = STATE.data.date ? fmtDateISO(STATE.data.date) : new Date().toLocaleDateString();
    globalHit.textContent = (STATE.data.ai_accuracy != null) ? `${STATE.data.ai_accuracy}%` : '--%';
    return true;
  }catch(err){
    console.warn('ネット取得失敗 → キャッシュ fallback');
    // キャッシュから復元
    try{
      const cache = await caches.open('boat-ai-pwa-v1');
      const cachedResp = await cache.match('./data.json');
      if(cachedResp){
        const json = await cachedResp.json();
        STATE.data = json;
        return true;
      }
    }catch(e){}
    return false;
  }
}

function showScreen(name){
  SCREEN_VENUES.classList.remove('active');
  SCREEN_RACES.classList.remove('active');
  SCREEN_RACE.classList.remove('active');
  if(name==='venues') SCREEN_VENUES.classList.add('active');
  if(name==='races') SCREEN_RACES.classList.add('active');
  if(name==='race') SCREEN_RACE.classList.add('active');
  STATE.screen = name;
}

// ---------- Renderers ----------
function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML = '';
  const venues = STATE.data?.venues || [];
  const base24 = [];
  for(let i=0;i<24;i++) base24.push( venues[i] || { id:`v${i+1}`, name:`場${i+1}`, hasRacesToday:false, hitRate:0 } );

  base24.forEach(v=>{
    const div = document.createElement('div');
    div.className = 'venue-card ' + (v.hasRacesToday ? 'clickable' : 'disabled');
    div.setAttribute('data-venue', v.id);
    div.innerHTML = `<div class="v-name">${v.name}</div>
                     <div class="v-status">${v.hasRacesToday?'開催中':'ー'}</div>
                     <div class="v-rate">${v.hitRate!=null?v.hitRate+'%':'--%'}</div>`;
    if(v.hasRacesToday) div.addEventListener('click', ()=>{ STATE.currentVenueId=v.id; renderRaces(); });
    venuesGrid.appendChild(div);
  });
}

function renderRaces(){
  showScreen('races');
  const venue = STATE.data.venues.find(x=>String(x.id)===String(STATE.currentVenueId));
  venueTitle.textContent = venue?.name || '未知の場';
  racesGrid.innerHTML = '';

  const racesForVenue = STATE.data.races[venue.id] || venue.races || [];
  for(let no=1; no<=12; no++){
    const btn = document.createElement('button');
    btn.className = 'race-btn';
    const found = racesForVenue.find(r=>(r.number||r.no)===no);
    btn.textContent = `${no}R`;
    if(found) btn.addEventListener('click', ()=>{ STATE.currentRaceNo=no; renderRace(); });
    else { btn.classList.add('disabled'); btn.disabled=true; }
    racesGrid.appendChild(btn);
  }

  backToVenuesBtn.onclick = ()=>{ STATE.currentVenueId=null; renderVenues(); };
}

function produceSymbols(values){
  const arr = values.map((v,i)=>({v:Number(v)||0,i}));
  arr.sort((a,b)=>b.v-a.v);
  const marks = ['◎','○','△','✕','ー','ー'];
  const out = Array(6).fill('ー');
  arr.forEach((it,idx)=>out[it.i]=marks[idx]||'ー');
  return out;
}

function produceTotalMarksFromScores(scores){
  const arr = scores.map((v,i)=>({v:Number(v)||0,i}));
  arr.sort((a,b)=>b.v-a.v);
  const marks = ['◎','○','△','✕','ー','ー'];
  const out = Array(6).fill('ー');
  arr.forEach((it,idx)=>out[it.i]=marks[idx]||'ー');
  return out;
}

function renderRace(){
  showScreen('race');
  const venue = STATE.data.venues.find(x=>String(x.id)===String(STATE.currentVenueId));
  const racesForVenue = STATE.data.races[venue.id] || venue.races || [];
  const race = racesForVenue.find(r=>(r.number||r.no)===STATE.currentRaceNo);
  if(!race){ alert('レースデータがありません'); renderRaces(); return; }

  raceTitle.textContent = `${venue.name} ${race.number||race.no}R`;
  const env = race.env || {};
  envPills.innerHTML = `<span class="pill">発走 ${race.startTime||'-'}</span>
                        <span class="pill">風向 ${env.windDir||'-'}</span>
                        <span class="pill">風速 ${env.windSpeed ?? '-'} m/s</span>
                        <span class="pill">波高 ${env.wave ?? '-'} cm</span>`;

  const entries = race.entries || [];
  const filled = [];
  for(let i=0;i<6;i++) filled.push(entries[i] || { waku:i+1, class:'-', name:'-', st:'-', f:'', local:[0,0], motor:[0,0], course:[0,0] });

  const localVals = filled.map(e=>Array.isArray(e.local)?Number(e.local[0]||0):Number(e.local||0));
  const motorVals = filled.map(e=>Array.isArray(e.motor)?Number(e.motor[0]||0):Number(e.motor||0));
  const courseVals= filled.map(e=>Array.isArray(e.course)?Number(e.course[0]||0):Number(e.course||0));

  const localMarks = produceSymbols(localVals);
  const motorMarks = produceSymbols(motorVals);
  const courseMarks= produceSymbols(courseVals);

  const scores = filled.map((e,i)=> localVals[i]*0.45 + motorVals[i]*0.35 + courseVals[i]*0.2 );
  const totalMarks = produceTotalMarksFromScores(scores);

  entryTableBody.innerHTML='';
  for(let i=0;i<6;i++){
    const e = filled[i];
    const tr = document.createElement('tr');
    tr.className = `row-${i+1}`;
    tr.innerHTML = `
      <td class="mono">${e.waku}</td>
      <td><div class="entry-left"><div class="klass">${e.class}</div><div class="name">${e.name}</div><div class="st">ST: ${(typeof e.st==='number')?e.st.toFixed(2):'-'}</div></div></td>
      <td>${e.f||'-'}</td>
      <td><div class="metric-symbol ${localMarks[i]==='◎'?'top':''}">${localMarks[i]}</div><div class="metric-small">${e.local[0]??'-'}%</div><div class="metric-small">${e.local[1]??'-'}%</div></td>
      <td><div