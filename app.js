const view = document.getElementById("view");
const todayLabel = document.getElementById("todayLabel");
const refreshBtn = document.getElementById("refreshBtn");

const screenVenues = document.getElementById("screen-venues");
const screenRaces  = document.getElementById("screen-races");
const screenRace   = document.getElementById("screen-race");

// 📅 日付表示
const now = new Date();
todayLabel.textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

// 画面切替
function showScreen(name) {
  [screenVenues, screenRaces, screenRace].forEach(el => el.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");
}

// データ読み込み
async function loadData() {
  try {
    const res = await fetch("/api/data");
    const data = await res.json();
    renderVenues(data);
  } catch (e) {
    screenVenues.innerHTML = `<div class="no-result">データ取得に失敗しました</div>`;
  }
}

// 場データ描画
function renderVenues(data) {
  if (!data || data.length === 0) {
    screenVenues.innerHTML = `<div class="no-result">現在開催中のレースはありません</div>`;
    return;
  }

  const html = `
    <div class="venues-grid">
      ${data.map(v => `
        <div class="venue-card clickable" onclick="showRaces('${v.venue}')">
          <div class="v-name">${v.venue}</div>
          <div class="v-status">風 ${v.wind}m</div>
          <div class="v-rate">波 ${v.wave}cm</div>
        </div>
      `).join('')}
    </div>`;
  screenVenues.innerHTML = html;
}

// 仮レース画面（今後AI予測に差し替え）
function showRaces(venue) {
  showScreen("races");
  screenRaces.innerHTML = `
    <div class="card">
      <button class="btn back" onclick="showScreen('venues')">← 戻る</button>
      <h2>${venue} レース一覧</h2>
      <div class="races-grid">
        ${[...Array(12).keys()].map(i => `<div class="race-btn">第${i + 1}R</div>`).join('')}
      </div>
    </div>
  `;
}

refreshBtn.onclick = loadData;

// 初回読み込み
loadData();