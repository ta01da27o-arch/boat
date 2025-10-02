// app.js — フル版 (data.json + history.json を読み、24場表示 / 出走表 / AI買い目 / コメント / 的中率)
// 注意: index.html / style.css を変更しない前提です。
// data.json (出走表) と history.json (過去結果＋保存された AI 予想) を使用します。

const DATA_URL = './data.json';
const HISTORY_URL = './history.json';

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

// DOM (index.html の id に対応)
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
let ALL_PROGRAMS = []; // today's programs array
let HISTORY = {};      // history.json content
let CURRENT_MODE = 'today'; // 'today' or 'yesterday'
let CURRENT_VENUE_ID = null;
let CURRENT_RACE_NO = null;

/* ---------- util ---------- */
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
function safeNum(v){ return (v===null||v===undefined||v===''||Number.isNaN(Number(v))) ? null : Number(v); }

/* ---------- formatting helpers ---------- */
// localRaw may be stored as 5.8 (meaning 5.8 -> display 58%) OR percentages like 54.7 (already percent).
// Heuristic: if value <= 10 => multiply by 10; else keep as-is.
function formatLocalDisplay(raw){
  if(raw === null || raw === undefined) return '-';
  const n = Number(raw);
  if(Number.isNaN(n)) return '-';
  const disp = (n <= 10) ? Math.round(n * 10) : Math.round(n);
  return `${disp}%`;
}
function formatPctAuto(raw){
  if(raw === null || raw === undefined) return '-';
  const n = Number(raw);
  if(Number.isNaN(n)) return '-';
  // If small (<=10) treat as "x10" like local; else treat as percent already
  const disp = (n <= 10) ? Math.round(n * 10) : Math.round(n);
  return `${disp}%`;
}

/* ---------- AI comment helper (simple rule-based) ---------- */
const EXTRA_PHRASES = [
  "展開を巧みに生かす狙い目", "差し切りの一手あるか", "スタートが鍵を握る一戦",
  "機力好調で連軸に期待", "立ち回りで頭一つ抜ける可能性あり", "終盤の粘りに注目したい",
  "前節から調子上向き、要警戒", "波に乗れば台頭十分", "展開次第で一発も十分にあり得る",
  "仕上がり良好で主導権を握る期待", "地元巧者の面目躍如に期待", "展開の隙を突く一手がある"
];
function pickExtraPhrase(){ return EXTRA_PHRASES[Math.floor(Math.random()*EXTRA_PHRASES.length)]; }
function generateDataBasedParts(player){
  const parts = [];
  if (player.st != null){
    if (player.st <= 0.13) parts.push("鋭いスタートで展開有利");
    else if (player.st <= 0.16) parts.push("STまずまずで立ち回り良好");
    else parts.push("スタートに慎重さが残る");
  }
  if (player.motor != null){
    if (player.motor >= 50) parts.push("モーター気配上向き");
    else if (player.motor >= 35) parts.push("機力は水準以上");
    else parts.push("モーターはやや力不足の感");
  }
  if (player.local != null){
    if (player.local >= 60) parts.push("当地巧者の実績");
    else if (player.local >= 40) parts.push("当地で安定した走り");
    else parts.push("当地実績は乏しい");
  }
  if (player.course != null){
    if (player.course >= 40) parts.push("得意コースからの一戦");
    else if (player.course >= 30) parts.push("コース利あり");
  }
  if (player.eval === '◎') parts.push("本命視される実力派");
  else if (player.eval === '○') parts.push("上位争いに食い込みやすい");
  else if (player.eval === '△') parts.push("連下でのひと押し期待");
  else if (player.eval === '✕') parts.push("穴で一考の価値あり");

  return parts;
}
function generateComment(player){
  const parts = generateDataBasedParts(player);
  let sel = [];
  if(parts.length > 0){
    // shuffle and take up to 2
    sel = parts.slice().sort(()=>0.5 - Math.random()).slice(0,2);
  }
  sel.push(pickExtraPhrase());
  let text = sel.join('、') + "。";
  if(text.length < 30) text = sel.concat([pickExtraPhrase()]).join('、') + "。";
  if(text.length > 80) text = text.slice(0,77) + "…。";
  return text;
}
function buildPlayerData(b, evalMark){
  const st = safeNum(b.racer_average_start_timing ?? b.racer_start_timing ?? null);
  // Normalize local/motor/course raw to typical percent numbers (0-100)
  const localRaw = safeNum(b.racer_local_top_1_percent ?? b.racer_local_win_rate ?? null);
  const localNum = (localRaw == null) ? null : (localRaw <= 10 ? localRaw * 10 : localRaw);
  const motorRaw = safeNum(b.racer_assigned_motor_top_2_percent ?? b.racer_motor_win_rate ?? null);
  const motorNum = (motorRaw == null) ? null : (motorRaw <= 10 ? motorRaw * 10 : motorRaw);
  const courseRaw = safeNum(b.racer_assigned_boat_top_2_percent ?? b.racer_course_win_rate ?? null);
  const courseNum = (courseRaw == null) ? null : (courseRaw <= 10 ? courseRaw * 10 : courseRaw);

  return {
    st: st,
    motor: motorNum,
    local: localNum,
    course: courseNum,
    eval: evalMark || null
  };
}

/* ---------- simple trifecta generator (heuristic) ---------- */
const TYPICAL_PATTERNS = [
  [1,2,3],[1,2,4],[1,3,2],[1,3,4],[1,4,2],[1,4,5],
  [2,1,3],[2,1,4],[2,3,1],[2,3,4],[2,4,1],[2,4,5],
  [3,1,2],[3,1,4],[3,4,1],[3,4,5],[3,2,1],[3,2,4],
  [4,1,3],[4,1,5],[4,3,1],[4,3,5],[4,5,1],[4,5,3],
  [5,1,3],[5,1,4],[5,3,6],[5,4,1],[5,6,1],[6,1,3]
];
const TYPICAL_STRINGS = TYPICAL_PATTERNS.map(a => `${a[0]}-${a[1]}-${a[2]}`);

function generate3renBets(rankedBoats){
  const main = [], sub = [], used = new Set();
  function pushUnique(list,a,b,c){
    const key = `${a}-${b}-${c}`;
    if(used.has(key)) return false;
    used.add(key);
    list.push(key);
    return true;
  }
  const r = rankedBoats.concat([1,2,3,4,5,6]).slice(0,6);
  const fav = r[0] || 1;
  const second = r[1] || ((fav===1)?2:1);
  const third = r[2] || ((fav<=2)?3:2);
  const fourth = r[3] || 4;
  const fifth = r[4] || 5;
  const sixth = r[5] || 6;

  const mainCandidates = [
    [fav, second, third],
    [fav, third, second],
    [fav, third, fourth],
    [second, fav, third],
    [second, fav, fourth]
  ];
  mainCandidates.forEach(tri => pushUnique(main, tri[0],tri[1],tri[2]));

  const subCandidates = [
    [second, fav, third],
    [second, fourth, fav],
    [fourth, second, fav],
    [fifth, fav, second],
    [fifth, third, sixth]
  ];
  subCandidates.forEach(tri => pushUnique(sub, tri[0],tri[1],tri[2]));

  for(const s of TYPICAL_STRINGS){
    if(main.length < 5) {
      const [a,b,c] = s.split('-').map(Number);
      pushUnique(main,a,b,c);
    }
    if(sub.length < 5) {
      const [a,b,c] = s.split('-').map(Number);
      pushUnique(sub,a,b,c);
    }
    if(main.length>=5 && sub.length>=5) break;
  }
  while(main.length < 5) main.push('-');
  while(sub.length < 5) sub.push('-');

  function attachProbs(list, rankingScores){
    const items = list.map(key => {
      if(key === '-') return { bet:key, rawW: 0 };
      const [a,b,c] = key.split('-').map(Number);
      const wA = rankingScores[a] || 0.01;
      const wB = rankingScores[b] || 0.01;
      const wC = rankingScores[c] || 0.01;
      const weight = wA*3 + wB*1.5 + wC*1.0;
      return { bet:key, rawW: weight };
    });
    const maxW = Math.max(...items.map(it => it.rawW || 0.0001));
    return items.map(it => {
      const prob = it.bet === '-' ? 0 : Math.max(0, Math.round((it.rawW / maxW) * 100));
      return { bet: it.bet, prob };
    });
  }

  return { main, sub, attachProbs };
}

/* ---------- load data ---------- */
async function loadData(force=false){
  try{
    const cacheBuster = force ? `?t=${Date.now()}` : '';
    const [pRes, hRes] = await Promise.all([
      fetch(DATA_URL + cacheBuster),
      fetch(HISTORY_URL + cacheBuster)
    ]);
    if(!pRes.ok) throw new Error('data.json HTTP '+pRes.status);
    if(!hRes.ok) console.warn('history.json not found or not accessible (continuing without history).');

    const pJson = await pRes.json();
    let progs = null;
    // normalize: data.json might be { programs: [...] } or { races: { programs: [...] } } or array
    if(pJson && pJson.races && Array.isArray(pJson.races.programs)) progs = pJson.races.programs;
    else if(pJson && Array.isArray(pJson.programs)) progs = pJson.programs;
    else if(Array.isArray(pJson)) progs = pJson;
    else progs = pJson.programs || [];

    ALL_PROGRAMS = progs;

    try {
      const hJson = await hRes.json();
      HISTORY = hJson || {};
    } catch (e) {
      HISTORY = {}; // continue if history unavailable
    }

    dateLabel.textContent = formatToDisplay(new Date().toISOString());
    renderVenues();
    return true;
  } catch(err){
    console.error('データ読み込み失敗', err);
    venuesGrid.innerHTML = `<div class="card">データ取得エラー: ${err.message}</div>`;
    return false;
  }
}

/* ---------- render venues (24) ---------- */
function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML = '';
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();

  // build map of stadiums with programs on target date
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

/* ---------- render races 1..12 ---------- */
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

/* ---------- render single race detail ---------- */
function renderRaceDetail(venueId, raceNo){
  showScreen('race');
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  const prog = ALL_PROGRAMS.find(p => p.race_date===targetDate && p.race_stadium_number===venueId && Number(p.race_number)===Number(raceNo));
  if(!prog){ alert('レースデータがありません'); renderRaces(venueId); return; }

  raceTitle.textContent = `${VENUE_NAMES[venueId-1] || venueId} ${raceNo}R ${prog.race_title || ''}`;

  const boats = Array.isArray(prog.boats) ? prog.boats.slice().sort((a,b)=> (a.racer_boat_number||0)-(b.racer_boat_number||0)) : [];

  // prepare players array (index 1..6)
  entryTableBody.innerHTML = '';

  const players = [];
  for(let i=1;i<=6;i++){
    const b = boats.find(x => (x.racer_boat_number||i) === i) || null;
    const klass = b && (typeof b.racer_class_number === 'number') ? (['','A1','A2','B1','B2'][b.racer_class_number] || (b.racer_class || '-')) : (b ? (b.racer_class || '-') : '-');
    const name = b ? (b.racer_name || '-') : '-';
    const st = b ? safeNum(b.racer_average_start_timing ?? b.racer_start_timing ?? null) : null;
    const fcount = b ? Number(b.racer_flying_count || 0) : 0;

    // raw percent numbers
    const localRaw = b ? (safeNum(b.racer_local_top_1_percent ?? b.racer_local_win_rate ?? null)) : null;
    const motorRaw = b ? (safeNum(b.racer_assigned_motor_top_2_percent ?? b.racer_motor_win_rate ?? null)) : null;
    const courseRaw = b ? (safeNum(b.racer_assigned_boat_top_2_percent ?? b.racer_course_win_rate ?? null)) : null;

    // normalized percent values (0..100)
    const localPct = (localRaw == null) ? null : ((localRaw <= 10) ? localRaw * 10 : localRaw);
    const motorPct = (motorRaw == null) ? null : ((motorRaw <= 10) ? motorRaw * 10 : motorRaw);
    const coursePct = (courseRaw == null) ? null : ((courseRaw <= 10) ? courseRaw * 10 : courseRaw);

    // scoring heuristic
    const stScore = (st != null) ? (1/(st || 0.3)) : 1;
    const fScore = (fcount > 0) ? 0.7 : 1.0;
    const localScore = (localPct != null) ? (localPct/100) : 0.3;
    const motorScore = (motorPct != null) ? (motorPct/100) : 0.3;
    const courseScore = (coursePct != null) ? (coursePct/100) : 0.3;
    const rawScore = stScore * fScore * localScore * motorScore * courseScore;

    players.push({
      lane: i,
      b,
      klass,
      name,
      st,
      fcount,
      localPct,
      motorPct,
      coursePct,
      rawScore: rawScore || 0.0001
    });
  }

  // rank by rawScore
  const ranked = players.slice().sort((a,b)=> b.rawScore - a.rawScore);
  // assign marks based on rank (1:◎, 2:○, 3:△, 4:✕, 5:ー, 6:ー)
  const rankToMark = ['◎','○','△','✕','ー','ー'];
  const markByLane = {};
  ranked.forEach((p, idx) => {
    markByLane[p.lane] = rankToMark[idx] || 'ー';
  });

  // render table rows — row-N classes correspond to CSS row-1..row-6 backgrounds
  entryTableBody.innerHTML = '';
  players.forEach(p=>{
    const lane = p.lane;
    const mark = markByLane[lane] || 'ー';
    const markClass = (mark === '◎') ? 'metric-symbol top' : 'metric-symbol';
    const stText = (p.st != null) ? `ST:${p.st.toFixed(2)}` : 'ST:-';
    const fText = (p.fcount > 0) ? `F${p.fcount}` : 'ー';
    const localText = (p.localPct != null) ? `${Math.round(p.localPct)}%` : '-';
    const motorText = (p.motorPct != null) ? `${Math.round(p.motorPct)}%` : '-';
    const courseText = (p.coursePct != null) ? `${Math.round(p.coursePct)}%` : '-';

    const tr = document.createElement('tr');
    tr.className = `row-${lane}`; // background color based on course number
    tr.innerHTML = `
      <td class="mono">${lane}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${p.klass}</div>
          <div class="name">${p.name}</div>
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
  });

  // --- AI予想: build simple ranking, generate trifecta bets & probs ---
  const rankedBoats = ranked.map(r => r.lane); // lane numbers in order of predicted strength
  const rankingScores = {};
  ranked.forEach(r => rankingScores[r.lane] = r.rawScore);

  const bets = generate3renBets(rankedBoats);
  const mainWithProbs = bets.attachProbs(bets.main, rankingScores);
  const subWithProbs  = bets.attachProbs(bets.sub, rankingScores);

  // render AI tables
  if(aiMainBody) aiMainBody.innerHTML = '';
  if(aiSubBody) aiSubBody.innerHTML = '';
  if(aiMainBody){
    mainWithProbs.slice(0,5).forEach(it=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${it.bet}</td><td class="mono">${it.prob}%</td>`;
      aiMainBody.appendChild(tr);
    });
    while(aiMainBody.children.length < 5){
      const tr = document.createElement('tr'); tr.innerHTML = `<td>-</td><td class="mono">-</td>`; aiMainBody.appendChild(tr);
    }
  }
  if(aiSubBody){
    subWithProbs.slice(0,5).forEach(it=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${it.bet}</td><td class="mono">${it.prob}%</td>`;
      aiSubBody.appendChild(tr);
    });
    while(aiSubBody.children.length < 5){
      const tr = document.createElement('tr'); tr.innerHTML = `<td>-</td><td class="mono">-</td>`; aiSubBody.appendChild(tr);
    }
  }

  // --- Comments: generate per-lane newspaper-like short comment (no "1コース：" prefix, no ST/MT/地 at end) ---
  if(commentTableBody) commentTableBody.innerHTML = '';
  players.forEach(p=>{
    let text = 'データなし';
    if(p.b){
      const evalMark = markByLane[p.lane] || null;
      const player = buildPlayerData(p.b, evalMark);
      text = generateComment(player); // auto-generated short commentary
    }
    if(commentTableBody){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="mono">${p.lane}</td><td style="text-align:left">${text}</td>`;
      commentTableBody.appendChild(tr);
    }
  });

}

/* ---------- calcHitRateText: uses HISTORY to calculate per-venue hit rate ---------- */
function calcHitRateText(venueId){
  let total = 0, hit = 0;
  // HISTORY expected format: { "YYYYMMDD": { results: [ { race_stadium_number:..., payouts: {trifecta:[{combination: "a-b-c"}]}, ai_predictions: [...] }, ... ] } }
  for(const dateKey in HISTORY){
    const day = HISTORY[dateKey];
    if(!day || !Array.isArray(day.results)) continue;
    day.results.forEach(race=>{
      if(race.race_stadium_number !== venueId) return;
      total++;
      const trif = race.payouts && race.payouts.trifecta && race.payouts.trifecta[0] && race.payouts.trifecta[0].combination;
      // possible place for stored AI predictions (various keys)
      const preds = race.ai_predictions || race.ai_trifecta_predictions || race.predicted_trifecta || race.ai || [];
      if(trif && Array.isArray(preds) && preds.length > 0){
        if(preds.includes(trif)) hit++;
      }
    });
  }
  if(total === 0) return '--%';
  return Math.round((hit/total)*100) + '%';
}

/* ---------- Events ---------- */
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

/* ---------- Boot ---------- */
(async ()=>{
  todayBtn.classList.add('active');
  await loadData(false);
})();