/* ================================
   app.js - BOAT RACE AI Viewer
   コメント強弱対応版（完全構成）
   ================================ */

const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const refreshBtn = document.getElementById('refreshBtn');
const tabVenues = document.getElementById('tabVenues');
const tabRaces = document.getElementById('tabRaces');
const tabRace = document.getElementById('tabRace');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_RACE   = document.getElementById('screen-race');

let currentVenue = null;
let currentRace = null;
let allData = null;

/* --------------------------------
   初期処理
-------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  todayLabel.textContent = getTodayLabel();
  await loadData();
  renderVenues();
  bindEvents();
});

/* --------------------------------
   日付フォーマット
-------------------------------- */
function getTodayLabel(){
  const d = new Date();
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}

/* --------------------------------
   データ読込（data.json）
-------------------------------- */
async function loadData(){
  try {
    const res = await fetch('data.json', { cache: 'no-cache' });
    allData = await res.json();
  } catch(e){
    console.error('データ読み込みエラー:', e);
  }
}

/* --------------------------------
   イベントバインド
-------------------------------- */
function bindEvents(){
  refreshBtn.addEventListener('click', async ()=>{
    refreshBtn.disabled = true;
    refreshBtn.textContent = '更新中...';
    await loadData();
    renderVenues();
    showScreen('venues');
    refreshBtn.textContent = '更新';
    refreshBtn.disabled = false;
  });
}

/* --------------------------------
   画面切替
-------------------------------- */
function showScreen(name){
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(el=>el.classList.remove('active'));
  [tabVenues, tabRaces, tabRace].forEach(t=>t.classList.remove('active'));

  if(name === 'venues'){
    SCREEN_VENUES.classList.add('active');
    tabVenues.classList.add('active');
  }
  else if(name === 'races'){
    SCREEN_RACES.classList.add('active');
    tabRaces.classList.add('active');
  }
  else if(name === 'race'){
    SCREEN_RACE.classList.add('active');
    tabRace.classList.add('active');
  }
}

/* --------------------------------
   24場リスト表示
-------------------------------- */
function renderVenues(){
  SCREEN_VENUES.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'venues-grid';

  (allData?.venues || []).forEach(venue=>{
    const card = document.createElement('div');
    card.className = 'venue-card clickable';
    card.innerHTML = `
      <div class="v-name">${venue.name}</div>
      <div class="v-status">${venue.status || '開催中'}</div>
      <div class="v-rate">的中率: ${venue.rate ?? '-'}%</div>
    `;
    card.addEventListener('click', ()=>onSelectVenue(venue));
    grid.appendChild(card);
  });
  SCREEN_VENUES.appendChild(grid);
}

/* --------------------------------
   レース番号画面
-------------------------------- */
function onSelectVenue(venue){
  currentVenue = venue;
  renderRaces(venue);
  showScreen('races');
}

function renderRaces(venue){
  SCREEN_RACES.innerHTML = '';

  const backBtn = createBackButton(()=>showScreen('venues'));
  SCREEN_RACES.appendChild(backBtn);

  const title = document.createElement('h2');
  title.textContent = `${venue.name} のレース一覧`;
  SCREEN_RACES.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'races-grid';

  for(let i=1; i<=12; i++){
    const btn = document.createElement('div');
    btn.className = 'race-btn';
    btn.textContent = `${i}R`;
    btn.addEventListener('click', ()=>onSelectRace(i));
    grid.appendChild(btn);
  }
  SCREEN_RACES.appendChild(grid);
}

/* --------------------------------
   出走表画面
-------------------------------- */
function onSelectRace(raceNo){
  currentRace = raceNo;
  renderRaceTable(currentVenue.name, raceNo);
  showScreen('race');
}

function renderRaceTable(venueName, raceNo){
  SCREEN_RACE.innerHTML = '';

  const backBtn = createBackButton(()=>showScreen('races'));
  SCREEN_RACE.appendChild(backBtn);

  const title = document.createElement('h2');
  title.textContent = `${venueName} ${raceNo}R 出走表`;
  SCREEN_RACE.appendChild(title);

  const raceData = findRaceData(venueName, raceNo);
  if(!raceData){
    SCREEN_RACE.innerHTML += '<p>データが見つかりません。</p>';
    return;
  }

  // 出走表テーブル作成
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `
    <thead>
      <tr><th>枠</th><th>選手名</th><th>ST</th><th>展示</th><th>評価</th></tr>
    </thead>
    <tbody>
      ${raceData.entries.map(e=>`
        <tr class="row-${e.waku}">
          <td>${e.waku}</td>
          <td>${e.name}</td>
          <td>${e.st}</td>
          <td>${e.display}</td>
          <td>${e.eval}</td>
        </tr>`).join('')}
    </tbody>
  `;
  SCREEN_RACE.appendChild(table);

  // コメント強弱エリア
  const commentTitle = document.createElement('div');
  commentTitle.className = 'comment-title';
  commentTitle.textContent = 'AIコメント';
  SCREEN_RACE.appendChild(commentTitle);

  const commentList = document.createElement('div');
  commentList.className = 'comment-list';

  // コメント生成（強弱分類）
  const comments = generateComments(raceData);
  comments.forEach(c=>{
    const div = document.createElement('div');
    div.className = c.className;
    div.textContent = c.text;
    commentList.appendChild(div);
  });
  SCREEN_RACE.appendChild(commentList);
}

/* --------------------------------
   レースデータ検索
-------------------------------- */
function findRaceData(venueName, raceNo){
  const venue = (allData?.venues || []).find(v=>v.name===venueName);
  if(!venue) return null;
  return (venue.races || []).find(r=>r.no===raceNo);
}

/* --------------------------------
   コメント生成（強弱連動）
-------------------------------- */
function generateComments(raceData){
  const list = [];
  const base = [
    "展開有利な位置取り。",
    "ターンの切れ味が光る。",
    "スタート安定している。",
    "差し決まるか注目。",
    "波乱含みの一戦。",
    "ペースを掴めば上位可能。",
    "仕上がり良好、軸有力。",
    "調整バッチリ、上昇気配。",
    "実力上位、期待度高。",
    "混戦模様、展開注意。"
  ];

  // 強弱をランダム設定
  for(let i=0;i<4;i++){
    const rand = Math.random();
    let cls = 'comment-normal';
    let text = base[Math.floor(Math.random()*base.length)];

    if(rand < 0.15){
      cls = 'comment-weak';
      text = "静かな気配、控えめな評価。";
    } else if(rand < 0.5){
      cls = 'comment-normal';
    } else if(rand < 0.8){
      cls = 'comment-strong';
      text = "勝負気配十分、上位狙える！";
    } else {
      cls = 'comment-very-strong';
      text = "絶好調！信頼度MAX！";
    }
    list.push({ className: cls, text });
  }
  return list;
}

/* --------------------------------
   汎用戻るボタン
-------------------------------- */
function createBackButton(callback){
  const btn = document.createElement('button');
  btn.className = 'btn back';
  btn.textContent = '戻る';
  btn.addEventListener('click', callback);
  return btn;
}