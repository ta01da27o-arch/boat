// =====================================================
// 競艇AI予想アプリ - 完全統合版 app.js（前半）
// バージョン：2025-10-13
// 機能：AI予測・コメント・的中率＋最新結果自動反映
// =====================================================

// 要素取得
const todayLabel = document.getElementById('todayLabel');
const refreshBtn = document.getElementById('refreshBtn');
const raceContainer = document.getElementById('raceContainer');
const rankingTable = document.getElementById('rankingTable').querySelector('tbody');
const resultTable = document.getElementById('resultTable').querySelector('tbody');
const resultNote = document.getElementById('resultNote');

// 現在日付を取得
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const todayStr = `${yyyy}${mm}${dd}`;

// 前日を取得
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const yyyy_y = yesterday.getFullYear();
const mm_y = String(yesterday.getMonth() + 1).padStart(2, '0');
const dd_y = String(yesterday.getDate()).padStart(2, '0');
const yesterdayStr = `${yyyy_y}${mm_y}${dd_y}`;

// データファイル指定
const DATA_FILE = 'data.json';
const HISTORY_FILE = 'history.json';

// 初期化
async function init() {
  todayLabel.textContent = `📅 ${yyyy}年${mm}月${dd}日 のAI展開予想`;
  await loadRaceData();
  await loadLatestResults();
}

// ===== レースデータ取得（出走表・AI予測） =====
async function loadRaceData() {
  try {
    const res = await fetch(DATA_FILE + '?t=' + Date.now());
    const data = await res.json();
    const raceData = data[todayStr];

    if (!raceData || !raceData.races) {
      raceContainer.innerHTML = `<div class="note">本日の出走データはまだ取得されていません。</div>`;
      return;
    }

    // 出走表を生成
    renderRaceList(raceData.races);
  } catch (e) {
    console.error('レースデータ取得エラー:', e);
  }
}

// ===== レース一覧表示 =====
function renderRaceList(races) {
  raceContainer.innerHTML = '';
  races.forEach(race => {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <div class="h3">🏁 ${race.race_stadium_name} ${race.race_number}R</div>
      <table class="table small">
        <thead>
          <tr><th>艇</th><th>選手名</th><th>支部</th><th>勝率</th><th>展開</th></tr>
        </thead>
        <tbody>
          ${race.entries.map(e => `
            <tr>
              <td>${e.boat}</td>
              <td>${e.name}</td>
              <td>${e.branch}</td>
              <td>${e.rate}</td>
              <td>${e.comment}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    raceContainer.appendChild(div);
  });
}

// ===== AI順位予測（rankingTable） =====
async function loadAiRanking() {
  try {
    const res = await fetch(DATA_FILE + '?t=' + Date.now());
    const data = await res.json();
    const raceData = data[todayStr];

    if (!raceData || !raceData.predictions) {
      rankingTable.innerHTML = `<tr><td colspan="4">AI予測データがありません。</td></tr>`;
      return;
    }

    rankingTable.innerHTML = raceData.predictions.map((p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p.boat}</td>
        <td>${p.name}</td>
        <td>${p.score}</td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('AI予測データ取得エラー:', e);
  }
}

// ===== 最新レース結果（history.jsonから） =====
async function loadLatestResults() {
  try {
    const res = await fetch(HISTORY_FILE + '?t=' + Date.now());
    const history = await res.json();

    // 最新日付を判定（本日→なければ前日）
    let latestDate = null;
    if (history[todayStr]) {
      latestDate = todayStr;
      resultNote.textContent = `📊 本日(${yyyy}/${mm}/${dd})のレース結果を表示中`;
    } else if (history[yesterdayStr]) {
      latestDate = yesterdayStr;
      resultNote.textContent = `📊 前日(${yyyy_y}/${mm_y}/${dd_y})のレース結果を表示中`;
    } else {
      resultTable.innerHTML = `<tr><td colspan="4">結果データがまだありません。</td></tr>`;
      resultNote.textContent = '※ 本日および前日の結果データが未取得です';
      return;
    }

    const results = history[latestDate].results || [];
    renderResults(results);
  } catch (e) {
    console.error('結果データ取得エラー:', e);
    resultTable.innerHTML = `<tr><td colspan="4">結果データを取得できませんでした。</td></tr>`;
  }
}

// ===== 結果テーブル生成 =====
function renderResults(results) {
  if (!results.length) {
    resultTable.innerHTML = `<tr><td colspan="4">レース結果がありません。</td></tr>`;
    return;
  }

  // 最新レースのみ表示（例：最終レース）
  const latest = results[results.length - 1];
  const boats = latest.boats;

  resultTable.innerHTML = boats.map(b => `
    <tr>
      <td>${b.racer_place_number}</td>
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_name}</td>
      <td>${b.racer_start_timing.toFixed(2)}</td>
    </tr>
  `).join('');
}
<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>競艇AI予想</title>
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" href="favicon.ico" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="app-header">
    <div class="title-wrap">
      <h1 class="app-title">競艇AI予想</h1>
      <div class="meta-row">
        <div id="dateLabel" class="date-label">--/--/----</div>
        <div class="tabs">
          <button id="todayBtn" class="tab active">本日</button>
          <button id="yesterdayBtn" class="tab">前日</button>
        </div>
      </div>
    </div>
    <div class="header-right">
      <button id="refreshBtn" class="btn refresh">更新</button>
      <div id="aiStatus" class="ai-status">AI学習中...</div>
    </div>
  </header>

  <main class="view">
    <!-- 24場一覧：横4 x 縦6 固定 -->
    <section id="screen-venues" class="screen active">
      <div class="card">
        <div id="venuesGrid" class="venues-grid" aria-live="polite"></div>
      </div>
    </section>

    <!-- レース番号画面（4 x 3 = 12ボタン） -->
    <section id="screen-races" class="screen">
      <div class="card screen-top">
        <div class="screen-title" id="venueTitle">-</div>
        <button id="backToVenues" class="btn back">戻る</button>
      </div>
      <div class="card">
        <div id="racesGrid" class="races-grid"></div>
      </div>
    </section>

    <!-- 出走表 -->
    <section id="screen-detail" class="screen">
      <div class="card screen-top">
        <div class="screen-title" id="raceTitle">-</div>
        <button id="backToRaces" class="btn back">戻る</button>
      </div>

      <!-- 出走表 -->
      <div class="card">
        <table class="table" id="entryTable">
          <thead>
            <tr>
              <th>艇</th>
              <th>級 / 選手名 / ST</th>
              <th>F</th>
              <th>全国</th>
              <th>当地</th>
              <th>MT</th>
              <th>コース</th>
              <th>評価</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>

      <!-- AI予想 -->
      <div class="card ai-block">
        <div class="ai-col">
          <div class="h3">AI 本命</div>
          <table class="table prediction" id="aiMain">
            <thead><tr><th>買い目</th><th>確率</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
        <div class="ai-col">
          <div class="h3">AI 穴</div>
          <table class="table prediction" id="aiSub">
            <thead><tr><th>買い目</th><th>確率</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>

      <!-- コース別コメント -->
      <div class="card">
        <div class="h3">展開予想コメント（1～6コース）</div>
        <table class="table" id="commentTable">
          <thead><tr><th>コース</th><th>コメント</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>

      <!-- AI順位予測 -->
      <div class="card">
        <div class="h3">AI 順位予測</div>
        <table class="table" id="rankingTable">
          <thead>
            <tr><th>順位</th><th>艇</th><th>選手名</th><th>評価値</th></tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>

      <!-- 🆕 レース結果（history.json） -->
      <div class="card">
        <div class="h3">📊 最新レース結果</div>
        <table class="table" id="resultTable">
          <thead>
            <tr>
              <th>着順</th>
              <th>艇</th>
              <th>選手名</th>
              <th>ST</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
        <div id="resultNote" class="note">※ 前日または本日終了レースを自動反映</div>
      </div>

      <!-- 🔽 AI 学習・自動生成連携セクション（hidden） -->
      <section id="aiEngine" class="hidden">
        <textarea id="aiLog" readonly></textarea>
      </section>

    </section>
  </main>

  <footer class="app-footer">© 2025 BOAT AI</footer>

  <!-- 必ず module で読み込む -->
  <script type="module" src="app.js"></script>
</body>
</html>