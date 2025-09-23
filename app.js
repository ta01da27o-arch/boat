// app.js 完全版互換 + フォールバック強化

const DATA_URL = './data.json';
const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

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

let ALL_PROGRAMS = [];
let CURRENT_MODE = 'today'; // "today" or "yesterday"
let CURRENT_VENUE_ID = null;
let CURRENT_RACE_NO = null;

function getIsoDate(d){ return d.toISOString().slice(0,10); }
function formatToDisplay(dstr){
  try {
    const d = new Date(dstr);
    return d.toLocaleDateString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', weekday:'short' });
  } catch(e){
    return dstr;
  }
}

function showScreen(name){
  SCREEN_VENUES.classList.remove('active');
  SCREEN_RACES.classList.remove('active');
  SCREEN_RACE.classList.remove('active');
  if(name==='venues') SCREEN_VENUES.classList.add('active');
  if(name==='races') SCREEN_RACES.classList.add('active');
  if(name==='race') SCREEN_RACE.classList.add('active');
}

async function loadData(force=false){
  try {
    const url = DATA_URL + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) {
      throw new Error('HTTP status ' + res.status);
    }
    const json = await res.json();

    // JSON構造チェック
    let progs = null;
    if(json.races && Array.isArray(json.races.programs)) {
      progs = json.races.programs;
    } else if(Array.isArray(json.programs)) {
      progs = json.programs;
    } else if(json.today && Array.isArray(json.today.programs)) {
      progs = [...json.today.programs, ...(json.yesterday?.programs || [])];
    } else if(Array.isArray(json)) {
      progs = json;
    }

    if(!progs || progs.length === 0) {
      throw new Error('プログラムデータが空です');
    }

    ALL_PROGRAMS = progs;
    // 日付ラベル更新
    const d = new Date();
    dateLabel.textContent = formatToDisplay(d.toISOString());

    renderVenues();
    return true;

  } catch(err){
    console.error('データ読み込み失敗:', err);
    venuesGrid.innerHTML = `<div class="card">データ取得エラー: ${err.message}</div>`;
    return false;
  }
}

function renderVenues(){
  showScreen('venues');
  venuesGrid.innerHTML = '';
  const targetDate = (CURRENT_MODE === 'today') ? getIsoDate(new Date()) : (function(){
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getIsoDate(d);
  })();

  const hasMap = {};
  ALL_PROGRAMS.forEach(p => {
    if(p.race_date === targetDate && p.race_stadium_number) {
      hasMap[p.race_stadium_number] = true;
    }
  });

  for(let i = 0; i < 24; i++){
    const id = i + 1;
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
      card.addEventListener('click', () => {
        CURRENT_VENUE_ID = id;
        renderRaces(id);
      });
    }
    venuesGrid.appendChild(card);
  }
}

function renderRaces(venueId){
  showScreen('races');
  CURRENT_VENUE_ID = venueId;
  venueTitle.textContent = VENUE_NAMES[venueId - 1] || `場${venueId}`;
  racesGrid.innerHTML = '';

  const targetDate = (CURRENT_MODE === 'today') ? getIsoDate(new Date()) : (function(){
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getIsoDate(d);
  })();

  const progs = ALL_PROGRAMS.filter(p => p.race_date === targetDate && p.race_stadium_number === venueId);
  const existing = new Set(progs.map(p => Number(p.race_number)));

  for(let no = 1; no <= 12; no++){
    const btn = document.createElement('button');
    btn.className = 'race-btn';
    btn.textContent = `${no}R`;
    if(existing.has(no)){
      btn.addEventListener('click', () => {
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

function renderRaceDetail(venueId, raceNo){
  showScreen('race');
  const targetDate = (CURRENT_MODE === 'today') ? getIsoDate(new Date()) : (function(){
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getIsoDate(d);
  })();

  const prog = ALL_PROGRAMS.find(p => p.race_date === targetDate && p.race_stadium_number === venueId && Number(p.race_number) === Number(raceNo));
  if(!prog){
    // データが見つからない場合の表示
    raceTitle.textContent = `データなし ${VENUE_NAMES[venueId-1] || venueId} ${raceNo}R`;
    entryTableBody.innerHTML = '';
    aiMainBody.innerHTML = '';
    aiSubBody.innerHTML = '';
    commentTableBody.innerHTML = '';
    return;
  }

  raceTitle.textContent = `${VENUE_NAMES[venueId-1] || venueId} ${raceNo}R ${prog.race_title || ''}`;

  // 出走表
  const boats = Array.isArray(prog.boats) ? prog.boats.slice().sort((a,b)=> (a.racer_boat_number||0)-(b.racer_boat_number||0)) : [];

  entryTableBody.innerHTML = '';
  boats.forEach(b => {
    const klass = b.racer_class_number ? ['','A1','A2','B1','B2'][b.racer_class_number] || '-' : '-';
    const name = b.racer_name || '-';
    const st = (typeof b.racer_average_start_timing === 'number') ? b.racer_average_start_timing : null;
    const stText = (st != null) ? `ST:${st.toFixed(2)}` : 'ST:-';
    const fcnt = b.racer_flying_count || 0;
    const fText = fcnt > 0 ? `F${fcnt}` : 'ー';
    const local = (typeof b.racer_local_top_1_percent === 'number') ? b.racer_local_top_1_percent : null;
    const motor = (typeof b.racer_assigned_motor_top_2_percent === 'number') ? b.racer_assigned_motor_top_2_percent : null;
    const boatPct = (typeof b.racer_assigned_boat_top_2_percent === 'number') ? b.racer_assigned_boat_top_2_percent : null;

    const tr = document.createElement('tr');
    tr.className = `row-${b.racer_boat_number || '?'}`;
    tr.innerHTML = `
      <td class="mono">${b.racer_boat_number || '-'}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${klass}</div>
          <div class="name">${name}</div>
          <div class="st">${stText}</div>
        </div>
      </td>
      <td>${fText}</td>
      <td>${local != null ? local + '%' : '-'}</td>
      <td>${motor != null ? motor + '%' : '-'}</td>
      <td>${boatPct != null ? boatPct + '%' : '-'}</td>
      <td class="eval-mark">-</td>
    `;
    entryTableBody.appendChild(tr);
  });

  // AI予想（例：モーター率＋艇率で簡易スコア）
  const scored = boats.map(b => {
    const motor = (typeof b.racer_assigned_motor_top_2_percent === 'number') ? b.racer_assigned_motor_top_2_percent : 0;
    const boatPct = (typeof b.racer_assigned_boat_top_2_percent === 'number') ? b.racer_assigned_boat_top_2_percent : 0;
    const score = motor * 0.6 + boatPct * 0.4;  // 重み付けは仮
    return { b, score };
  });
  scored.sort((a,b) => b.score - a.score);

  // 本命 5点
  aiMainBody.innerHTML = '';
  scored.slice(0,5).forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.b.racer_boat_number}</td><td class="mono">${it.score.toFixed(1)}%</td>`;
    aiMainBody.appendChild(tr);
  });
  while(aiMainBody.children.length < 5) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>-</td><td class="mono">-</td>`;
    aiMainBody.appendChild(tr);
  }

  // 穴 5点（6位以下からなど）
  aiSubBody.innerHTML = '';
  scored.slice(5,10).forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${it.b.racer_boat_number}</td><td class="mono">${it.score.toFixed(1)}%</td>`;
    aiSubBody.appendChild(tr);
  });
  while(aiSubBody.children.length < 5) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>-</td><td class="mono">-</td>`;
    aiSubBody.appendChild(tr);
  }

  // コース別コメント
  commentTableBody.innerHTML = '';
  for(let lane=1; lane<=6; lane++){
    const b = boats.find(x => x.racer_boat_number === lane);
    let text = 'データなし';
    if(b){
      const parts = [];
      if(b.racer_average_start_timing != null && b.racer_average_start_timing < 0.15) parts.push('今節のST絶好調');
      if(b.racer_flying_count > 0) parts.push('F持ち注意');
      if(b.racer_assigned_motor_top_2_percent >= 35) parts.push('モーター強');
      if(b.racer_assigned_boat_top_2_percent >= 35) parts.push('艇性能良');
      if(parts.length === 0) parts.push('目立ち特徴なし');
      text = `${lane}コース：${parts.join('、')}！`;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${lane}コース</td><td style="text-align:left">${text}</td>`;
    commentTableBody.appendChild(tr);
  }

}

// イベントリスナー
todayBtn.addEventListener('click', () => {
  CURRENT_MODE = 'today';
  todayBtn.classList.add('active');
  yesterdayBtn.classList.remove('active');
  loadData(true);
});
yesterdayBtn.addEventListener('click', () => {
  CURRENT_MODE = 'yesterday';
  yesterdayBtn.classList.add('active');
  todayBtn.classList.remove('active');
  loadData(true);
});
refreshBtn.addEventListener('click', () => loadData(true));
backToVenuesBtn?.addEventListener('click', () => {
  CURRENT_VENUE_ID = null;
  CURRENT_RACE_NO = null;
  renderVenues();
});
backToRacesBtn?.addEventListener('click', () => {
  CURRENT_RACE_NO = null;
  renderRaces(CURRENT_VENUE_ID);
});

// 初期化
(async () => {
  todayBtn.classList.add('active');
  await loadData(false);
})();