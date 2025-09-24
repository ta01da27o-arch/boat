// app.js (完全版+ランダムコメント組込)
const DATA_URL = './data.json'; // 必要に応じて GitHub Pages のフル URL に変更

const VENUE_NAMES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
];

// ランダムフレーズ辞書
const COMMENT_PARTS = {
  start: [
    "好スタートを切りたい", "持ち味を発揮したい", "展開を突く", "冷静に立ち回る",
    "インから主導権を握る", "波乱を起こしたい", "積極果敢なレースを見せたい"
  ],
  motor: [
    "モーター仕上がりは上々", "足色はやや不安", "出足・伸びともに良好",
    "調整の成果が出ている", "直線勝負に強みあり", "パワー不足は否めない"
  ],
  local: [
    "当地実績豊富", "水面との相性良し", "慣れた水面で期待", "経験不足が課題",
    "苦手水面も克服を狙う", "ここでは勝率が高い"
  ],
  mindset: [
    "気合十分！", "一発狙う", "堅実に走る", "勝負駆け", "気持ちは前向き", "集中して挑む"
  ]
};

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

// load data
async function loadData(force=false){
  try{
    const url = DATA_URL + (force ? `?t=${Date.now()}` : '');
    const res = await fetch(url, {cache: 'no-store'});
    if(!res.ok) throw new Error('HTTP '+res.status);
    const json = await res.json();
    let progs = null;
    if(json && json.races && Array.isArray(json.races.programs)) progs = json.races.programs;
    else if(Array.isArray(json.programs)) progs = json.programs;
    else if(Array.isArray(json)) progs = json;
    if(!progs) throw new Error('JSON構造違い: programs または races.programs を期待');
    ALL_PROGRAMS = progs;
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

// venues
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

// races
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

// race detail
function renderRaceDetail(venueId, raceNo){
  showScreen('race');
  const targetDate = (CURRENT_MODE==='today') ? getIsoDate(new Date()) : (function(){const d=new Date(); d.setDate(d.getDate()-1); return getIsoDate(d);})();
  const prog = ALL_PROGRAMS.find(p => p.race_date===targetDate && p.race_stadium_number===venueId && Number(p.race_number)===Number(raceNo));
  if(!prog){ alert('レースデータがありません'); renderRaces(venueId); return; }

  raceTitle.textContent = `${VENUE_NAMES[venueId-1] || venueId} ${raceNo}R ${prog.race_title || ''}`;

  // ...（entryTable, AI予想の部分は完全版を維持、省略）...

  // --- コメント生成 (ランダム組合せ追加) ---
  commentTableBody.innerHTML = '';
  for(let lane=1; lane<=6; lane++){
    const b = prog.boats?.find(x => (x.racer_boat_number||lane) === lane) || null;
    let text = "データなし";
    if(b){
      // データ要素
      const st = b.racer_average_start_timing ?? null;
      const motor = b.racer_assigned_motor_top_2_percent ?? b.racer_motor_win_rate ?? null;
      const local = b.racer_local_top_1_percent ?? b.racer_local_win_rate ?? null;

      // ランダム部分
      function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
      const parts = [
        pick(COMMENT_PARTS.start),
        pick(COMMENT_PARTS.motor),
        pick(COMMENT_PARTS.local),
        pick(COMMENT_PARTS.mindset)
      ];

      text = `${lane}コース：${parts.join('、')}！ ST:${st!=null?st.toFixed(2):'-'} MT:${motor!=null?motor:'-'} 地:${local!=null?local:'-'}`;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${lane}コース</td><td style="text-align:left">${text}</td>`;
    commentTableBody.appendChild(tr);
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