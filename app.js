// app.js (完全版用)
const DATA_URL = './data.json'; // 必要に応じて GitHub Pages のフル URL に変更

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
let CURRENT_MODE = 'today'; // today / yesterday
let CURRENT_VENUE_ID = null;
let CURRENT_RACE_NO = null;

// util
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

// load data (expecting structure: { updated: "...", races: { programs: [ ... ] } })
async function loadData(force=false){
  try{
    const url = DATA_URL + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, {cache: 'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    // normalize
    let progs = null;
    if(json && json.races && Array.isArray(json.races.programs)) progs = json.races.programs;
    else if(Array.isArray(json.programs)) progs = json.programs;
    else if(Array.isArray(json)) progs = json;
    if(!progs) throw new Error('JSON構造違い: programs または races.programs を期待');
    ALL_PROGRAMS = progs;
    // header date
    const d = new Date();
    dateLabel.textContent = formatToDisplay(d.toISOString());
    renderVenues();
    return true;
  }catch(err){
    console.error('データ読み込み失敗', err);
    venuesGrid.innerHTML = `<div class="card">データ取得エラー: ${err.message}</div>`;
    return false;
  }
}

// venues -> always 24
function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML = '';
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  // which stadium numbers have races on targetDate
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
    const rate = document.createElement('div'); rate.className='v-rate'; rate.textContent = '--%';

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

// render 1..12
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

// render single race detail per spec
function renderRaceDetail(venueId, raceNo){
  showScreen('race');
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  const prog = ALL_PROGRAMS.find(p => p.race_date===targetDate && p.race_stadium_number===venueId && Number(p.race_number)===Number(raceNo));
  if(!prog){ alert('レースデータがありません'); renderRaces(venueId); return; }

  raceTitle.textContent = `${VENUE_NAMES[venueId-1] || venueId} ${raceNo}R ${prog.race_title || ''}`;

  // boats sorted by boat number
  const boats = Array.isArray(prog.boats) ? prog.boats.slice().sort((a,b)=> (a.racer_boat_number||0)-(b.racer_boat_number||0)) : [];

  // render entry table rows
  entryTableBody.innerHTML = '';
  for(let i=1;i<=6;i++){
    const b = boats.find(x => (x.racer_boat_number||i) === i) || null;
    const klass = b && (b.racer_class_number ? (['','A1','A2','B1','B2'][b.racer_class_number] || '-') : (b.racer_class || '-')) || '-';
    const name = b ? (b.racer_name || '-') : '-';
    const st = b && (typeof b.racer_average_start_timing === 'number' ? b.racer_average_start_timing : (b.racer_average_start_timing ? Number(b.racer_average_start_timing) : null));
    const stText = (st != null) ? `ST:${st.toFixed(2)}` : 'ST:-';
    const fcount = b ? Number(b.racer_flying_count || 0) : 0;
    const fText = fcount>0 ? `F${fcount}` : 'ー';
    const local = b && (b.racer_local_top_1_percent ? b.racer_local_top_1_percent : (b.racer_local_win_rate ?? null));
    const motor = b && (b.racer_assigned_motor_top_2_percent ? b.racer_assigned_motor_top_2_percent : (b.racer_motor_win_rate ?? null));
    const course = b && (b.racer_assigned_boat_top_2_percent ? b.racer_assigned_boat_top_2_percent : (b.racer_course_win_rate ?? null));

    // compute evaluation: inverse ST × F penalty × each rate (treat % /100); use fallback defaults
    const stScore = st ? (1/(st || 0.3)) : 1;
    const fScore = (fcount>0) ? 0.7 : 1.0;
    const localScore = (typeof local === 'number') ? (local/100) : 1.0;
    const motorScore = (typeof motor === 'number') ? (motor/100) : 1.0;
    const courseScore = (typeof course === 'number') ? (course/100) : 1.0;
    const rawScore = stScore * fScore * localScore * motorScore * courseScore * 100;

    let mark = 'ー';
    if(rawScore >= 40) mark = '◎';
    else if(rawScore >= 25) mark = '○';
    else if(rawScore >= 15) mark = '△';
    else if(rawScore >= 8) mark = '✕';
    else mark = 'ー';

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
      <td>${(typeof local==='number') ? (local + '%') : '-'}</td>
      <td>${(typeof motor==='number') ? (motor + '%') : '-'}</td>
      <td>${(typeof course==='number') ? (course + '%') : '-'}</td>
      <td><div class="${markClass} ${mark==='◎' ? 'top':''}">${mark}</div></td>
    `;
    entryTableBody.appendChild(tr);
  }

  // AI predictions (simple heuristic ranking)
  const scored = boats.map(b=>{
    const st = (typeof b.racer_average_start_timing === 'number') ? b.racer_average_start_timing : 0.25;
    const fcount = Number(b.racer_flying_count || 0);
    const local = (b.racer_local_top_1_percent || b.racer_local_win_rate || 30);
    const motor = (b.racer_assigned_motor_top_2_percent || b.racer_motor_win_rate || 30);
    const course = (b.racer_assigned_boat_top_2_percent || b.racer_course_win_rate || 30);
    const stScore = st ? (1/(st||0.3)) : 1;
    const fScore = (fcount > 0) ? 0.7 : 1.0;
    const score = stScore * fScore * (local/100) * (motor/100) * (course/100);
    return { b, score };
  });
  scored.sort((a,b)=> b.score - a.score);

  // picks (top 6 boats numbers)
  const picks = scored.slice(0,6).map(s=> s.b.racer_boat_number || '?');
  // make combinations for main and sub lists (simple unique generation)
  const main = []; const sub = [];
  const used = new Set();
  function pushBet(list,a,b,c,prob){
    const key = `${a}-${b}-${c}`;
    if(used.has(key)) return;
    used.add(key);
    list.push({bet:key, prob: Math.max(0, Math.round(prob))});
  }
  for(let i=0;i<picks.length;i++){
    for(let j=0;j<picks.length;j++){
      for(let k=0;k<picks.length;k++){
        if(i===j||j===k||i===k) continue;
        const weight = (scored[i]?.score||0)*3 + (scored[j]?.score||0)*1.5 + (scored[k]?.score||0);
        if(main.length < 5) pushBet(main, picks[i], picks[j], picks[k], weight*150);
        else if(sub.length < 5) pushBet(sub, picks[i], picks[j], picks[k], weight*80);
        if(main.length>=5 && sub.length>=5) break;
      }
      if(main.length>=5 && sub.length>=5) break;
    }
    if(main.length>=5 && sub.length>=5) break;
  }
  while(main.length<5) main.push({bet:'-', prob:0});
  while(sub.length<5) sub.push({bet:'-', prob:0});

  // render AI tables
  aiMainBody && (aiMainBody.innerHTML = '');
  aiSubBody && (aiSubBody.innerHTML = '');
  main.forEach(it=>{
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${it.bet}</td><td class="mono">${it.prob}%</td>`; aiMainBody.appendChild(tr);
  });
  while(aiMainBody.children.length < 5){
    const tr = document.createElement('tr'); tr.innerHTML = `<td>-</td><td class="mono">-</td>`; aiMainBody.appendChild(tr);
  }
  sub.forEach(it=>{
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${it.bet}</td><td class="mono">${it.prob}%</td>`; aiSubBody.appendChild(tr);
  });
  while(aiSubBody.children.length < 5){
    const tr = document.createElement('tr'); tr.innerHTML = `<td>-</td><td class="mono">-</td>`; aiSubBody.appendChild(tr);
  }

  // comments: for lanes 1..6 - newspaper style (simple rules / random phrasing)
  commentTableBody.innerHTML = '';
  for(let lane=1; lane<=6; lane++){
    const b = boats.find(x => (x.racer_boat_number||lane) === lane) || null;
    let text = 'データなし';
    if(b){
      const st = b.racer_average_start_timing ?? null;
      const motor = b.racer_assigned_motor_top_2_percent ?? b.racer_motor_win_rate ?? null;
      const local = b.racer_local_top_1_percent ?? b.racer_local_win_rate ?? null;
      const parts = [];
      if(st != null && st <= 0.13) parts.push('今節のST絶好調');
      if(motor != null && motor >= 50) parts.push('MTの仕上がり良好');
      if(local != null && local >= 50) parts.push('当地実績高い');
      if(parts.length===0) parts.push('目立った長所は少ないが総合力で勝負');
      const inMain = main.some(m => m.bet.split('-').includes(String(lane)));
      const inSub = sub.some(s => s.bet.split('-').includes(String(lane)));
      const reason = inMain ? '（本命に含む）' : (inSub ? '（穴候補）' : '');
      // produce short newspaper-like sentence
      text = `${lane}コース：${parts.join('、')}。${reason} ST:${st != null ? st.toFixed(2) : '-'} MT:${motor != null ? motor : '-'} 地:${local != null ? local : '-'}`;
      // truncate / adjust phrasing a bit for readability
      text = text.replace(/。$/,'！');
    }
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${lane}コース</td><td style="text-align:left">${text}</td>`; commentTableBody.appendChild(tr);
  }
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