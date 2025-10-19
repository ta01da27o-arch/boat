// app.js
const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const refreshBtn = document.getElementById('refreshBtn');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES = document.getElementById('screen-races');
const SCREEN_RACE = document.getElementById('screen-race');

let raceData = [];
let currentVenue = null;

// 24場一覧
const VENUES = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

// 日付を表示
todayLabel.textContent = new Date().toISOString().slice(0,10).replace(/-/g,"/");

// 画面切替
function showScreen(screen) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

// データ取得
async function loadData() {
  try {
    const res = await fetch("./data/data.json?_t=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    raceData = await res.json();
    renderVenues();
  } catch (e) {
    VIEW.innerHTML = `<p style="color:red;font-weight:bold;">データ取得に失敗しました。</p>`;
    console.error(e);
  }
}

// 24場グリッド表示
function renderVenues() {
  showScreen(SCREEN_VENUES);
  const grid = VENUES.map(v => {
    const hasData = raceData.some(r => r.venue === v);
    const clickable = hasData ? "clickable" : "disabled";
    return `
      <div class="venue-card ${clickable}" data-venue="${v}">
        <div class="v-name">${v}</div>
        <div class="v-status">${hasData ? "開催中" : "休止中"}</div>
      </div>
    `;
  }).join("");
  SCREEN_VENUES.innerHTML = `<div class="venues-grid">${grid}</div>`;

  // イベント
  document.querySelectorAll('.venue-card.clickable').forEach(card => {
    card.addEventListener('click', () => {
      currentVenue = card.dataset.venue;
      renderRaces(currentVenue);
    });
  });
}

// レース一覧
function renderRaces(venue) {
  showScreen(SCREEN_RACES);
  const list = raceData.filter(r => r.venue === venue);
  const grid = list.map(r => `
    <div class="race-btn" data-race="${r.race}">
      ${venue} 第${r.race}R<br>
      <small>風:${r.wind}m 波:${r.wave}m</small>
    </div>
  `).join("");
  SCREEN_RACES.innerHTML = `
    <button class="btn back">← 戻る</button>
    <h2>${venue} のレース</h2>
    <div class="races-grid">${grid}</div>
  `;
  SCREEN_RACES.querySelector('.btn.back').onclick = () => renderVenues();
  SCREEN_RACES.querySelectorAll('.race-btn').forEach(btn => {
    btn.onclick = () => renderRaceDetail(venue, btn.dataset.race);
  });
}

// 各レース詳細
function renderRaceDetail(venue, raceNo) {
  const race = raceData.find(r => r.venue === venue && r.race == raceNo);
  if (!race) return;
  showScreen(SCREEN_RACE);
  SCREEN_RACE.innerHTML = `
    <button class="btn back">← 戻る</button>
    <h2>${venue} 第${race.race}R</h2>
    <div class="card">
      <p><b>日付:</b> ${race.date}</p>
      <p><b>風速:</b> ${race.wind} m</p>
      <p><b>波高:</b> ${race.wave} m</p>
      <p><b>結果:</b> ${race.result}</p>
    </div>
  `;
  SCREEN_RACE.querySelector('.btn.back').onclick = () => renderRaces(venue);
}

// 手動更新ボタン
refreshBtn.addEventListener('click', loadData);

// 初回ロード
loadData();