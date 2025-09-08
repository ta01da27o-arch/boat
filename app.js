// app.js (ES module)
const STATE = { data: null, screen: 'venues', venueId: null, raceNo: null };

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const todayLabel = $('#todayLabel');
const globalHit = $('#globalHit');
const refreshBtn = $('#refreshBtn');

refreshBtn.addEventListener('click', async () => {
  await loadData(true);
  render();
});

async function loadData(force=false){
  try{
    const url = './data.json' + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const txt = await res.text();
    if(txt.trim().startsWith('<')) throw new Error('data.json が見つかりません（HTML 返却）');
    STATE.data = JSON.parse(txt);
    todayLabel.textContent = STATE.data.date ? new Date(STATE.data.date).toLocaleDateString('ja-JP') : new Date().toLocaleDateString();
    globalHit.textContent = (STATE.data.ai_accuracy!=null) ? `${STATE.data.ai_accuracy}%` : '--%';
    return true;
  }catch(e){
    STATE.data = null;
    alert('データ取得エラー: ' + e.message);
    console.error(e);
    return false;
  }
}

function showScreen(name){
  STATE.screen = name;
  $$('.screen').forEach(s=> s.classList.remove('active'));
  $(`#screen-${name}`).classList.add('active');
}

/* ---------- render venues (4x6) ---------- */
function renderVenues(){
  showScreen('venues');
  const grid = $('#venuesGrid');
  grid.innerHTML = '';

  // ensure venues array length 24 (fill placeholders if missing)
  const venues = (STATE.data && STATE.data.venues) ? STATE.data.venues.slice() : [];
  while(venues.length < 24) venues.push({ id: `placeholder-${venues.length+1}`, name: `-`, hasRacesToday:false, rate: 0, status: '本日なし' });

  for(const v of venues.slice(0,24)){
    const div = document.createElement('div');
    div.className = 'venue';
    // background fixed light blue
    div.style.background = 'linear-gradient(180deg, rgba(230,246,255,1), rgba(220,240,255,0.9))';

    const name = document.createElement('div');
    name.className = 'vname';
    name.textContent = v.name || '-';

    const vstatus = document.createElement('div');
    vstatus.className = 'vstatus';
    vstatus.textContent = v.hasRacesToday ? '開催中' : '本日なし';

    const hit = document.createElement('div');
    hit.className = 'vhit';
    hit.textContent = (v.rate != null) ? `${v.rate}%` : '--%';

    div.appendChild(name);
    div.appendChild(vstatus);
    div.appendChild(hit);

    const btn = document.createElement('button');
    btn.className = 'venue-btn';
    btn.textContent = v.hasRacesToday ? '表示' : '表示';
    if(v.hasRacesToday){
      btn.addEventListener('click', ()=>{
        STATE.venueId = v.id;
        showRaces();
      });
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.7';
    }
    div.appendChild(btn);

    grid.appendChild(div);
  }
}

/* ---------- Races screen (3x4) ---------- */
function showRaces(){
  if(!STATE.data) return;
  const venue = STATE.data.venues.find(x => String(x.id) === String(STATE.venueId));
  if(!venue){ alert('場データがありません'); return; }
  $('#venueName').textContent = venue.name;
  showScreen('races');

  const grid = $('#racesGrid');
  grid.innerHTML = '';
  // build 1..12 fixed positions
  const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) ? STATE.data.races[venue.id] : (venue.races || []);
  for(let no=1; no<=12; no++){
    const btn = document.createElement('button');
    btn.className = 'race-btn';
    btn.textContent = `${no}R`;
    const found = racesForVenue.find(r => (r.number || r.no) === no);
    if(found){
      btn.addEventListener('click', ()=>{
        STATE.raceNo = no;
        showRace();
      });
    } else {
      btn.classList.add('off');
      btn.disabled = true;
    }
    grid.appendChild(btn);
  }

  $('#backToVenues').onclick = ()=>{ STATE.venueId = null; render(); };
}

/* symbol generator for ranking */
function produceSymbols(values){
  // values: array length up to 6
  const arr = values.map((v,i)=>({v: Number(v)||0, i}));
  arr.sort((a,b)=> b.v - a.v);
  const marks = ['◎','○','△','✕','ー','ー'];
  const out = Array(6).fill('ー');
  arr.forEach((it, idx) => { out[it.i] = marks[idx] || 'ー'; });
  return out;
}

/* ---------- Race detail ---------- */
function showRace(){
  if(!STATE.data) return;
  const venue = STATE.data.venues.find(x => String(x.id) === String(STATE.venueId));
  const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) ? STATE.data.races[venue.id] : (venue.races || []);
  const race = racesForVenue.find(r => (r.number || r.no) === STATE.raceNo);
  if(!race){ alert('レースデータなし'); return; }

  $('#raceTitle').textContent = `${venue.name} ${STATE.raceNo}R`;
  showScreen('race');

  // env
  const env = race.env || {};
  $('#envPills').innerHTML = `<span class="pill">風向 ${env.windDir || '-'}</span> <span class="pill">風速 ${env.windSpeed ?? '-'} m/s</span> <span class="pill">波高 ${env.wave ?? '-'} cm</span>`;

  // entries
  const entries = race.entries || [];
  // Use first element of local/motor/course arrays as 2連対率, and third as 3連対率? We'll assume [2連,3連,...] but sample provides both. We'll display index0 as 2連, index1 as 3連 for simplicity.
  const localVals = entries.map(e => Array.isArray(e.local) ? Number(e.local[0]) : Number(e.local) || 0);
  const motorVals = entries.map(e => Array.isArray(e.motor) ? Number(e.motor[0]) : Number(e.motor) || 0);
  const courseVals = entries.map(e => Array.isArray(e.course) ? Number(e.course[0]) : Number(e.course) || 0);

  const localSym = produceSymbols(localVals);
  const motorSym = produceSymbols(motorVals);
  const courseSym = produceSymbols(courseVals);

  const tbody = document.querySelector('#entryTable tbody');
  tbody.innerHTML = '';

  for(let i=0;i<6;i++){
    const e = entries[i] || { waku:i+1, class:'-', name:'-', st:'-', f:'', local:[0,0], motor:[0,0], course:[0,0], overall: '-' };
    const local2 = (e.local && e.local[0]!=null) ? `${e.local[0]}%` : '-';
    const local3 = (e.local && e.local[1]!=null) ? `${e.local[1]}%` : '-';
    const motor2 = (e.motor && e.motor[0]!=null) ? `${e.motor[0]}%` : '-';
    const motor3 = (e.motor && e.motor[1]!=null) ? `${e.motor[1]}%` : '-';
    const course2 = (e.course && e.course[0]!=null) ? `${e.course[0]}%` : '-';
    const course3 = (e.course && e.course[1]!=null) ? `${e.course[1]}%` : '-';

    const overall = e.overall || '-';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${e.waku}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${e.class || '-'}</div>
          <div class="name">${e.name || '-'}</div>
          <div class="st">ST: ${(typeof e.st === 'number') ? e.st.toFixed(2) : e.st}</div>
        </div>
      </td>
      <td>${e.f || '-'}</td>
      <td><div><span class="${localSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${localSym[i]}</span></div><div>${local2}</div><div>${local3}</div></td>
      <td><div><span class="${motorSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${motorSym[i]}</span></div><div>${motor2}</div><div>${motor3}</div></td>
      <td><div><span class="${courseSym[i]==='◎' ? 'symbol-top' : 'symbol'}">${courseSym[i]}</span></div><div>${course2}</div><div>${course3}</div></td>
      <td>${overall}</td>
    `;
    tbody.appendChild(tr);
  }

  // AI main & sub
  const mainBody = $('#aiMain tbody'); mainBody.innerHTML = '';
  const subBody = $('#aiSub tbody'); subBody.innerHTML = '';
  const aiMain = (race.ai && race.ai.main) ? race.ai.main.slice(0,5) : (race.predictions || []).slice(0,5);
  const aiSub  = (race.ai && race.ai.sub)  ? race.ai.sub.slice(0,5) : [];
  aiMain.forEach(item=>{
    const bet = item.bet || item.buy || '-';
    const prob = (item.rate ?? item.probability) != null ? `${item.rate ?? item.probability}%` : '-';
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${bet}</td><td class="mono">${prob}</td>`;
    mainBody.appendChild(tr);
  });
  aiSub.forEach(item=>{
    const bet = item.bet || item.buy || '-';
    const prob = (item.rate ?? item.probability) != null ? `${item.rate ?? item.probability}%` : '-';
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${bet}</td><td class="mono">${prob}</td>`;
    subBody.appendChild(tr);
  });

  // comments
  const commentTbody = $('#commentTable tbody'); commentTbody.innerHTML = '';
  const comments = race.comments || [];
  for(let i=1;i<=6;i++){
    const c = (comments.find(x=>Number(x.no)===i) || {}).text || '-';
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${i}コース</td><td>${c}</td>`;
    commentTbody.appendChild(tr);
  }

  $('#backToRaces').onclick = ()=>{ STATE.screen='races'; render(); };
}

/* ---------- render dispatcher ---------- */
function render(){
  if(!STATE.data){ $('#screen-venues').innerHTML = '<div class="card">データがありません</div>'; return; }
  if(STATE.screen === 'venues') renderVenues();
  else if(STATE.screen === 'races') showRaces();
  else if(STATE.screen === 'race') showRace();
}

/* ---------- init ---------- */
(async ()=>{
  await loadData(false);
  render();
})();