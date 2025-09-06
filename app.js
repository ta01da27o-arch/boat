// app.js
const STATE = { data: null, screen: 'venues', venueId: null, raceNo: null };

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const todayLabel = $('#todayLabel');
const globalHit = $('#globalHit');
const refreshBtn = $('#refreshBtn');

refreshBtn.addEventListener('click', async ()=>{ await loadData(true); render(); });

async function loadData(force=false){
  try{
    const url = './data.json' + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const txt = await res.text();
    if(txt.trim().startsWith('<')) throw new Error('data.json が見つかりません（HTMLが返却）');
    STATE.data = JSON.parse(txt);
    // set header
    todayLabel.textContent = (STATE.data.date) ? new Date(STATE.data.date).toLocaleDateString('ja-JP') : new Date().toLocaleDateString();
    globalHit.textContent = (STATE.data.ai_accuracy!=null)? `${STATE.data.ai_accuracy}%` : '--%';
    return true;
  }catch(e){
    STATE.data = null;
    alert('データ取得エラー: '+e.message);
    console.error(e);
    return false;
  }
}

function showScreen(name){ 
  STATE.screen = name;
  $$('.screen').forEach(s=> s.classList.remove('active'));
  $(`#screen-${name}`).classList.add('active');
}

/* ------------------ rendering ------------------ */

function render(){
  if(!STATE.data){ $('#screen-venues').innerHTML = '<div class="card">データがありません</div>'; return; }
  if(STATE.screen === 'venues') renderVenues();
  else if(STATE.screen === 'races') renderRaces();
  else if(STATE.screen === 'race') renderRace();
}

/* 24場一覧 */
function renderVenues(){
  showScreen('venues');
  const grid = $('#venuesGrid'); grid.innerHTML = '';
  const venues = STATE.data.venues;
  // ensure 24 fixed order: if less provided, fill with placeholders
  const ordered = venues.slice(0,24);
  for(let v of ordered){
    const div = document.createElement('div'); div.className = 'venue';
    const hitText = (v.hitRate!=null) ? `${v.hitRate}%` : '--%';
    div.innerHTML = `<div class="name">${v.name}</div><div class="hit">${hitText}</div>`;
    // button below
    const btn = document.createElement('button');
    btn.className = `venue-btn ${v.hasRacesToday? '':'disabled'}`;
    btn.textContent = v.hasRacesToday ? '開催中' : '本日なし';
    if(v.hasRacesToday){
      btn.addEventListener('click', ()=>{ STATE.venueId = v.id; STATE.screen='races'; render(); });
    } else {
      btn.disabled = true;
    }
    div.appendChild(btn);
    // background blue
    div.style.background = 'linear-gradient(180deg,var(--blue),#028acb)';
    div.style.color = '#fff';
    grid.appendChild(div);
  }
}

/* races screen */
function renderRaces(){
  showScreen('races');
  const venue = STATE.data.venues.find(x=> String(x.id) === String(STATE.venueId));
  if(!venue){ alert('場データがありません'); showScreen('venues'); return; }
  $('#venueName').textContent = venue.name;
  const grid = $('#racesGrid'); grid.innerHTML = '';
  // build 1..12 grid (3 cols x 4 rows)
  for(let no=1; no<=12; no++){
    const btn = document.createElement('button');
    btn.className = 'race-btn';
    const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) || venue.races || [];
    const found = racesForVenue.find(r => (r.number||r.no) === no);
    btn.textContent = `${no}R`;
    if(found){
      btn.addEventListener('click', ()=>{ STATE.raceNo = no; STATE.screen='race'; render(); });
    } else {
      btn.classList.add('off'); btn.disabled = true;
    }
    grid.appendChild(btn);
  }
  $('#backToVenues').onclick = ()=>{ STATE.venueId = null; STATE.screen='venues'; render(); };
}

/* helper: produce ranking symbols ◎○△✕ー based on numeric arrays (higher = better) */
function produceSymbols(values){
  // values: array of numbers (length 6)
  const arr = values.map((v,i)=>({v: Number(v)||0, i}));
  arr.sort((a,b)=> b.v - a.v);
  const marks = ['◎','○','△','✕','ー','ー'];
  const out = Array(6).fill('ー');
  arr.forEach((it, idx)=> out[it.i] = marks[idx] || 'ー');
  return out;
}

/* race detail */
function renderRace(){
  showScreen('race');
  const venue = STATE.data.venues.find(x=> String(x.id) === String(STATE.venueId));
  const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) || venue.races || [];
  const race = racesForVenue.find(r => (r.number||r.no) === STATE.raceNo);
  if(!race){ alert('レースデータなし'); STATE.screen='races'; render(); return; }
  $('#raceTitle').textContent = `${venue.name} ${STATE.raceNo}R`;

  // env
  const env = race.env || {};
  const envP = $('#envPills'); envP.innerHTML = '';
  envP.innerHTML = `<span class="pill">風向 ${env.windDir || '-'}</span> <span class="pill">風速 ${env.windSpeed ?? '-'} m/s</span> <span class="pill">波高 ${env.wave ?? '-'} cm</span>`;

  // entries
  const entries = race.entries || [];
  // arrays for ranking: we assume entry.local[0] etc contain % numeric
  const localVals = entries.map(e => Array.isArray(e.local)? Number(e.local[0]) : Number(e.local) || 0);
  const motorVals = entries.map(e => Array.isArray(e.motor)? Number(e.motor[0]) : Number(e.motor) || 0);
  const courseVals = entries.map(e => Array.isArray(e.course)? Number(e.course[0]) : Number(e.course) || 0);
  const localSym = produceSymbols(localVals);
  const motorSym = produceSymbols(motorVals);
  const courseSym = produceSymbols(courseVals);

  // build entry rows (one row per lane 1..6)
  const tbody = document.querySelector('#entryTable tbody'); tbody.innerHTML = '';
  for(let i=0;i<6;i++){
    const e = entries[i] || { waku:i+1, class:'-', name:'-', st:'-', f:'', local:[0], motor:[0], course:[0] };
    // symbol mark choose: use localSym for display (you wanted ◎ for top of that metric) — show all three metrics separately
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${e.waku}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${e.class || '-'}</div>
          <div class="name">${e.name || '-'}</div>
          <div class="st">ST: ${ (typeof e.st === 'number') ? e.st.toFixed(2) : e.st }</div>
        </div>
      </td>
      <td>${e.f || '-'}</td>
      <td><span class="${localSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${localSym[i]}</span> ${localVals[i]}%</td>
      <td><span class="${motorSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${motorSym[i]}</span> ${motorVals[i]}%</td>
      <td><span class="${courseSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${courseSym[i]}</span> ${courseVals[i]}%</td>
    `;
    tbody.appendChild(tr);
  }

  // AI predictions: left main (5), right sub (5)
  const aiMain = race.ai && (race.ai.main || race.predictions) ? (race.ai.main || race.predictions).slice(0,5) : [];
  const aiSub = race.ai && race.ai.sub ? race.ai.sub.slice(0,5) : [];

  const mainBody = $('#aiMain tbody'); mainBody.innerHTML = '';
  aiMain.forEach(item=>{
    // item may be {bet,rate} or {buy,probability,odds}
    const buy = item.bet || item.buy || item.name || '-';
    const prob = (item.rate ?? item.probability) != null ? `${item.rate ?? item.probability}%` : '-';
    const odds = item.odds ? `${item.odds}倍` : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${buy}</td><td class="mono">${prob} ${odds!=='-'? ' / '+odds : ''}</td>`;
    mainBody.appendChild(tr);
  });

  const subBody = $('#aiSub tbody'); subBody.innerHTML = '';
  aiSub.forEach(item=>{
    const buy = item.bet || item.buy || '-';
    const prob = (item.rate ?? item.probability) != null ? `${item.rate ?? item.probability}%` : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${buy}</td><td class="mono">${prob}</td>`;
    subBody.appendChild(tr);
  });

  // comments table: 1..6
  const commentTbody = $('#commentTable tbody'); commentTbody.innerHTML = '';
  const comments = race.comments || [];
  for(let i=1;i<=6;i++){
    const c = (comments.find(x=>Number(x.no)===i) || {}).text || '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i}コース</td><td>${c}</td>`;
    commentTbody.appendChild(tr);
  }

  // back button
  $('#backToRaces').onclick = ()=>{ STATE.screen='races'; render(); };
}

/* init */
(async ()=>{
  await loadData(false);
  render();
})();