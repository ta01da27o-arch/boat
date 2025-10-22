// app.js
const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const refreshBtn = document.getElementById('refreshBtn');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_RACE   = document.getElementById('screen-race');

let DATA = null;
let HISTORY = null;
let TODAY_KEY = null;

// ---------------- 初期処理 ----------------
document.addEventListener('DOMContentLoaded', async () => {
  todayLabel.textContent = getTodayStringDisplay();
  TODAY_KEY = getTodayKey();
  await loadData();
  renderVenues();
});

// 今日の日付キー（例: 20251022）
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`;
}

// 表示用日付（例: 2025-10-22）
function getTodayStringDisplay() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
}

// ---------------- データ読み込み ----------------
async function loadData() {
  try {
    const [dataRes, historyRes] = await Promise.all([
      fetch('data/data.json?_t=' + Date.now()),
      fetch('data/history.json?_t=' + Date.now())
    ]);

    if (!dataRes.ok) throw new Error('data.json fetch failed');
    if (!historyRes.ok) throw new Error('history.json fetch failed');

    DATA = await dataRes.json();
    HISTORY = await historyRes.json();

    console.log('✅ Data loaded for key:', TODAY_KEY);
  } catch (err) {
    console.error('❌ Data load error:', err);
  }
}

// ---------------- 会場一覧（24場） ----------------
function renderVenues() {
  SCREEN_VENUES.classList.add('active');
  SCREEN_RACES.classList.remove('active');
  SCREEN_RACE.classList.remove('active');

  if (!DATA || !DATA[TODAY_KEY]) {
    VIEW.innerHTML = '<p>本日のデータが存在しません。</p>';
    return;
  }

  const venuesData = DATA[TODAY_KEY];
  const grid = document.createElement('div');
  grid.className = 'venues-grid';

  Object.keys(venuesData).forEach(venueName => {
    const v = venuesData[venueName];
    const card = document.createElement('div');
    card.className = 'venue-card clickable';
    card.innerHTML = `
      <div class="v-name">${venueName}</div>
      <div class="v-status">開催中</div>
      <div class="v-rate">レース数: ${v.races.length}</div>
    `;
    card.onclick = () => renderRaces(venueName, v.races);
    grid.appendChild(card);
  });

  VIEW.innerHTML = '';
  VIEW.appendChild(grid);
}

// ---------------- 各会場のレース一覧 ----------------
function renderRaces(venueName, races) {
  SCREEN_VENUES.classList.remove('active');
  SCREEN_RACES.classList.add('active');
  SCREEN_RACE.classList.remove('active');

  const wrap = document.createElement('div');
  wrap.innerHTML = `<h2>${venueName}（全${races.length}R）</h2>`;

  const racesGrid = document.createElement('div');
  racesGrid.className = 'races-grid';

  races.forEach(r => {
    const btn = document.createElement('div');
    btn.className = 'race-btn';
    btn.textContent = `${r.race_no}R`;
    btn.onclick = () => renderRaceDetail(venueName, r);
    racesGrid.appendChild(btn);
  });

  wrap.appendChild(racesGrid);

  const backBtn = document.createElement('button');
  backBtn.className = 'btn back';
  backBtn.textContent = '← 戻る';
  backBtn.onclick = renderVenues;

  VIEW.innerHTML = '';
  VIEW.appendChild(backBtn);
  VIEW.appendChild(wrap);
}

// ---------------- 各レース詳細 ----------------
function renderRaceDetail(venueName, race) {
  SCREEN_VENUES.classList.remove('active');
  SCREEN_RACES.classList.remove('active');
  SCREEN_RACE.classList.add('active');

  const container = document.createElement('div');
  container.className = 'card';
  container.innerHTML = `
    <h2>${venueName} ${race.race_no}R</h2>
    <table class="table">
      <thead>
        <tr><th>艇</th><th>選手名</th><th>級別</th><th>ST</th><th>全国勝率</th><th>モーター勝率</th></tr>
      </thead>
      <tbody>
        ${race.boats.map((b, i) => `
          <tr class="row-${i+1}">
            <td>${b.racer_boat_number}</td>
            <td>${b.racer_name}</td>
            <td>${b.racer_class}</td>
            <td>${b.racer_start_timing}</td>
            <td>${b.racer_national_win_rate}</td>
            <td>${b.racer_motor_win_rate}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  `;

  const backBtn = document.createElement('button');
  backBtn.className = 'btn back';
  backBtn.textContent = '← 戻る';
  backBtn.onclick = () => renderRaces(venueName, DATA[TODAY_KEY][venueName].races);

  VIEW.innerHTML = '';
  VIEW.appendChild(backBtn);
  VIEW.appendChild(container);
}

// ---------------- 手動更新ボタン ----------------
refreshBtn.addEventListener('click', async () => {
  refreshBtn.disabled = true;
  refreshBtn.textContent = '更新中...';
  await loadData();
  renderVenues();
  refreshBtn.disabled = false;
  refreshBtn.textContent = '🔄 更新';
});