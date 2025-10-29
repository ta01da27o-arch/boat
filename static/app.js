// ===============================
//  app.js（最新版）
// ===============================

// --- HTML要素取得 ---
const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const refreshBtn = document.getElementById('refreshBtn');

// --- 日付表示 ---
const today = new Date();
const y = today.getFullYear();
const m = String(today.getMonth() + 1).padStart(2, '0');
const d = String(today.getDate()).padStart(2, '0');
todayLabel.textContent = `${y}/${m}/${d}`;

// --- JSONデータ取得 ---
async function loadRaceData() {
  try {
    const response = await fetch('data/data.json?_=' + Date.now()); // キャッシュ防止
    if (!response.ok) throw new Error('データ取得失敗');
    const data = await response.json();
    renderVenues(data);
  } catch (e) {
    console.error('❌ レースデータ取得エラー:', e);
    VIEW.innerHTML = `<p style="color:red;">データの読み込みに失敗しました。</p>`;
  }
}

// --- 24場データ表示 ---
function renderVenues(data) {
  VIEW.innerHTML = ''; // 一旦クリア

  data.forEach(item => {
    const div = document.createElement('div');
    div.className = 'venue-card';

    // 開催中判定（出走表が存在すれば開催中）
    const isOpen = item.races && item.races.length > 0;
    const status = isOpen ? '開催中' : 'ー';

    // 的中率（例：28%）
    const hitRate = item.hit_rate ? `${item.hit_rate}%` : 'ー';

    div.innerHTML = `
      <div class="venue-name">${item.venue}</div>
      <div class="venue-status">${status}</div>
      <div class="venue-hit">${hitRate}</div>
    `;

    // クリック時のイベント（レース詳細画面へ）
    div.addEventListener('click', () => {
      if (isOpen) showRaces(item);
    });

    VIEW.appendChild(div);
  });
}

// --- 出走表画面表示 ---
function showRaces(item) {
  VIEW.innerHTML = `
    <button id="backBtn">← 戻る</button>
    <h2>${item.venue} (${item.hit_rate}%)</h2>
  `;

  if (!item.races || item.races.length === 0) {
    VIEW.innerHTML += `<p>出走表データがありません。</p>`;
    return;
  }

  const list = document.createElement('ul');
  list.className = 'race-list';

  item.races.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.racer}（${r.mark}）`;
    list.appendChild(li);
  });

  VIEW.appendChild(list);

  // 戻るボタン
  document.getElementById('backBtn').addEventListener('click', () => loadRaceData());
}

// --- 更新ボタン ---
refreshBtn.addEventListener('click', loadRaceData);

// --- 初期表示 ---
loadRaceData();