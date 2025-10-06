import { analyzeRace } from './ai_engine.js';

const SCREENS = {
  venues: document.getElementById('screen-venues'),
  races: document.getElementById('screen-races'),
  detail: document.getElementById('screen-detail')
};

const venuesGrid = document.getElementById('venuesGrid');
const racesGrid = document.getElementById('racesGrid');
const entryTableBody = document.querySelector('#entryTable tbody');
const aiMainBody = document.querySelector('#aiMain tbody');
const aiSubBody = document.querySelector('#aiSub tbody');
const commentTableBody = document.querySelector('#commentTable tbody');
const rankingTableBody = document.querySelector('#rankingTable tbody');

const backToVenues = document.getElementById('backToVenues');
const backToRaces = document.getElementById('backToRaces');
const dateLabel = document.getElementById('dateLabel');

let allData = [];
let grouped = {};
let currentVenue = null;
let currentRace = null;

document.getElementById('refreshBtn').addEventListener('click', init);

async function init() {
  dateLabel.textContent = new Date().toLocaleDateString('ja-JP');
  const res = await fetch('./data.json');
  allData = await res.json();

  // JSON配列を venue/race 構造に変換
  grouped = {};
  for (const race of allData) {
    const venueNo = race.race_stadium_number;
    if (!grouped[venueNo]) grouped[venueNo] = {};
    grouped[venueNo][race.race_number] = race;
  }

  renderVenues();
}

// === 会場一覧 ===
function renderVenues() {
  const venues = [
    "桐生","戸田","江戸川","平和島","多摩川",
    "浜名湖","蒲郡","常滑","津","三国",
    "びわこ","住之江","尼崎","鳴門","丸亀",
    "児島","宮島","徳山","下関","若松",
    "芦屋","福岡","唐津","大村"
  ];
  venuesGrid.innerHTML = '';
  venues.forEach((v, i) => {
    const btn = document.createElement('div');
    btn.className = 'venue-card clickable';
    btn.innerHTML = `<div class="v-name">${v}</div>`;
    btn.onclick = () => openVenue(i + 1, v);
    venuesGrid.appendChild(btn);
  });
  switchScreen('venues');
}

function openVenue(num, name) {
  currentVenue = num;
  document.getElementById('venueTitle').textContent = name;
  renderRaces(num);
  switchScreen('races');
}

// === レース一覧 ===
function renderRaces(venueNo) {
  const races = grouped[venueNo] || {};
  racesGrid.innerHTML = '';
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement('div');
    btn.className = 'race-btn';
    btn.textContent = `${i}R`;
    btn.onclick = races[i] ? () => openRace(venueNo, i) : null;
    if (!races[i]) btn.classList.add('disabled');
    racesGrid.appendChild(btn);
  }
}

backToVenues.onclick = () => switchScreen('venues');
backToRaces.onclick = () => switchScreen('races');

function switchScreen(target) {
  Object.values(SCREENS).forEach(s => s.classList.remove('active'));
  SCREENS[target].classList.add('active');
}

// === 出走表表示 ===
async function openRace(venueNo, raceNo) {
  const race = grouped[venueNo][raceNo];
  if (!race) return;
  currentRace = race;
  document.getElementById('raceTitle').textContent = `${raceNo}R ${race.race_title}`;

  const players = race.boats || [];
  entryTableBody.innerHTML = players.map(p => {
    const localWin = `${(p.racer_local_top_3_percent / 10).toFixed(1)}割`;
    const motor = `${p.racer_assigned_motor_top_2_percent.toFixed(1)}%`;
    const course = `${p.racer_assigned_boat_top_3_percent.toFixed(1)}%`;
    return `
      <tr class="row-${p.racer_boat_number}">
        <td>${p.racer_boat_number}</td>
        <td>${p.racer_name}</td>
        <td>${["A1","A2","B1","B2"][p.racer_class_number-1] || "-"}</td>
        <td>${localWin}</td>
        <td>${motor}</td>
        <td>${course}</td>
        <td>◎</td>
      </tr>`;
  }).join('');

  // === AI解析 ===
  const ai = await analyzeRace(players);
  renderPrediction(aiMainBody, ai.main);
  renderPrediction(aiSubBody, ai.sub);
  renderComments(ai.comments);
  renderRanking(ai.ranks);

  switchScreen('detail');
}

// === AI描画 ===
function renderPrediction(target, list) {
  target.innerHTML = list.map(l =>
    `<tr><td>${l.combo}</td><td>${(l.rate*100).toFixed(1)}%</td></tr>`
  ).join('');
}

function renderComments(list) {
  commentTableBody.innerHTML = list.map(c => {
    const strengthColor = c.strength > 0.7 ? '#e11d48'
      : c.strength > 0.4 ? '#0b74c9' : '#6b7280';
    return `<tr>
      <td>${c.waku}</td>
      <td style="color:${strengthColor}; font-weight:700;">${c.text}</td>
    </tr>`;
  }).join('');
}

function renderRanking(list) {
  rankingTableBody.innerHTML = list.map(r =>
    `<tr><td>${r.rank}</td><td>${r.waku}</td><td>${r.name}</td><td>${r.score}</td></tr>`
  ).join('');
}

init();