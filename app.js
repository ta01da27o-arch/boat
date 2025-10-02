// app.js
const VIEW = document.querySelector('.view');
const dateLabel = document.getElementById('dateLabel');
const refreshBtn = document.getElementById('refreshBtn');
const todayBtn = document.getElementById('todayBtn');
const yesterdayBtn = document.getElementById('yesterdayBtn');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_DETAIL = document.getElementById('screen-detail');

const venuesGrid = document.getElementById('venuesGrid');
const racesGrid  = document.getElementById('racesGrid');

const venueTitle = document.getElementById('venueTitle');
const raceTitle  = document.getElementById('raceTitle');

let raceData = {};
let historyData = {};
let currentDateType = 'today';
let currentVenue = null;
let currentRace  = null;

// 日付ラベル更新
function updateDateLabel() {
  const today = new Date();
  if (currentDateType === 'today') {
    dateLabel.textContent = today.toLocaleDateString();
  } else {
    const yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    dateLabel.textContent = yest.toLocaleDateString();
  }
}

// データ取得
async function loadData() {
  const suffix = currentDateType === 'today' ? 'today' : 'yesterday';
  const resRace = await fetch(`data_${suffix}.json`);
  raceData = await resRace.json();

  try {
    const resHist = await fetch('history.json');
    historyData = await resHist.json();
  } catch {
    historyData = {};
  }

  renderVenues();
  updateDateLabel();
}

// 画面切替
function showScreen(screen) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_DETAIL].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// 開催場一覧
function renderVenues() {
  venuesGrid.innerHTML = '';
  Object.keys(raceData).forEach(venue => {
    const btn = document.createElement('button');
    btn.className = 'venue-btn';
    btn.textContent = venue;
    btn.onclick = () => {
      currentVenue = venue;
      renderRaces(venue);
      showScreen(SCREEN_RACES);
    };
    venuesGrid.appendChild(btn);
  });
}

// レース一覧
function renderRaces(venue) {
  venueTitle.textContent = venue;
  racesGrid.innerHTML = '';
  const races = Object.keys(raceData[venue] || {});
  races.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'race-btn';
    btn.textContent = `${r}R`;
    btn.onclick = () => {
      currentRace = r;
      renderRaceDetail(venue, r);
      showScreen(SCREEN_DETAIL);
    };
    racesGrid.appendChild(btn);
  });
}

// 出走表 & AI予測
function renderRaceDetail(venue, raceNo) {
  raceTitle.textContent = `${venue} ${raceNo}R`;

  const race = raceData[venue][raceNo];
  const tbody = document.querySelector('#entryTable tbody');
  tbody.innerHTML = '';

  const players = race.players.map(p => {
    const score = (p.localWinRate || 0) * (p.motorRate || 0) * (p.courseRate || 0);
    return {...p, rawScore: score};
  });

  // 出走表
  players.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${p.lane}</td>
      <td>${p.class || ''} / ${p.name || ''} / ${p.st || '-'}</td>
      <td class="mono">${p.f || ''}</td>
      <td class="mono">${p.localWinRate}</td>
      <td class="mono">${p.motorRate}</td>
      <td class="mono">${p.courseRate}</td>
      <td class="mono">${p.rawScore.toFixed(3)}</td>
    `;
    tbody.appendChild(tr);
  });

  // スコア順に並べ替え
  const ranked = [...players].sort((a,b)=>b.rawScore-a.rawScore);

  // AI買い目（本命/穴）
  const aiMainBody = document.querySelector('#aiMain tbody');
  const aiSubBody  = document.querySelector('#aiSub tbody');
  aiMainBody.innerHTML = '';
  aiSubBody.innerHTML = '';

  ranked.slice(0,5).forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.lane}</td><td>${(p.rawScore*100).toFixed(1)}%</td>`;
    aiMainBody.appendChild(tr);
  });
  ranked.slice(-5).forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.lane}</td><td>${(p.rawScore*100).toFixed(1)}%</td>`;
    aiSubBody.appendChild(tr);
  });

  // AI順位予測（新しいカード枠）
  const aiRankBody = document.querySelector('#aiRank tbody');
  aiRankBody.innerHTML = '';
  ranked.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="mono">${idx+1}</td>
      <td class="mono">${p.lane}</td>
      <td>${p.name}</td>
      <td class="mono">${p.rawScore.toFixed(3)}</td>
    `;
    aiRankBody.appendChild(tr);
  });

  // コメント
  const commentBody = document.querySelector('#commentTable tbody');
  commentBody.innerHTML = '';
  players.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td class="mono">${p.lane}</td><td>${p.comment||''}</td>`;
    commentBody.appendChild(tr);
  });
}

// イベント
refreshBtn.onclick = () => loadData();
todayBtn.onclick = () => {currentDateType='today'; todayBtn.classList.add('active'); yesterdayBtn.classList.remove('active'); loadData();};
yesterdayBtn.onclick = () => {currentDateType='yesterday'; yesterdayBtn.classList.add('active'); todayBtn.classList.remove('active'); loadData();};

document.getElementById('backToVenues').onclick = ()=>showScreen(SCREEN_VENUES);
document.getElementById('backToRaces').onclick = ()=>showScreen(SCREEN_RACES);

// 初期化
loadData();