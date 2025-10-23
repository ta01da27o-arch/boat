// app.js 統合予測版（2025/10/23）

const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES = document.getElementById('screen-races');
const SCREEN_RACE = document.getElementById('screen-race');
const refreshBtn = document.getElementById('refreshBtn');
const backBtn = document.getElementById('backBtn');

let DATA = {};
let HISTORY = {};
let currentVenue = null;
let currentRace = null;

// ===== 日付ラベル =====
const now = new Date();
const jpDate = now.toLocaleDateString('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
todayLabel.textContent = jpDate;

// ===== データ取得 =====
async function loadData() {
  try {
    const [dataRes, historyRes] = await Promise.all([
      fetch('./data/data.json?_=' + Date.now()),
      fetch('./data/history.json?_=' + Date.now()),
    ]);
    DATA = await dataRes.json();
    HISTORY = await historyRes.json();
    renderVenues();
  } catch (e) {
    console.error('データ読み込みエラー:', e);
  }
}

// ===== 24場グリッド表示 =====
function renderVenues() {
  SCREEN_VENUES.innerHTML = '';
  const venues = Object.keys(DATA);

  const grid = document.createElement('div');
  grid.className = 'venues-grid';

  venues.forEach(v => {
    const venue = DATA[v];
    const card = document.createElement('div');
    card.className = 'venue-card';

    const vName = document.createElement('div');
    vName.className = 'v-name';
    vName.textContent = v;

    const vStatus = document.createElement('div');
    vStatus.className = 'v-status';
    const status = venue.status || 'ー';

    if (status === '開催中') {
      vStatus.textContent = '開催中';
      vStatus.classList.add('active');
      card.classList.add('clickable');
      card.addEventListener('click', () => openVenue(v));
    } else if (status === '終了') {
      vStatus.textContent = '終了';
      vStatus.classList.add('finished');
    } else {
      vStatus.textContent = 'ー';
      vStatus.classList.add('closed');
    }

    const vRate = document.createElement('div');
    vRate.className = 'v-rate';
    vRate.textContent = venue.races ? `${venue.races.length}R` : '';

    card.appendChild(vName);
    card.appendChild(vStatus);
    card.appendChild(vRate);
    grid.appendChild(card);
  });

  SCREEN_VENUES.appendChild(grid);
  showScreen('venues');
}

// ===== 開催場クリック時 =====
function openVenue(vName) {
  currentVenue = vName;
  const venueData = DATA[vName];
  SCREEN_RACES.innerHTML = '';

  const title = document.createElement('h2');
  title.textContent = `${vName} のレース一覧`;
  SCREEN_RACES.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'races-grid';

  if (venueData.races) {
    venueData.races.forEach(race => {
      const btn = document.createElement('div');
      btn.className = 'race-btn';
      btn.textContent = `${race.no}R`;
      btn.addEventListener('click', () => openRace(vName, race.no));
      grid.appendChild(btn);
    });
  }

  SCREEN_RACES.appendChild(grid);
  showScreen('races');
}

// ===== レース詳細 =====
function openRace(vName, raceNo) {
  currentRace = raceNo;
  SCREEN_RACE.innerHTML = '';

  const vData = DATA[vName];
  const raceData = vData.races.find(r => r.no === raceNo);
  const hist = HISTORY?.[vName]?.[raceNo] || {};

  const card = document.createElement('div');
  card.className = 'card';

  const title = document.createElement('h2');
  title.textContent = `${vName} 第${raceNo}R`;
  card.appendChild(title);

  // --- 出走表 ---
  const table = document.createElement('table');
  table.className = 'table';
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>枠</th><th>選手</th><th>F</th>
      <th>全国</th><th>当地</th><th>モーター</th><th>コース</th><th>評価</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  raceData.entries.forEach(e => {
    const tr = document.createElement('tr');
    tr.className = `row-${e.waku}`;
    tr.innerHTML = `
      <td>${e.waku}</td>
      <td>
        <div class="entry-left">
          <div class="klass">${e.klass || ''}</div>
          <div class="name">${e.name}</div>
          <div class="st">ST:${e.st || '-'}</div>
        </div>
      </td>
      <td>${e.f || 'ー'}</td>
      <td>${e.national || '-'}</td>
      <td>${e.local || '-'}</td>
      <td>${e.motor || '-'}</td>
      <td>${e.course || '-'}</td>
      <td><span class="metric-symbol">${e.eval || '-'}</span></td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  card.appendChild(table);

  // --- AI予測 ---
  const aiBlock = document.createElement('div');
  aiBlock.className = 'ai-block';

  // 本命
  const col1 = document.createElement('div');
  col1.className = 'ai-col';
  col1.innerHTML = `<div class="h3">AI本命予想</div>
    <table class="prediction">
      ${(raceData.ai_main || []).map(p => `<tr><td>${p}</td></tr>`).join('')}
    </table>`;

  // 穴
  const col2 = document.createElement('div');
  col2.className = 'ai-col';
  col2.innerHTML = `<div class="h3">AI穴予想</div>
    <table class="prediction">
      ${(raceData.ai_ana || []).map(p => `<tr><td>${p}</td></tr>`).join('')}
    </table>`;

  // コメント
  const col3 = document.createElement('div');
  col3.className = 'ai-col';
  col3.innerHTML = `<div class="h3">AI展開コメント</div>
    <div>${raceData.comment || '-'}</div>`;

  aiBlock.appendChild(col1);
  aiBlock.appendChild(col2);
  aiBlock.appendChild(col3);
  card.appendChild(aiBlock);

  // --- AI順位予測 ---
  if (raceData.prediction) {
    const predDiv = document.createElement('div');
    predDiv.className = 'card';
    predDiv.innerHTML = `<div class="h3">AI順位予測</div>
      ${raceData.prediction.join(' → ')}`;
    card.appendChild(predDiv);
  }

  // --- 結果 ---
  if (hist && hist.result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'card';
    resultDiv.innerHTML = `
      <div class="h3">レース結果</div>
      <div>着順: ${hist.result.join('-')}</div>
      <div>決まり手: ${hist.style || '-'}</div>
    `;
    card.appendChild(resultDiv);
  }

  SCREEN_RACE.appendChild(card);
  showScreen('race');
}

// ===== 画面切り替え =====
function showScreen(name) {
  SCREEN_VENUES.classList.remove('active');
  SCREEN_RACES.classList.remove('active');
  SCREEN_RACE.classList.remove('active');
  if (name === 'venues') SCREEN_VENUES.classList.add('active');
  if (name === 'races') SCREEN_RACES.classList.add('active');
  if (name === 'race') SCREEN_RACE.classList.add('active');
}

// ===== ボタン動作 =====
refreshBtn.addEventListener('click', loadData);
backBtn.addEventListener('click', () => {
  if (SCREEN_RACE.classList.contains('active')) {
    showScreen('races');
  } else if (SCREEN_RACES.classList.contains('active')) {
    showScreen('venues');
  }
});

// ===== 初期化 =====
loadData();