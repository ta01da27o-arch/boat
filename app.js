const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const globalHit = document.getElementById('globalHit'); // タイトル下の枠
const refreshBtn = document.getElementById('refreshBtn');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_RACE   = document.getElementById('screen-race');

let raceData = {};
let currentDate = "";

// -----------------------------
// データ取得
// -----------------------------
async function loadData() {
  try {
    const response = await fetch("data.json?_=" + Date.now()); // キャッシュ防止
    raceData = await response.json();

    // 今日の日付を表示
    if (raceData.today && raceData.today.length > 0) {
      currentDate = raceData.today[0].race_date;
      todayLabel.textContent = `本日 (${currentDate})`;
    }

    // 総合的中率をタイトル枠内に表示
    if (raceData.stats) {
      globalHit.textContent = `総合的中率：${raceData.stats.hit_rate}%`;
    } else {
      globalHit.textContent = "総合的中率：--%";
    }

    renderVenues();
  } catch (e) {
    console.error("データ読み込み失敗:", e);
  }
}

// -----------------------------
// 会場ごとの的中率を計算
// -----------------------------
function calcVenueHitRate(stadium) {
  if (!raceData.today) return "--";
  const races = raceData.today.filter(r => r.race_stadium_number == stadium);
  if (races.length === 0) return "--";

  let hitCount = 0;
  races.forEach(race => {
    if (race.ai_prediction && race.result) {
      if (race.ai_prediction.some(pred => race.result.includes(pred))) {
        hitCount++;
      }
    }
  });

  return ((hitCount / races.length) * 100).toFixed(1);
}

// -----------------------------
// メイン画面（競艇場一覧）描画
// -----------------------------
function renderVenues() {
  SCREEN_VENUES.innerHTML = "";

  if (!raceData.today || raceData.today.length === 0) {
    SCREEN_VENUES.innerHTML = "<p>本日のレースデータはありません</p>";
    return;
  }

  // 今日開催されている会場番号一覧
  const activeVenues = new Set(
    raceData.today.map(r => r.race_stadium_number)
  );

  // 全24場をループ
  for (let stadium = 1; stadium <= 24; stadium++) {
    const div = document.createElement("div");
    div.className = "venue-card";

    const hitRate = calcVenueHitRate(stadium);

    if (activeVenues.has(stadium)) {
      // 開催中
      div.innerHTML = `
        <h3>${stadium}号艇場</h3>
        <p>開催中</p>
        <p>${hitRate}%</p>
      `;
      div.addEventListener("click", () => renderRaces(stadium));
    } else {
      // 非開催 または レース終了
      div.innerHTML = `
        <h3>${stadium}号艇場</h3>
        <p style="color:gray;">ー</p>
        <p>${hitRate}%</p>
      `;
      div.style.opacity = 0.5; // グレーアウト
    }

    SCREEN_VENUES.appendChild(div);
  }
}

// -----------------------------
// レース番号画面
// -----------------------------
function renderRaces(stadium) {
  SCREEN_RACES.innerHTML = `<h2>${stadium}号艇場 - レース一覧</h2>`;

  const races = raceData.today.filter(r => r.race_stadium_number == stadium);

  races.forEach(race => {
    const div = document.createElement("div");
    div.className = "race-card";
    div.textContent = `${race.race_number}R`;
    div.addEventListener("click", () => renderRaceDetail(race));
    SCREEN_RACES.appendChild(div);
  });

  showScreen(SCREEN_RACES);
}

// -----------------------------
// 出走表画面
// -----------------------------
function renderRaceDetail(race) {
  SCREEN_RACE.innerHTML = `
    <h2>${race.race_stadium_number}号艇場 - ${race.race_number}R</h2>
    <p>AI予想: ${race.ai_prediction.join(", ")}</p>
    <p>結果: ${race.result.join(", ")}</p>
  `;

  showScreen(SCREEN_RACE);
}

// -----------------------------
// 画面切り替え
// -----------------------------
function showScreen(screen) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.style.display = "none");
  screen.style.display = "block";
}

// -----------------------------
// 初期化
// -----------------------------
refreshBtn.addEventListener("click", loadData);

// 初回ロード
loadData();