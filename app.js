const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const globalHit = document.getElementById('globalHit');
const refreshBtn = document.getElementById('refreshBtn');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_RACE   = document.getElementById('screen-race');
const SCREEN_ENTRY  = document.getElementById('screen-race-entry');

const entryList     = document.getElementById('entry-list');
const aiPredictions = document.getElementById('ai-predictions');
const aiComments    = document.getElementById('ai-comments');

// 初期表示
showScreen(SCREEN_VENUES);

function showScreen(target) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE, SCREEN_ENTRY].forEach(s => s.classList.add('hidden'));
  target.classList.remove('hidden');
}

// 出走表の表示
async function loadEntry(raceId) {
  const res = await fetch('data.json');
  const data = await res.json();
  const raceData = data.entries[raceId];
  if (!raceData) return;

  entryList.innerHTML = '';
  raceData.entries.forEach(e => {
    const row = document.createElement('div');
    row.className = `entry-row color-${e.num}`;
    row.innerHTML = `
      <span class="entry-num">${e.num}</span>
      <span class="entry-name">
        ${e.grade}<br>
        ${e.name}<br>
        ST ${e.st}
      </span>
      <span class="entry-info">${e.f || 'ー'}</span>
      <span class="entry-info">当地 ${e.local}</span>
      <span class="entry-info">MT ${e.motor}</span>
      <span class="entry-info">ｺｰｽ ${e.course}</span>
      <span class="entry-info">評価 ${e.eval}</span>
    `;
    entryList.appendChild(row);
  });

  // 予想
  aiPredictions.innerHTML = `
    <div style="display:flex; justify-content:space-between;">
      <div>
        <strong>本命</strong><br>
        ${raceData.pred.main.map(p => `<div class="ai-pred-row">${p.set} <span>${p.rate}%</span></div>`).join('')}
      </div>
      <div>
        <strong>穴目</strong><br>
        ${raceData.pred.ana.map(p => `<div class="ai-pred-row">${p.set} <span>${p.rate}%</span></div>`).join('')}
      </div>
    </div>
  `;

  // コメント
  aiComments.innerHTML = raceData.comments.map(c => 
    `<div class="ai-comment-row">${c.num}=${c.text}</div>`
  ).join('');

  showScreen(SCREEN_ENTRY);
}