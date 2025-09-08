// app.js (module)
const STATE = { data: null, screen: 'venues', venueId: null, raceNo: null };

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const todayLabel = $('#todayLabel');
const globalHit = $('#globalHit');
const refreshBtn = $('#refreshBtn');

refreshBtn.addEventListener('click', async ()=>{
  await loadData(true);
  render();
});

// loadData: fetch data.json with cache-bypass option, fallback to localStorage
async function loadData(force=false){
  try{
    const url = './data.json' + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error('HTTP '+res.status);
    const txt = await res.text();
    if(txt.trim().startsWith('<')) throw new Error('data.json not found (HTML returned)');
    const json = JSON.parse(txt);
    STATE.data = json;
    // cache to localStorage
    try{ localStorage.setItem('boat_data', JSON.stringify(json)); }catch(e){}
    todayLabel.textContent = json.date ? new Date(json.date).toLocaleDateString('ja-JP') : new Date().toLocaleDateString('ja-JP');
    globalHit.textContent = (json.ai_accuracy!=null) ? `${json.ai_accuracy}%` : '--%';
    return true;
  }catch(e){
    console.error(e);
    // try localStorage
    const cached = localStorage.getItem('boat_data');
    if(cached){
      try{ STATE.data = JSON.parse(cached); todayLabel.textContent = STATE.data.date ? new Date(STATE.data.date).toLocaleDateString('ja-JP') : new Date().toLocaleDateString('ja-JP'); globalHit.textContent = (STATE.data.ai_accuracy!=null) ? `${STATE.data.ai_accuracy}%` : '--%'; return true; }catch(err){}
    }
    alert('データ取得エラー: '+ e.message);
    return false;
  }
}

function showScreen(name){
  STATE.screen = name;
  $$('.screen').forEach(s=> s.classList.remove('active'));
  $(`#screen-${name}`).classList.add('active');
  window.scrollTo(0,0);
}

/* ---------- render venues ---------- */
function renderVenues(){
  showScreen('venues');
  const grid = $('#venuesGrid');
  grid.innerHTML = '';
  const venues = (STATE.data && STATE.data.venues) ? STATE.data.venues : [];
  // ensure 24 items fixed - fill with placeholders if needed
  const fixed = [];
  for(let i=0;i<24;i++){
    fixed.push(venues[i] || { id: `v${i}`, name:`場${i+1}`, hasRacesToday:false, hitRate:0 });
  }
  fixed.forEach(v=>{
    const div = document.createElement('div');
    div.className = 'venue-card ' + (v.hasRacesToday ? '' : 'disabled');
    const statusTxt = v.hasRacesToday ? '開催中' : 'ー';
    div.innerHTML = `
      <div class="venue-name">${v.name}</div>
      <div class="venue-status">${statusTxt}</div>
      <div class="venue-rate">${(v.hitRate!=null)? v.hitRate+'%' : '--%'}</div>
    `;
    if(v.hasRacesToday){
      div.addEventListener('click', ()=>{ STATE.venueId = v.id; STATE.screen='races'; render(); });
    }
    grid.appendChild(div);
  });
}

/* ---------- render races (3x4) ---------- */
function renderRaces(){
  showScreen('races');
  const venue = (STATE.data && STATE.data.venues) ? STATE.data.venues.find(x=> String(x.id) === String(STATE.venueId)) : null;
  if(!venue){ alert('場データがありません'); STATE.screen='venues'; render(); return; }
  $('#venueName').textContent = venue.name;
  const grid = $('#racesGrid'); grid.innerHTML = '';
  // find races for this venue in data.races[venue.id] or venue.races
  const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) || (venue.races || []);
  for(let no=1; no<=12; no++){
    const btn = document.createElement('button');
    btn.className = 'race-btn';
    const found = racesForVenue.find(r => (r.number||r.no) === no);
    btn.textContent = `${no}R`;
    if(found){
      btn.addEventListener('click', ()=>{ STATE.raceNo = no; STATE.screen='race'; render(); });
    } else {
      btn.classList.add('off');
      btn.disabled = true;
    }
    grid.appendChild(btn);
  }
  $('#backToVenues').onclick = ()=>{ STATE.venueId = null; STATE.screen='venues'; render(); };
}

/* ---------- helper: ranking symbols ---------- */
function produceSymbols(values){
  // values: length up to 6 - higher is better
  const arr = values.map((v,i)=>({v: Number(v)||0, i}));
  arr.sort((a,b)=> b.v - a.v);
  const marks = ['◎','○','△','✕','ー','ー'];
  const out = Array(6).fill('ー');
  arr.forEach((it, idx)=> out[it.i] = marks[idx] || 'ー');
  return out;
}

/* ---------- render race detail ---------- */
function renderRace(){
  showScreen('race');
  const venue = (STATE.data && STATE.data.venues) ? STATE.data.venues.find(x=> String(x.id) === String(STATE.venueId)) : null;
  const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) || (venue.races || []);
  const race = racesForVenue.find(r => (r.number||r.no) === STATE.raceNo);
  if(!race){ alert('レースデータなし'); STATE.screen='races'; render(); return; }
  $('#raceTitle').textContent = `${venue.name} ${STATE.raceNo}R`;

  // env
  const env = race.env || {};
  $('#envPills').innerHTML = `<div class="pill">風向 ${env.windDir || '-'}</div><div class="pill">風速 ${env.windSpeed ?? '-'} m/s</div><div class="pill">波高 ${env.wave ?? '-'} cm</div>`;

  // entries
  const entries = race.entries || [];
  // calculate ranking metrics using 2連対率 (local[0], motor[0], course[0]) if array
  const localVals = entries.map(e => Array.isArray(e.local) ? Number(e.local[0]) : Number(e.local) || 0);
  const motorVals = entries.map(e => Array.isArray(e.motor) ? Number(e.motor[0]) : Number(e.motor) || 0);
  const courseVals = entries.map(e => Array.isArray(e.course) ? Number(e.course[0]) : Number(e.course) || 0);

  const localSym = produceSymbols(localVals);
  const motorSym = produceSymbols(motorVals);
  const courseSym = produceSymbols(courseVals);

  const tbody = document.querySelector('#entryTable tbody'); tbody.innerHTML = '';
  for(let i=0;i<6;i++){
    const e = entries[i] || { waku:i+1, class:'-', name:'-', st:'-', f:'', local:[0,0], motor:[0,0], course:[0,0] };
    const tr = document.createElement('tr');
    // each win-rate cell shows symbol (top), 2連対率 (middle), 3連対率 (bottom)
    const local2 = Array.isArray(e.local)? (e.local[0] ?? '-') : (e.local ?? '-');
    const local3 = Array.isArray(e.local)? (e.local[1] ?? '-') : '-';
    const motor2 = Array.isArray(e.motor)? (e.motor[0] ?? '-') : (e.motor ?? '-');
    const motor3 = Array.isArray(e.motor)? (e.motor[1] ?? '-') : '-';
    const course2 = Array.isArray(e.course)? (e.course[0] ?? '-') : (e.course ?? '-');
    const course3 = Array.isArray(e.course)? (e.course[1] ?? '-') : '-';
    const overallMark = (localSym[i] === '◎' || motorSym[i] === '◎' || courseSym[i] === '◎') ? '◎' : 'ー';
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
      <td>
        <div><span class="${localSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${localSym[i]}</span></div>
        <div>${local2}%</div>
        <div>${local3}%</div>
      </td>
      <td>
        <div><span class="${motorSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${motorSym[i]}</span></div>
        <div>${motor2}%</div>
        <div>${motor3}%</div>
      </td>
      <td>
        <div><span class="${courseSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${courseSym[i]}</span></div>
        <div>${course2}%</div>
        <div>${course3}%</div>
      </td>
      <td><span class="${overallMark==='◎' ? 'symbol-top' : 'symbol'}">${overallMark}</span></td>
    `;
    tbody.appendChild(tr);
  }

  // AI predictions
  const aiMain = race.ai && (race.ai.main || race.predictions) ? (race.ai.main || race.predictions).slice(0,5) : [];
  const aiSub = race.ai && race.ai.sub ? race.ai.sub.slice(0,5) : [];
  const mainBody = $('#aiMain tbody'); mainBody.innerHTML = '';
  aiMain.forEach(item=>{
    const buy = item.bet || item.buy || '-';
    const prob = (item.rate ?? item.probability) != null ? `${item.rate ?? item.probability}%` : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${buy}</td><td class="mono">${prob}</td>`;
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

  // comments
  const commentTbody = $('#commentTable tbody'); commentTbody.innerHTML = '';
  const comments = race.comments || [];
  for(let i=1;i<=6;i++){
    const c = (comments.find(x=>Number(x.no)===i) || {}).text || '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i}コース</td><td style="text-align:left">${c}</td>`;
    commentTbody.appendChild(tr);
  }

  $('#backToRaces').onclick = ()=>{ STATE.screen='races'; render(); };
}

/* main render */
function render(){
  if(!STATE.data){ $('#screen-venues').innerHTML = '<div class="card">データがありません。</div>'; return; }
  if(STATE.screen === 'venues') renderVenues();
  else if(STATE.screen === 'races') renderRaces();
  else if(STATE.screen === 'race') renderRace();
}

/* boot */
(async ()=>{
  await loadData(false);
  render();
})();