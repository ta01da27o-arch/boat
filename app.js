/* app.js
 - 想定 data.json structure:
   { "updated": "...", "races": { "programs": [ { race_date, race_stadium_number, race_number, race_closed_at, boats: [ { racer_boat_number, racer_name, racer_average_start_timing, racer_flying_count, racer_national_top_1_percent, ... , motor_win_rate?, course_win_rate?, local_win_rate? } ] } ] } }
 - If your data.json is at /boat/data.json on GitHub Pages, set DATA_URL accordingly.
*/

const DATA_URL = './data.json'; // <-- 必要なら "https://<ユーザ>.github.io/boat/data.json" に変更
const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

// DOMs
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
let ALL_PROGRAMS = []; // array of program objects (flat)
let CURRENT_DATE = getIsoDate(new Date()); // YYYY-MM-DD
let CURRENT_MODE = 'today'; // today / yesterday
let CURRENT_VENUE_ID = null;
let CURRENT_RACE_NO = null;

// --- helpers ---
function getIsoDate(d){ return d.toISOString().slice(0,10); }
function formatToDisplay(dstr){
  try { const d = new Date(dstr); return d.toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });}
  catch(e){ return dstr; }
}
function ensureProgramsFromJson(json){
  if(json && json.races && Array.isArray(json.races.programs)) return json.races.programs;
  if(Array.isArray(json)) return json;
  return null;
}

// --- load data ---
async function loadData(force=false){
  try{
    const url = DATA_URL + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, {cache: 'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    const progs = ensureProgramsFromJson(json);
    if(!progs) throw new Error('JSON構造違い: races.programs を期待');
    ALL_PROGRAMS = progs;

    // update header date label to CURRENT_DATE in readable form
    const d = (CURRENT_MODE === 'today') ? new Date() : (function(){const dd=new Date(); dd.setDate(dd.getDate()-1); return dd;})();
    dateLabel.textContent = formatToDisplay(d.toISOString());

    renderVenues();
    return true;
  }catch(err){
    console.error('データ読み込み失敗', err);
    venuesGrid.innerHTML = `<div class="card">データ取得エラー: ${err.message}</div>`;
    return false;
  }
}

// --- UI helpers & renderers ---
function showScreen(name){
  SCREEN_VENUES.classList.remove('active');
  SCREEN_RACES.classList.remove('active');
  SCREEN_RACE.classList.remove('active');
  if(name==='venues') SCREEN_VENUES.classList.add('active');
  if(name==='races') SCREEN_RACES.classList.add('active');
  if(name==='race') SCREEN_RACE.classList.add('active');
}

// Build venues grid - always 24 fixed
function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML = '';
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  // determine which venues have races today
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

// Render races 1..12 grid for selected venue (disable buttons missing)
function renderRaces(venueId){
  showScreen('races');
  CURRENT_VENUE_ID = venueId;
  venueTitle.textContent = VENUE_NAMES[venueId-1] || `場 ${venueId}`;
  racesGrid.innerHTML = '';

  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  const progs = ALL_PROGRAMS.filter(p => p.race_date === targetDate && p.race_stadium_number === venueId);

  // map races existing numbers
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

// Render single race detail
function renderRaceDetail(venueId, raceNo){
  showScreen('race');
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  const prog = ALL_PROGRAMS.find(p => p.race_date===targetDate && p.race_stadium_number===venueId && Number(p.race_number)===Number(raceNo));
  if(!prog){ alert('レースデータがありません'); renderRaces(venueId); return; }

  raceTitle.textContent = `${VENUE_NAMES[venueId-1] || venueId} ${raceNo}R ${prog.race_title || ''}`;

  // prepare boats array (ensure sorted by racer_boat_number)
  const boats = Array.isArray(prog.boats) ? prog.boats.slice().sort((a,b)=> (a.racer_boat_number||0)-(b.racer_boat_number||0)) : [];

  // render table rows
  entryTableBody.innerHTML = '';
  boats.forEach((b, idx)=>{
    const lane = b.racer_boat_number || (idx+1);
    const tr = document.createElement('tr');
    tr.className = `row-${lane} lane-${lane}`;

    // compute values with fallbacks
    const st = (typeof b.racer_average_start_timing === 'number') ? b.racer_average_start_timing : (b.racer_average_start_timing ? Number(b.racer_average_start_timing) : null);
    const fcount = Number(b.racer_flying_count || 0);
    const local = (b.local_win_rate != null) ? Number(b.local_win_rate) : (b.racer_local_win_rate != null ? Number(b.racer_local_win_rate) : null);
    const motor = (b.motor_win_rate != null) ? Number(b.motor_win_rate) : (b.racer_motor_win_rate != null ? Number(b.racer_motor_win_rate) : null);
    const course = (b.course_win_rate != null) ? Number(b.course_win_rate) : (b.racer_course_win_rate != null ? Number(b.racer_course_win_rate) : null);

    // evaluation score per spec: ST × F有無 ×当地勝率×MT×コース
    // normalize: ST small is good -> invert by (1/st)
    const stScore = st ? (1 / (st || 0.3)) : 1;
    const fScore = (fcount > 0) ? 0.7 : 1.0; // penalty if F exists
    const localScore = local ? (local/100) : 1.0;
    const motorScore = motor ? (motor/100) : 1.0;
    const courseScore = course ? (course/100) : 1.0;

    const rawScore = stScore * fScore * localScore * motorScore * courseScore * 100; // scale

    // map rawScore to mark
    let mark = 'ー';
    if(rawScore >= 40) mark = '◎';
    else if(rawScore >= 25) mark = '○';
    else if(rawScore >= 15) mark = '△';
    else if(rawScore >= 8) mark = '✕';
    else mark = 'ー';

    // symbol color class
    const markClass = (mark === '◎') ? 'metric-symbol top' : 'metric-symbol';

    // player block (class / name / ST)
    const klass = b.racer_class_number ? ['','A1','A2','B1','B2'][b.racer_class_number] || '-' : (b.racer_class || '-');
    const name = b.racer_name || '-';
    const stText = (st != null) ? `ST:${(st).toFixed(2)}` : 'ST:-';

    tr.innerHTML = `
      <td class="mono">${lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${klass}</div>
          <div class="name">${name}</div>
          <div class="st">${stText}</div>
        </div>
      </td>
      <td>${fcount>0 ? 'F' : '-'}</td>
      <td>${local != null ? (local + '%') : '-'}</td>
      <td>${motor != null ? (motor + '%') : '-'}</td>
      <td>${course != null ? (course + '%') : '-'}</td>
      <td><div class="${markClass} ${mark==='◎' ? 'top':''}">${mark}</div></td>
    `;
    entryTableBody.appendChild(tr);
  });

  // AI predictions (simple ranking by rawScore)
  const scored = boats.map(b=>{
    const st = (typeof b.racer_average_start_timing === 'number') ? b.racer_average_start_timing : (b.racer_average_start_timing ? Number(b.racer_average_start_timing) : 0.3);
    const fcount = Number(b.racer_flying_count || 0);
    const local = (b.local_win_rate != null) ? Number(b.local_win_rate) : (b.racer_local_win_rate != null ? Number(b.racer_local_win_rate) : 30);
    const motor = (b.motor_win_rate != null) ? Number(b.motor_win_rate) : (b.racer_motor_win_rate != null ? Number(b.racer_motor_win_rate) : 30);
    const course = (b.course_win_rate != null) ? Number(b.course_win_rate) : (b.racer_course_win_rate != null ? Number(b.racer_course_win_rate) : 30);

    const stScore = st ? (1/(st||0.3)) : 1;
    const fScore = (fcount > 0) ? 0.7 : 1.0;
    const score = stScore * fScore * (local/100) * (motor/100) * (course/100);
    return { b, score };
  });

  scored.sort((a,b)=> b.score - a.score);

  // build bets: simple top combinations: 1着候補上位3 × 2着候補上位3 × 3着候補上位3 generate unique combos with probabilities from normalized score
  const probs = scored.map(s=>s.score).map(v=> v>0? v:0.0001);
  const sum = probs.reduce((a,b)=>a+b,0);
  const norm = probs.map(p=> (p/sum)*100 );
  // prepare simple bet strings (1着-2着-3着) using top 5 permutations
  const picks = scored.slice(0,6).map(s=> s.b.racer_boat_number || '?');

  // produce main (top combinations by score heuristic)
  const main = [];
  const sub = [];
  // helper to push unique
  const pushed = new Set();
  function addBet(arr, a,b,c,prob){
    const key = `${a}-${b}-${c}`;
    if(pushed.has(key)) return;
    pushed.add(key);
    arr.push({ bet:key, prob: Math.round(prob) });
  }
  // create some candidate combos
  for(let i=0;i<Math.min(6,picks.length);i++){
    for(let j=0;j<Math.min(6,picks.length);j++){
      for(let k=0;k<Math.min(6,picks.length);k++){
        if(i===j || j===k || i===k) continue;
        // prob heuristic: average of ranks inverted
        const scoreVal = (scored[i].score*2 + scored[j].score + scored[k].score)/4;
        addBet( (main.length<5 ? main : sub), picks[i], picks[j], picks[k], Math.min(99, Math.floor(scoreVal*200)) );
        if(main.length>=5 && sub.length>=5) break;
      }
      if(main.length>=5 && sub.length>=5) break;
    }
    if(main.length>=5 && sub.length>=5) break;
  }
  // ensure lengths
  while(main.length<5) main.push({bet:'- - -', prob:0});
  while(sub.length<5) sub.push({bet:'- - -', prob:0});

  // render AI tables
  aiMainBody.innerHTML = '';
  aiSubBody.innerHTML = '';
  main.forEach(it=>{
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${it.bet}</td><td class="mono">${it.prob}%</td>`; aiMainBody.appendChild(tr);
  });
  while(aiMainBody.children.length<5){ const tr=document.createElement('tr'); tr.innerHTML=`<td>-</td><td class="mono">-</td>`; aiMainBody.appendChild(tr); }
  sub.forEach(it=>{
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${it.bet}</td><td class="mono">${it.prob}%</td>`; aiSubBody.appendChild(tr);
  });
  while(aiSubBody.children.length<5){ const tr=document.createElement('tr'); tr.innerHTML=`<td>-</td><td class="mono">-</td>`; aiSubBody.appendChild(tr); }

  // comments: per course 1..6 - generate text with strengths and basis
  commentTableBody.innerHTML = '';
  for(let lane=1; lane<=6; lane++){
    const boat = boats.find(b=> (b.racer_boat_number||0)===lane );
    let text='データなし';
    if(boat){
      const st = boat.racer_average_start_timing ?? null;
      const motor = boat.motor_win_rate ?? boat.racer_motor_win_rate ?? null;
      const localv = boat.local_win_rate ?? boat.racer_local_win_rate ?? null;
      // determine strength
      const stGood = (st && st <= 0.13);
      const motorGood = (motor && motor >= 50);
      const localGood = (localv && localv >= 50);
      const parts = [];
      if(stGood) parts.push('今節のST絶好調');
      if(motorGood) parts.push('モーターの仕上がり良好');
      if(localGood) parts.push('当地実績が高い');
      if(parts.length===0) parts.push('目立った長所は少ないが総合力で勝負');
      // reference to AI picks if lane present
      const inMain = main.some(m=> m.bet.split('-').includes(String(lane)));
      const inSub = sub.some(s=> s.bet.split('-').includes(String(lane)));
      const reason = inMain ? '（本命買い目に含まれる）' : (inSub ? '（穴候補に含まれる）' : '');
      text = `${lane}コース：${parts.join('、')}。${reason} ST:${st ?? '-'} MT:${motor ?? '-'} 地:${localv ?? '-'}`;
    }
    const tr = document.createElement('tr'); tr.innerHTML = `<td>${lane}コース</td><td style="text-align:left">${text}</td>`; commentTableBody.appendChild(tr);
  }
}

// --- navigation / events ---
todayBtn.addEventListener('click', ()=>{
  CURRENT_MODE = 'today';
  CURRENT_DATE = getIsoDate(new Date());
  todayBtn.classList.add('active'); yesterdayBtn.classList.remove('active');
  loadData(false);
});
yesterdayBtn.addEventListener('click', ()=>{
  CURRENT_MODE = 'yesterday';
  const d = new Date(); d.setDate(d.getDate()-1); CURRENT_DATE = getIsoDate(d);
  yesterdayBtn.classList.add('active'); todayBtn.classList.remove('active');
  loadData(false);
});
refreshBtn.addEventListener('click', ()=> loadData(true));

document.getElementById('backToVenues')?.addEventListener('click', ()=> {
  CURRENT_VENUE_ID = null; CURRENT_RACE_NO = null; renderVenues();
});
document.getElementById('backToRaces')?.addEventListener('click', ()=> {
  CURRENT_RACE_NO = null; renderRaces(CURRENT_VENUE_ID);
});

// initial boot
(async ()=>{
  // default mode today
  todayBtn.classList.add('active');
  await loadData(false);
})();