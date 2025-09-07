// app.js
const STATE = {
  data: null,
  screen: 'venues', // 'venues'|'races'|'race'
  venueId: null,
  raceNo: null
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const todayLabel = $('#todayLabel');
const globalHit = $('#globalHit');
const refreshBtn = $('#refreshBtn');

const venuesGrid = $('#venuesGrid');
const racesGrid = $('#racesGrid');
const entryTableBody = document.querySelector('#entryTable tbody');
const aiMainBody = document.querySelector('#aiMain tbody');
const aiSubBody = document.querySelector('#aiSub tbody');
const commentTableBody = document.querySelector('#commentTable tbody');
const envPills = $('#envPills');

const SCREENS = {
  venues: $('#screen-venues'),
  races: $('#screen-races'),
  race: $('#screen-race')
};

function showScreen(name){
  Object.values(SCREENS).forEach(s=>s.classList.remove('active'));
  SCREENS[name].classList.add('active');
  STATE.screen = name;
}

async function loadData(force=false){
  try{
    const url = './data.json' + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const txt = await res.text();
    if(txt.trim().startsWith('<')) throw new Error('data.json not found (HTML returned)');
    STATE.data = JSON.parse(txt);
    // header
    todayLabel.textContent = STATE.data.date ? new Date(STATE.data.date).toLocaleDateString() : new Date().toLocaleDateString();
    globalHit.textContent = (STATE.data.ai_accuracy!=null) ? `${STATE.data.ai_accuracy}%` : '--%';
    return true;
  }catch(err){
    alert('データ取得エラー: ' + (err.message || err));
    console.error(err);
    return false;
  }
}

// Ensure 24 venues order ; fill placeholders if missing
function get24Venues(){
  const baseOrder = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑","津","三国",
    "琵琶湖","住之江","尼崎","鳴門","丸亀","児島","宮島","徳山","下関","若松",
    "芦屋","福岡","唐津","大村"
  ];
  const map = {};
  (STATE.data.venues || []).forEach(v => { map[v.id || v.name] = v; map[v.name] = v; });
  const out = baseOrder.map(name => {
    const v = map[name];
    if(v) return v;
    return { id: name, name: name, hasRacesToday:false, hitRate: null, races: [] };
  });
  return out;
}

// render venues grid 4x6
function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML = '';
  const list = get24Venues();
  list.forEach(v=>{
    const card = document.createElement('div');
    card.className = 'venue-card' + (v.hasRacesToday ? '' : ' disabled');
    // required display: name (上段), "開催中"/"本日なし" (中段), 的中率% (下段)
    const statusText = v.hasRacesToday ? '開催中' : '本日なし';
    const hitText = (v.hitRate!=null) ? `${v.hitRate}%` : '--%';
    card.innerHTML = `<div class="name">${v.name}</div><div class="status">${statusText}</div><div class="rate">${hitText}</div>`;
    // click only when hasRacesToday
    if(v.hasRacesToday){
      card.addEventListener('click', ()=>{
        STATE.venueId = v.id || v.name;
        renderRaces();
        showScreen('races');
      });
    }
    venuesGrid.appendChild(card);
  });
}

// render races grid 3x4 (12 races)
function renderRaces(){
  showScreen('races');
  racesGrid.innerHTML = '';
  const venue = findVenueById(STATE.venueId);
  $('#venueName').textContent = venue ? venue.name : '';
  const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) || (venue.races || []);
  // build 1..12
  for(let i=1;i<=12;i++){
    const btn = document.createElement('div');
    const found = racesForVenue.find(r => (r.number||r.no) === i);
    btn.className = 'race-card' + (found ? '' : ' off');
    btn.textContent = i + 'R';
    if(found){
      btn.addEventListener('click', ()=>{
        STATE.raceNo = i;
        renderRace();
        showScreen('race');
      });
    }
    racesGrid.appendChild(btn);
  }
  $('#backToVenues').onclick = ()=>{
    STATE.venueId = null;
    showScreen('venues');
  };
}

// utility
function findVenueById(id){
  if(!STATE.data) return null;
  return (STATE.data.venues || []).find(v => String(v.id) === String(id) || v.name === id) || get24Venues().find(v=>v.name===id);
}

// produce ◎○△✕ー ranking for length-6 arrays: highest -> ◎ (red), others black
function produceSymbols(values){
  // values length 6 numeric
  const arr = values.map((v,i)=>({v: Number(v)||0, i}));
  arr.sort((a,b)=> b.v - a.v);
  const marks = ['◎','○','△','✕','ー','ー'];
  const out = Array(6).fill('ー');
  arr.forEach((it, idx)=> out[it.i] = marks[idx] || 'ー');
  return out;
}

function renderRace(){
  showScreen('race');
  const venue = findVenueById(STATE.venueId);
  const racesForVenue = (STATE.data.races && STATE.data.races[venue.id]) || (venue.races || []);
  const race = racesForVenue.find(r => (r.number||r.no) === STATE.raceNo);
  if(!race){
    alert('選択レースのデータがありません');
    STATE.screen = 'races';
    renderRaces();
    return;
  }
  $('#raceTitle').textContent = `${venue.name} ${STATE.raceNo}R`;
  // env
  const env = race.env || {};
  envPills.innerHTML = `<span class="pill">風向 ${env.windDir ?? '-'}</span> <span class="pill">風速 ${env.windSpeed ?? '-'} m/s</span> <span class="pill">波高 ${env.wave ?? '-'} cm</span>`;

  const entries = race.entries || [];
  // prepare ranking arrays: use first element of arrays if arrays provided
  const localVals = entries.map(e => Array.isArray(e.local) ? Number(e.local[0]) : Number(e.local||0));
  const motorVals = entries.map(e => Array.isArray(e.motor) ? Number(e.motor[0]) : Number(e.motor||0));
  const courseVals = entries.map(e => Array.isArray(e.course) ? Number(e.course[0]) : Number(e.course||0));
  const localSym = produceSymbols(localVals);
  const motorSym = produceSymbols(motorVals);
  const courseSym = produceSymbols(courseVals);

  // entries table
  entryTableBody.innerHTML = '';
  for(let i=0;i<6;i++){
    const e = entries[i] || {waku:i+1, class:'-', name:'-', st:'-', f:'', local:[0], motor:[0], course:[0]};
    const tr = document.createElement('tr');
    const localVal = localVals[i] || 0;
    const motorVal = motorVals[i] || 0;
    const courseVal = courseVals[i] || 0;
    // symbol classes
    const localClass = localSym[i] === '◎' ? 'symbol-top' : 'symbol';
    const motorClass = motorSym[i] === '◎' ? 'symbol-top' : 'symbol';
    const courseClass = courseSym[i] === '◎' ? 'symbol-top' : 'symbol';
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
      <td><span class="${localClass}">${localSym[i]}</span>${localVal}%</td>
      <td><span class="${motorClass}">${motorSym[i]}</span>${motorVal}%</td>
      <td><span class="${courseClass}">${courseSym[i]}</span>${courseVal}%</td>
    `;
    entryTableBody.appendChild(tr);
  }

  // AI main & sub
  aiMainBody.innerHTML = '';
  aiSubBody.innerHTML = '';
  const aiMain = (race.ai && race.ai.main) || (race.predictions || []).slice(0,5);
  const aiSub = (race.ai && race.ai.sub) || [];
  aiMain.slice(0,5).forEach(item=>{
    // item can be {bet,rate} or {buy,probability,odds}
    const bet = item.bet || item.buy || item.buyName || '-';
    const rate = (item.rate ?? item.probability) != null ? `${item.rate ?? item.probability}%` : '-';
    const odds = item.odds ? ` / ${item.odds}倍` : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${bet}</td><td class="mono">${rate}${odds}</td>`;
    aiMainBody.appendChild(tr);
  });
  aiSub.slice(0,5).forEach(item=>{
    const bet = item.bet || item.buy || '-';
    const rate = (item.rate ?? item.probability) != null ? `${item.rate ?? item.probability}%` : '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${bet}</td><td class="mono">${rate}</td>`;
    aiSubBody.appendChild(tr);
  });

  // comments per course
  commentTableBody.innerHTML = '';
  const comments = race.comments || [];
  for(let i=1;i<=6;i++){
    const c = (comments.find(x=>Number(x.no)===i) || {}).text || '-';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i}コース</td><td class="comment-cell">${c}</td>`;
    commentTableBody.appendChild(tr);
  }

  // back handlers
  $('#backToRaces').onclick = ()=>{
    showScreen('races');
  };
}

// events
refreshBtn.addEventListener('click', async ()=> {
  await loadData(true);
  renderVenues();
});

// initial boot
(async ()=>{
  const ok = await loadData(false);
  if(ok) renderVenues();
  else {
    // show empty 24-grid placeholders if no data (still keep UI)
    STATE.data = { venues: [], races: {} };
    renderVenues();
  }
})();