// app.js（完全修正版 — data.json & history.json を読み、24場の的中率＋出走表（順位ベースの印）を反映）

const DATA_URL = './data.json';
const HISTORY_URL = './history.json';

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

let ALL_PROGRAMS = [];   // data.json
let HISTORY = {};        // history.json

let CURRENT_MODE = 'today'; // today / yesterday
let CURRENT_VENUE_ID = null;
let CURRENT_RACE_NO = null;

// utils
function getIsoDate(d){ return d.toISOString().slice(0,10); }
function formatToDisplay(dstr){
  try { const d = new Date(dstr); return d.toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });}
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

// load both data.json and history.json
async function loadData(force=false){
  try{
    const cacheBuster = force ? `?t=${Date.now()}` : '';
    const [pRes, hRes] = await Promise.all([fetch(DATA_URL + cacheBuster), fetch(HISTORY_URL + cacheBuster)]);
    if(!pRes.ok) throw new Error('data.json HTTP '+pRes.status);
    if(!hRes.ok) throw new Error('history.json HTTP '+hRes.status);

    const pJson = await pRes.json();
    const hJson = await hRes.json();

    let progs = null;
    if(pJson && Array.isArray(pJson.programs)) progs = pJson.programs;
    else if(Array.isArray(pJson)) progs = pJson;
    else progs = pJson.programs || [];

    ALL_PROGRAMS = progs;
    HISTORY = hJson || {};

    dateLabel.textContent = formatToDisplay(new Date().toISOString());

    renderVenues();
    return true;
  }catch(err){
    console.error('loadData error', err);
    venuesGrid.innerHTML = `<div class="card">データ取得エラー: ${err.message}</div>`;
    return false;
  }
}

// render 24 venues
function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML = '';
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();

  const hasMap = {};
  ALL_PROGRAMS.forEach(p=>{
    if(p.race_date && p.race_stadium_number && p.race_date === targetDate){
      hasMap[p.race_stadium_number] = true;
    }
  });

  for(let i=0;i<24;i++){
    const id = i+1;
    const name = VENUE_NAMES[i] || `場${id}`;
    const has = !!hasMap[id];

    const card = document.createElement('div');
    card.className = 'venue-card ' + (has ? 'clickable' : 'disabled');
    card.setAttribute('data-venue', id);

    const vname = document.createElement('div'); vname.className='v-name'; vname.textContent = name;
    const status = document.createElement('div'); status.className='v-status'; status.textContent = has ? '開催中' : 'ー';
    const rate = document.createElement('div'); rate.className='v-rate'; rate.textContent = calcHitRateText(id);

    card.appendChild(vname);
    card.appendChild(status);
    card.appendChild(rate);

    if(has){
      card.addEventListener('click', ()=>{
        CURRENT_VENUE_ID = id;
        renderRaces(id);
      });
    }
    venuesGrid.appendChild(card);
  }
}

// render race buttons
function renderRaces(venueId){
  showScreen('races');
  CURRENT_VENUE_ID = venueId;
  venueTitle.textContent = VENUE_NAMES[venueId-1] || `場 ${venueId}`;
  racesGrid.innerHTML = '';

  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  const progs = ALL_PROGRAMS.filter(p => p.race_date === targetDate && p.race_stadium_number === venueId);
  const existing = new Set(progs.map(p => Number(p.race_number)));

  for(let no=1; no<=12; no++){
    const btn = document.createElement('button'); btn.className='race-btn';
    const found = existing.has(no);
    btn.textContent = `${no}R`;
    if(found){
      btn.addEventListener('click', ()=>{
        CURRENT_RACE_NO = no;
        renderRaceDetail(venueId, no);
      });
    } else {
      btn.classList.add('disabled');
      btn.disabled = true;
    }
    racesGrid.appendChild(btn);
  }
}

// 印のルール
function getMarkByRank(rank) {
  switch (rank) {
    case 1: return "◎";
    case 2: return "○";
    case 3: return "△";
    case 4: return "✕";
    case 5: return "ー";
    case 6: return "ー";
    default: return "ー";
  }
}

// render single race detail
function renderRaceDetail(venueId, raceNo){
  showScreen('race');
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  const prog = ALL_PROGRAMS.find(p => p.race_date===targetDate && p.race_stadium_number===venueId && Number(p.race_number)===Number(raceNo));
  if(!prog){ alert('レースデータがありません'); renderRaces(venueId); return; }

  raceTitle.textContent = `${VENUE_NAMES[venueId-1] || venueId} ${raceNo}R ${prog.race_title || ''}`;

  const boats = Array.isArray(prog.boats) ? prog.boats.slice().sort((a,b)=> (a.racer_boat_number||0)-(b.racer_boat_number||0)) : [];

  entryTableBody.innerHTML = '';
  for(let i=1;i<=6;i++){
    const b = boats.find(x => (x.racer_boat_number||i) === i) || null;
    const klass = b && (b.racer_class_number ? (['','A1','A2','B1','B2'][b.racer_class_number] || '-') : (b.racer_class || '-')) || '-';
    const name = b ? (b.racer_name || '-') : '-';
    const st = b && (typeof b.racer_average_start_timing === 'number' ? b.racer_average_start_timing : (b.racer_average_start_timing ? Number(b.racer_average_start_timing) : null));
    const stText = (st != null) ? `ST:${st.toFixed(2)}` : 'ST:-';
    const fcount = b ? Number(b.racer_flying_count || 0) : 0;
    const fText = fcount>0 ? `F${fcount}` : 'ー';

    const localRaw = b && ( (typeof b.racer_local_top_1_percent === 'number') ? b.racer_local_top_1_percent : (typeof b.racer_local_win_rate === 'number' ? b.racer_local_win_rate : null) );
    const localText = (localRaw != null && !Number.isNaN(localRaw)) ? (Math.round(localRaw * 10) + '%') : '-';

    const motorRaw = b && ( (typeof b.racer_assigned_motor_top_2_percent === 'number') ? b.racer_assigned_motor_top_2_percent : (typeof b.racer_motor_win_rate === 'number' ? b.racer_motor_win_rate : null) );
    const motorText = (motorRaw != null && !Number.isNaN(motorRaw)) ? (Math.round(motorRaw) + '%') : '-';

    const courseRaw = b && ( (typeof b.racer_assigned_boat_top_2_percent === 'number') ? b.racer_assigned_boat_top_2_percent : (typeof b.racer_course_win_rate === 'number' ? b.racer_course_win_rate : null) );
    const courseText = (courseRaw != null && !Number.isNaN(courseRaw)) ? (Math.round(courseRaw) + '%') : '-';

    // 表示順位そのまま → 印に変換
    const mark = getMarkByRank(i);
    const markClass = (mark === '◎') ? 'metric-symbol top' : 'metric-symbol';

    const tr = document.createElement('tr');
    tr.className = `row-${i}`;
    tr.innerHTML = `
      <td class="mono">${i}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${klass}</div>
          <div class="name">${name}</div>
          <div class="st">${stText}</div>
        </div>
      </td>
      <td>${fText}</td>
      <td>${localText}</td>
      <td>${motorText}</td>
      <td>${courseText}</td>
      <td><div class="${markClass}">${mark}</div></td>
    `;
    entryTableBody.appendChild(tr);
  }

  if(aiMainBody) aiMainBody.innerHTML = '<tr><td>-</td><td class="mono">-</td></tr>'.repeat(5);
  if(aiSubBody) aiSubBody.innerHTML  = '<tr><td>-</td><td class="mono">-</td></tr>'.repeat(5);
  if(commentTableBody) commentTableBody.innerHTML = '';
}

// calc hit rate
function calcHitRateText(venueId){
  let total = 0, hit = 0;
  for(const dateKey in HISTORY){
    const day = HISTORY[dateKey];
    if(!day || !Array.isArray(day.results)) continue;
    day.results.forEach(race=>{
      if(race.race_stadium_number !== venueId) return;
      total++;
      const trif = race.payouts && race.payouts.trifecta && race.payouts.trifecta[0] && race.payouts.trifecta[0].combination;
      const aiPreds = race.ai_predictions || race.ai_trifecta_predictions || race.predicted_trifecta || [];
      if(trif && Array.isArray(aiPreds) && aiPreds.length > 0){
        if(aiPreds.includes(trif)) hit++;
      }
    });
  }
  if(total === 0) return '--%';
  return Math.round((hit/total)*100) + '%';
}

// events
todayBtn.addEventListener('click', ()=>{
  CURRENT_MODE = 'today';
  todayBtn.classList.add('active'); yesterdayBtn.classList.remove('active');
  loadData(true);
});
yesterdayBtn.addEventListener('click', ()=>{
  CURRENT_MODE = 'yesterday';
  yesterdayBtn.classList.add('active'); todayBtn.classList.remove('active');
  loadData(true);
});
refreshBtn.addEventListener('click', ()=> loadData(true));
backToVenuesBtn?.addEventListener('click', ()=> { CURRENT_VENUE_ID = null; CURRENT_RACE_NO = null; renderVenues(); });
backToRacesBtn?.addEventListener('click', ()=> { CURRENT_RACE_NO = null; renderRaces(CURRENT_VENUE_ID); });

// boot
(async ()=>{
  todayBtn.classList.add('active');
  await loadData(false);
})();