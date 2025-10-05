// app.js — AI解析（買い目・コメント・順位予測）統合版
import { analyzeRace } from './ai_engine.js';

// HTML要素取得
const dateLabel = document.getElementById('dateLabel');
const refreshBtn = document.getElementById('refreshBtn');
const screenVenues = document.getElementById('screen-venues');
const screenRaces = document.getElementById('screen-races');
const screenDetail = document.getElementById('screen-detail');
const venuesGrid = document.getElementById('venuesGrid');
const racesGrid = document.getElementById('racesGrid');
const entryTable = document.getElementById('entryTable').querySelector('tbody');
const aiMain = document.getElementById('aiMain').querySelector('tbody');
const aiSub = document.getElementById('aiSub').querySelector('tbody');
const commentTable = document.getElementById('commentTable').querySelector('tbody');
const rankingTable = document.getElementById('rankingTable').querySelector('tbody');

// データ読み込み
let raceData = null;

async function fetchData() {
  const res = await fetch('data.json');
  raceData = await res.json();
  dateLabel.textContent = raceData.date || '--/--/----';
  renderVenues();
}

// === 24場一覧 ===
function renderVenues() {
  venuesGrid.innerHTML = '';
  raceData.venues.forEach(v => {
    const div = document.createElement('div');
    div.className = 'venue-card';
    div.innerHTML = `
      <div class="venue-name">${v.name}</div>
      <div class="venue-status">${v.status || '開催なし'}</div>
      <div class="venue-rate">${v.hitRate ? v.hitRate + '%' : '0%'}</div>
    `;
    div.addEventListener('click', () => openRaces(v));
    venuesGrid.appendChild(div);
  });
}

// === 開催場→レース番号一覧 ===
function openRaces(venue) {
  screenVenues.classList.remove('active');
  screenRaces.classList.add('active');
  const title = document.getElementById('venueTitle');
  title.textContent = venue.name;
  racesGrid.innerHTML = '';
  venue.races.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'race-btn';
    btn.textContent = `${r.number}R`;
    btn.addEventListener('click', () => openDetail(r));
    racesGrid.appendChild(btn);
  });
}

// === レース詳細 ===
async function openDetail(race) {
  screenRaces.classList.remove('active');
  screenDetail.classList.add('active');
  document.getElementById('raceTitle').textContent = `${race.number}R 出走表`;

  await loadRaceDetail(race);
}

// === AIエンジンによる解析 ===
async function loadRaceDetail(race) {
  const players = race.players || [];
  if (!players.length) return;

  // AI解析実行
  const ai = await analyzeRace(players);

  // 出走表表示
  renderEntryTable(players);

  // AI買い目
  renderPrediction("aiMain", ai.main);
  renderPrediction("aiSub", ai.sub);

  // 展開コメント
  renderComments(ai.comments);

  // AI順位予測
  renderRanking(ai.ranks);
}

// === 出走表 ===
function renderEntryTable(players) {
  entryTable.innerHTML = '';
  players.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = `lane-${p.lane}`;
    const bgColors = ['#fff', '#ddd', '#fbb', '#bbf', '#ff9', '#9f9'];
    tr.style.backgroundColor = bgColors[p.lane - 1];

    const localRate = p.localWinRate ? `${p.localWinRate.toFixed(1)}% = ${(p.localWinRate * 10).toFixed(0)}%( ${Math.floor(p.localWinRate)}割${Math.floor((p.localWinRate * 10) % 10)}分 )` : '-';
    const rank = p.rank || '-';

    tr.innerHTML = `
      <td>${p.lane}</td>
      <td>
        <div class="rank">${rank}</div>
        <div class="name">${p.name}</div>
        <div class="st">ST:${p.st || '-'}</div>
      </td>
      <td>${p.f || '-'}</td>
      <td>${localRate}</td>
      <td>${p.moment || '-'}</td>
      <td>${p.course || '-'}</td>
      <td>${p.eval || '-'}</td>
    `;
    entryTable.appendChild(tr);
  });
}

// === AI買い目テーブル ===
function renderPrediction(id, data) {
  const tbody = document.getElementById(id).querySelector('tbody');
  tbody.innerHTML = '';
  data.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d.combo}</td><td>${d.prob}%</td>`;
    tbody.appendChild(tr);
  });
}

// === 展開コメント ===
function renderComments(comments) {
  commentTable.innerHTML = '';
  comments.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.lane}</td><td>${c.comment}</td>`;
    commentTable.appendChild(tr);
  });
}

// === AI順位予測 ===
function renderRanking(ranks) {
  rankingTable.innerHTML = '';
  ranks.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.rank}</td><td>${r.lane}</td><td>${r.name}</td><td>${r.score}</td>`;
    rankingTable.appendChild(tr);
  });
}

// === 戻る操作 ===
document.getElementById('backToVenues').addEventListener('click', () => {
  screenRaces.classList.remove('active');
  screenVenues.classList.add('active');
});

document.getElementById('backToRaces').addEventListener('click', () => {
  screenDetail.classList.remove('active');
  screenRaces.classList.add('active');
});

// === 更新ボタン ===
refreshBtn.addEventListener('click', fetchData);

// === 初期実行 ===
fetchData();