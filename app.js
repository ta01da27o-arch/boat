// ==============================================
//  app.js（完全統合版）①／③
//  コメント強弱機能 + 既存構成維持 + 視覚効果対応
// ==============================================

const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const globalHit = document.getElementById('globalHit');
const refreshBtn = document.getElementById('refreshBtn');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_RACE   = document.getElementById('screen-race');

let jsonData = null;
let raceData = null;

// ====== 日付表示 ======
function setToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  todayLabel.textContent = `${y}-${m}-${d}`;
}
setToday();

// ====== JSONデータ取得 ======
async function loadData() {
  try {
    const res = await fetch('data.json?_=' + new Date().getTime());
    jsonData = await res.json();
    console.log('✅ JSON読込成功', jsonData);
    renderVenues();
  } catch (err) {
    console.error('❌ JSON読込失敗:', err);
    VIEW.innerHTML = '<p class="error">データの読込に失敗しました。</p>';
  }
}

// ====== 開催場リスト描画 ======
function renderVenues() {
  SCREEN_VENUES.style.display = 'block';
  SCREEN_RACES.style.display = 'none';
  SCREEN_RACE.style.display  = 'none';

  const uniqueStadiums = [...new Set(jsonData.map(r => r.race_stadium_number))];
  SCREEN_VENUES.innerHTML = '<h2>開催場一覧</h2>';

  uniqueStadiums.forEach(staNum => {
    const btn = document.createElement('button');
    btn.textContent = `場コード ${staNum}`;
    btn.className = 'venue-btn';
    btn.onclick = () => renderRaces(staNum);
    SCREEN_VENUES.appendChild(btn);
  });
}

// ====== レース一覧 ======
function renderRaces(stadiumNum) {
  SCREEN_VENUES.style.display = 'none';
  SCREEN_RACES.style.display = 'block';
  SCREEN_RACE.style.display  = 'none';

  const races = jsonData.filter(r => r.race_stadium_number === stadiumNum);
  SCREEN_RACES.innerHTML = `<h2>場コード ${stadiumNum} のレース</h2>`;

  races.forEach(race => {
    const div = document.createElement('div');
    div.className = 'race-card';
    div.innerHTML = `
      <h3>${race.race_number}R ${race.race_title}</h3>
      <p>${race.race_subtitle}／距離: ${race.race_distance}m</p>
      <button class="race-btn">出走表を見る</button>
    `;
    div.querySelector('button').onclick = () => showRaceDetail(race);
    SCREEN_RACES.appendChild(div);
  });
}

// ====== レース詳細表示 ======
function showRaceDetail(race) {
  SCREEN_VENUES.style.display = 'none';
  SCREEN_RACES.style.display = 'none';
  SCREEN_RACE.style.display  = 'block';

  raceData = race;
  SCREEN_RACE.innerHTML = `
    <h2>${race.race_title}</h2>
    <p>${race.race_subtitle}</p>
    <p>締切時刻：${race.race_closed_at}</p>
    <div id="boat-list"></div>
    <div id="comment-section"></div>
    <button id="backRaces">← 戻る</button>
  `;
  document.getElementById('backRaces').onclick = () => renderRaces(race.race_stadium_number);
  renderBoats(race.boats);
}
// ==============================================
//  app.js（完全統合版）②／③
//  ボート一覧 + コメント強弱ロジック
// ==============================================

// ====== ボート一覧描画 ======
function renderBoats(boats) {
  const list = document.getElementById('boat-list');
  list.innerHTML = '';

  boats.forEach((b, i) => {
    const row = document.createElement('div');
    row.className = 'boat-row';
    row.innerHTML = `
      <div class="boat-no">${b.racer_boat_number}</div>
      <div class="boat-name">${b.racer_name}</div>
      <div class="boat-rate">平均ST:${b.racer_average_start_timing}</div>
      <div class="boat-rate">全国1着:${b.racer_national_top_1_percent}%</div>
      <div class="boat-rate">モーター2連:${b.racer_assigned_motor_top_2_percent}%</div>
      <div class="boat-rate">ボート3連:${b.racer_assigned_boat_top_3_percent}%</div>
      <div class="comment-box" id="comment-${i}"></div>
    `;
    list.appendChild(row);

    // コメント生成
    const comment = generateCommentStrength(b);
    const box = document.getElementById(`comment-${i}`);
    box.textContent = comment.text;
    box.classList.add(comment.strength);
  });
}

// ====== コメント強弱生成ロジック ======
function generateCommentStrength(b) {
  let score = 0;

  // 成績と機力をスコア化
  score += (50 - b.racer_average_start_timing * 100); // STが速いほど加点
  score += b.racer_national_top_1_percent * 1.2;
  score += b.racer_national_top_3_percent * 0.8;
  score += b.racer_assigned_motor_top_3_percent;
  score += b.racer_assigned_boat_top_3_percent;

  // コメントパターン
  const strongComments = [
    "仕上がり上々！展開次第で突き抜けも十分！",
    "スタート決まれば頭も狙える勢い！",
    "舟足のまとまり良く、連争い有力！",
    "モーター◎、出足抜群！",
    "気配抜群、ここは主役候補！"
  ];

  const normalComments = [
    "展開ひとつで浮上の余地あり。",
    "乗り心地上向き、注意が必要。",
    "足は悪くないが、相手次第。",
    "ターンでの押し感はまずまず。",
    "中堅上位クラス、展開次第。"
  ];

  const weakComments = [
    "行き足に課題、厳しい戦いか。",
    "舟足一息、上位は苦しい。",
    "ターン流れ気味、調整必要。",
    "足負け感あり、展開待ち。",
    "リズム悪く見送り妥当。"
  ];

  let strength = '';
  let commentText = '';

  if (score > 220) {
    strength = 'strong';
    commentText = strongComments[Math.floor(Math.random() * strongComments.length)];
  } else if (score > 170) {
    strength = 'normal';
    commentText = normalComments[Math.floor(Math.random() * normalComments.length)];
  } else {
    strength = 'weak';
    commentText = weakComments[Math.floor(Math.random() * weakComments.length)];
  }

  return { text: commentText, strength };
}
// ==============================================
//  app.js（完全統合版）③／③
//  コメント強弱スタイル適用 + イベント制御
// ==============================================

// ====== コメント強弱に応じた色付け ======
function applyCommentStyle() {
  const comments = document.querySelectorAll('.comment-box');
  comments.forEach(c => {
    if (c.classList.contains('strong')) {
      c.style.backgroundColor = 'rgba(255, 100, 100, 0.25)';
      c.style.fontWeight = 'bold';
    } else if (c.classList.contains('normal')) {
      c.style.backgroundColor = 'rgba(255, 255, 150, 0.25)';
    } else if (c.classList.contains('weak')) {
      c.style.backgroundColor = 'rgba(200, 200, 200, 0.25)';
      c.style.color = '#666';
    }
  });
}

// ====== AI買い目・展開予測連動 ======
function renderAIPredictions(predictions) {
  const aiArea = document.getElementById('ai-predictions');
  if (!aiArea) return;
  aiArea.innerHTML = '';

  predictions.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'ai-item';
    div.innerHTML = `
      <div class="ai-rank">${i + 1}位</div>
      <div class="ai-combo">${p.combo}</div>
      <div class="ai-comment">${p.comment}</div>
    `;
    aiArea.appendChild(div);
  });
}

// ====== データロード＆画面生成 ======
async function loadRaceData() {
  try {
    const res = await fetch('data.json');
    const data = await res.json();
    if (!data || !Array.isArray(data)) throw new Error('データ不明');

    const race = data[0];
    document.getElementById('race-title').textContent = race.race_title;
    document.getElementById('race-subtitle').textContent = race.race_subtitle;

    renderBoats(race.boats);
    applyCommentStyle();

    // 仮AI買い目生成（将来ai_engine.jsと連動）
    const predictions = race.boats.slice(0, 3).map((b, i) => ({
      combo: `${b.racer_boat_number}-全-${i + 1}`,
      comment: `展開◎ ${b.racer_name}中心の攻め！`
    }));
    renderAIPredictions(predictions);
  } catch (err) {
    console.error('データ読み込み失敗:', err);
  }
}

// ====== リロードボタン ======
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    loadRaceData();
  });
}

// ====== 初期ロード ======
window.addEventListener('DOMContentLoaded', () => {
  loadRaceData();
});