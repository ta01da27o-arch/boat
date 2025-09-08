// app.js
const STATE = {
  data: null,
  screen: 'venues', // 'venues' | 'races' | 'race'
  venueId: null,
  raceNo: null
};

const E = selector => document.querySelector(selector);
const Es = selector => Array.from(document.querySelectorAll(selector));

const venuesGrid = E('#venuesGrid');
const racesGrid = E('#racesGrid');
const entryTableBody = E('#entryTable tbody');
const aiMainBody = E('#aiMain tbody');
const aiSubBody = E('#aiSub tbody');
const commentTbody = E('#commentTable tbody');

const dateLabel = E('#dateLabel');
const globalHit = E('#globalHit');
const refreshBtn = E('#refreshBtn');

refreshBtn.addEventListener('click', async () => {
  await loadData(true);
  render();
});

async function loadData(force = false){
  try{
    const url = `./data.json${force ? `?t=${Date.now()}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    STATE.data = await res.json();
    // header
    if(STATE.data.date) {
      const d = new Date(STATE.data.date);
      dateLabel.textContent = d.toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });
    } else {
      dateLabel.textContent = new Date().toLocaleDateString();
    }
    globalHit.textContent = (STATE.data.ai_accuracy != null) ? `${STATE.data.ai_accuracy}%` : '--%';
    return true;
  }catch(e){
    console.error('データ取得エラー', e);
    alert('データ取得エラー: data.json を確認してください。');
    STATE.data = null;
    return false;
  }
}

function showScreen(name){
  STATE.screen = name;
  Es('.screen').forEach(s => s.classList.remove('active'));
  E(`#screen-${name}`).classList.add('active');
}

/* ---------- render venues ---------- */
function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML = '';
  if(!STATE.data || !Array.isArray(STATE.data.venues)){
    venuesGrid.innerHTML = `<div class="card">データがありません</div>`;
    return;
  }
  // ensure exactly 24 entries (fill placeholders if fewer)
  const venues = STATE.data.venues.slice(0,24);
  while(venues.length < 24){
    venues.push({ id: `placeholder-${venues.length+1}`, name: '---', hasRacesToday: false, hitRate: '--' });
  }

  venues.forEach(v => {
    const div = document.createElement('div');
    div.className = 'venue-card';
    const isActive = !!v.hasRacesToday;
    if(isActive) div.classList.add('clickable');
    else div.classList.add('disabled');

    div.innerHTML = `
      <div class="v-name">${v.name}</div>
      <div class="v-status">${isActive ? '開催中' : 'ー'}</div>
      <div class="v-rate">${(v.hitRate != null && v.hitRate !== '') ? v.hitRate + '%' : '--%'}</div>
    `;

    if(isActive){
      div.addEventListener('click', ()=> {
        STATE.venueId = v.id;
        renderRaces();
      });
    }
    venuesGrid.appendChild(div);
  });
}

/* ---------- render races (1..12 grid 3x4) ---------- */
function renderRaces(){
  showScreen('races');
  const venue = (STATE.data && STATE.data.venues.find(x=> x.id === STATE.venueId));
  if(!venue){
    alert('場データがありません');
    renderVenues();
    return;
  }
  E('#venueTitle').textContent = venue.name;
  racesGrid.innerHTML = '';
  const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) || [];

  for(let no=1; no<=12; no++){
    const btn = document.createElement('button');
    btn.className = 'race-btn';
    btn.textContent = `${no}R`;
    const found = racesForVenue.find(r => (r.number || r.no) === no);
    if(found){
      btn.addEventListener('click', ()=> {
        STATE.raceNo = no;
        renderRace();
      });
    } else {
      btn.classList.add('disabled');
      btn.disabled = true;
    }
    racesGrid.appendChild(btn);
  }

  E('#backToVenues').onclick = ()=> {
    STATE.venueId = null;
    renderVenues();
  };
}

/* ---------- ranking symbols helper ---------- */
function produceSymbols(values){
  // values: array length 6 numeric
  const arr = values.map((v,i)=>({ v: Number(v)||0, i }));
  // stable sort descending
  arr.sort((a,b)=> {
    if(b.v !== a.v) return b.v - a.v;
    return a.i - b.i;
  });
  const marks = ['◎','○','△','✕','ー','ー'];
  const out = Array(6).fill('ー');
  arr.forEach((it, idx) => {
    out[it.i] = marks[idx] || 'ー';
  });
  return out;
}

/* ---------- render race detail ---------- */
function renderRace(){
  showScreen('race');
  const venue = (STATE.data && STATE.data.venues.find(x=> x.id === STATE.venueId));
  const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) || venue.races || [];
  const race = racesForVenue.find(r => (r.number || r.no) === STATE.raceNo);
  if(!race){
    alert('レースデータがありません');
    renderRaces();
    return;
  }

  E('#raceTitle').textContent = `${venue.name} ${race.number || race.no}R`;

  // env pills
  const env = race.env || {};
  E('#envPills').innerHTML = `
    <div class="pill">発走 ${race.startTime || '-'}</div>
    <div class="pill">風向 ${env.windDir || '-'}</div>
    <div class="pill">風速 ${env.windSpeed ?? '-'} m/s</div>
    <div class="pill">波高 ${env.wave ?? '-'} cm</div>
  `;

  const entries = (race.entries || []).slice(0,6);
  // prepare ranking arrays based on two-rate (2連対率) for each metric
  const localVals = entries.map(e => Number(e.local2) || 0);
  const motorVals = entries.map(e => Number(e.motor2) || 0);
  const courseVals = entries.map(e => Number(e.course2) || 0);
  const localSymbols = produceSymbols(localVals);
  const motorSymbols = produceSymbols(motorVals);
  const courseSymbols = produceSymbols(courseVals);

  // build table rows
  entryTableBody.innerHTML = '';
  for(let i=0;i<6;i++){
    const e = entries[i] || {};
    const lane = e.lane || (i+1);
    const klass = e.class || '-';
    const name = e.name || '-';
    const st = (typeof e.avgST === 'number') ? e.avgST.toFixed(2) : (e.avgST ?? '-');
    const f = e.f || (e.f === 0 ? '0' : '-');

    const tr = document.createElement('tr');
    tr.className = `row-${lane}`;
    // metric cells: symbol (◎○△✕ー), 2連%, 3連%
    const localCell = `
      <div><span class="metric-symbol ${localSymbols[i]==='◎' ? 'top' : ''}">${localSymbols[i]}</span></div>
      <div class="metric-small">${(e.local2!=null)? e.local2 + '%' : '-'}</div>
      <div class="metric-small">${(e.local3!=null)? e.local3 + '%' : '-'}</div>
    `;
    const motorCell = `
      <div><span class="metric-symbol ${motorSymbols[i]==='◎' ? 'top' : ''}">${motorSymbols[i]}</span></div>
      <div class="metric-small">${(e.motor2!=null)? e.motor2 + '%' : '-'}</div>
      <div class="metric-small">${(e.motor3!=null)? e.motor3 + '%' : '-'}</div>
    `;
    const courseCell = `
      <div><span class="metric-symbol ${courseSymbols[i]==='◎' ? 'top' : ''}">${courseSymbols[i]}</span></div>
      <div class="metric-small">${(e.course2!=null)? e.course2 + '%' : '-'}</div>
      <div class="metric-small">${(e.course3!=null)? e.course3 + '%' : '-'}</div>
    `;

    // compute overall rank by summing normalized scores (local2+motor2+course2)
    const score = (Number(e.local2)||0) + (Number(e.motor2)||0) + (Number(e.course2)||0);
    // We'll display a mark by rank later after preparing all scores
    tr.innerHTML = `
      <td class="mono">${lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${klass}</div>
          <div class="name">${name}</div>
          <div class="st">ST: ${st}</div>
        </div>
      </td>
      <td>${(e.f && e.f !== '-') ? e.f : '-'}</td>
      <td>${localCell}</td>
      <td>${motorCell}</td>
      <td>${courseCell}</td>
      <td data-score="${score}" class="eval-col"></td>
    `;
    entryTableBody.appendChild(tr);
  }

  // compute overall ranking marks (◎ ○ △ ✕ ー ー) by score attribute
  const evalRows = Array.from(entryTableBody.querySelectorAll('tr')).map((tr, idx) => {
    const s = Number(tr.querySelector('.eval-col').getAttribute('data-score')) || 0;
    return { idx, s, tr };
  });
  evalRows.sort((a,b)=> b.s - a.s);
  const marks = ['◎','○','△','✕','ー','ー'];
  evalRows.forEach((it, rank) => {
    const mark = marks[rank] || 'ー';
    const cell = it.tr.querySelector('.eval-col');
    const cls = (mark === '◎') ? 'metric-symbol top' : 'metric-symbol';
    cell.innerHTML = `<span class="${cls}">${mark}</span>`;
  });

  // AI predictions
  aiMainBody.innerHTML = '';
  aiSubBody.innerHTML = '';
  const aiMain = (race.ai && race.ai.main) ? race.ai.main.slice(0,5) : (race.predictions ? race.predictions.slice(0,5) : []);
  const aiSub = (race.ai && race.ai.sub) ? race.ai.sub.slice(0,5) : [];
  aiMain.forEach(p=>{
    const tr = document.createElement('tr');
    const bet = p.bet || p.buy || '-';
    const prob = (p.probability != null) ? `${p.probability}%` : (p.rate!=null? `${p.rate}%` : '-');
    tr.innerHTML = `<td style="text-align:left;padding:8px">${bet}</td><td style="width:80px;text-align:right;padding:8px">${prob}</td>`;
    aiMainBody.appendChild(tr);
  });
  // fill up to 5 rows if less
  while(aiMainBody.children.length < 5){
    const tr = document.createElement('tr'); tr.innerHTML = `<td style="text-align:left;padding:8px">-</td><td style="text-align:right;padding:8px">-</td>`;
    aiMainBody.appendChild(tr);
  }
  aiSub.forEach(p=>{
    const tr = document.createElement('tr');
    const bet = p.bet || p.buy || '-';
    const prob = (p.probability != null) ? `${p.probability}%` : (p.rate!=null? `${p.rate}%` : '-');
    tr.innerHTML = `<td style="text-align:left;padding:8px">${bet}</td><td style="width:80px;text-align:right;padding:8px">${prob}</td>`;
    aiSubBody.appendChild(tr);
  });
  while(aiSubBody.children.length < 5){
    const tr = document.createElement('tr'); tr.innerHTML = `<td style="text-align:left;padding:8px">-</td><td style="text-align:right;padding:8px">-</td>`;
    aiSubBody.appendChild(tr);
  }

  // comments (1..6)
  commentTbody.innerHTML = '';
  const comments = race.comments || [];
  for(let i=1;i<=6;i++){
    const c = (comments.find(x=> Number(x.no)===i) || {}).text || '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i}コース</td><td style="text-align:left;padding-left:10px">${c}</td>`;
    commentTbody.appendChild(tr);
  }

  // back
  E('#backToRaces').onclick = ()=> { STATE.screen = 'races'; renderRaces(); };
}

/* ---------- boot ---------- */
async function render(){
  if(!STATE.data){ await loadData(false); }
  if(!STATE.data){ // still no data
    E('#venuesGrid').innerHTML = '<div class="card">データがありません</div>';
    return;
  }
  if(STATE.screen === 'venues') renderVenues();
  else if(STATE.screen === 'races') renderRaces();
  else renderRace();
}

(async ()=>{
  await loadData(false);
  render();
})();