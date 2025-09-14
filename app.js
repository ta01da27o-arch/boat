const mainScreen = document.getElementById("main-screen");
const raceListScreen = document.getElementById("race-list-screen");
const raceDetailScreen = document.getElementById("race-detail-screen");

const stadiumList = document.getElementById("stadium-list");
const raceList = document.getElementById("race-list");
const raceDetail = document.getElementById("race-detail");
const aiPredictions = document.getElementById("ai-predictions");
const aiComments = document.getElementById("ai-comments");

const backToMain = document.getElementById("back-to-main");
const backToRaceList = document.getElementById("back-to-race-list");

const todayBtn = document.getElementById("today-btn");
const yesterdayBtn = document.getElementById("yesterday-btn");
const refreshBtn = document.getElementById("refresh-btn");

const todayDateSpan = document.getElementById("today-date");

let raceData = [];
let currentDay = "today";
let selectedStadium = null;

const stadiumNames = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

// JSONロード
async function loadData() {
  try {
    const res = await fetch("data.json?cache=" + Date.now());
    const json = await res.json();
    raceData = json.races.programs || [];
    renderStadiums();
  } catch (e) {
    alert("データ取得失敗: " + e.message);
  }
}

// スタジアム一覧
function renderStadiums() {
  stadiumList.innerHTML = "";
  stadiumNames.forEach((name, idx) => {
    const div = document.createElement("div");
    div.className = "stadium-card";

    const hasRace = raceData.some(r => r.race_stadium_number === idx + 1);
    if (!hasRace) {
      div.classList.add("disabled");
    }

    div.innerHTML = `
      <div>${name}</div>
      <div>${hasRace ? "開催中" : "非開催"}</div>
      <div>${hasRace ? "ー%" : ""}</div>
    `;
    if (hasRace) {
      div.onclick = () => showRaces(idx + 1, name);
    }
    stadiumList.appendChild(div);
  });
}

// レース一覧
function showRaces(stadiumNumber, stadiumName) {
  mainScreen.classList.remove("active");
  raceListScreen.classList.add("active");
  document.getElementById("stadium-title").textContent = stadiumName;
  selectedStadium = stadiumNumber;

  raceList.innerHTML = "";
  const races = raceData.filter(r => r.race_stadium_number === stadiumNumber);
  races.forEach(race => {
    const div = document.createElement("div");
    div.className = "race-card";
    div.textContent = race.race_number + "R";
    div.onclick = () => showRaceDetail(race);
    raceList.appendChild(div);
  });
}

// 出走表
function showRaceDetail(race) {
  raceListScreen.classList.remove("active");
  raceDetailScreen.classList.add("active");

  document.getElementById("race-title").textContent =
    race.race_title + " " + race.race_number + "R";

  raceDetail.innerHTML = "";
  race.boats.forEach((boat, i) => {
    const row = document.createElement("div");
    row.className = `boat-row boat-${i+1}`;
    row.innerHTML = `
      <div>${boat.racer_boat_number}</div>
      <div>
        <div>[${boat.racer_class_number}]</div>
        <div>${boat.racer_name}</div>
        <div>ST:${boat.racer_average_start_timing}</div>
      </div>
      <div>${boat.racer_flying_count > 0 ? "F" : ""}</div>
      <div>${(boat.racer_local_win_rate || 0).toFixed(2)}</div>
      <div>${(boat.racer_motor2_win_rate || 0).toFixed(2)}</div>
      <div>${(boat.racer_course2_win_rate || 0).toFixed(2)}</div>
      <div>${getEvaluationSymbol(boat)}</div>
    `;
    raceDetail.appendChild(row);
  });

  renderAiPredictions(race);
  renderAiComments(race);
}

// 評価記号
function getEvaluationSymbol(boat) {
  const score = (1 / (boat.racer_average_start_timing || 0.2)) *
                (boat.racer_flying_count === 0 ? 1.2 : 0.8) *
                (boat.racer_local_win_rate || 1) *
                (boat.racer_motor2_win_rate || 1) *
                (boat.racer_course2_win_rate || 1);
  if (score > 20) return '<span style="color:red;">◎</span>';
  if (score > 10) return "○";
  if (score > 5) return "△";
  if (score > 2) return "✕";
  return "ー";
}

// AI予想
function renderAiPredictions(race) {
  aiPredictions.innerHTML = `
    <h3>AI買い目予想</h3>
    <table class="ai-table">
      <tr><th>本命</th><th>確率</th><th>穴</th><th>確率</th></tr>
      <tr><td>3-1-5</td><td>52%</td><td>4-1-3</td><td>12%</td></tr>
      <tr><td>3-1-2</td><td>45%</td><td>4-5-1</td><td>10%</td></tr>
      <tr><td>3-4-1</td><td>33%</td><td>5-1-3</td><td>9%</td></tr>
      <tr><td>3-4-5</td><td>25%</td><td>2-3-5</td><td>7%</td></tr>
      <tr><td>3-5-1</td><td>18%</td><td>2-5-1</td><td>4%</td></tr>
    </table>
  `;
}

// AIコメント（ランダム生成）
function renderAiComments(race) {
  aiComments.innerHTML = "<h3>AIコメント</h3>";

  const commentTemplates = [
    "今節のST絶好調❗内枠勢を抑えて一気に先手を取るか。",
    "モーターの仕上がり上々、展開ひとつで頭まで十分。",
    "ターン回り軽快、道中の伸び足にも期待できそう。",
    "近況のリズム良く、ここも差し切り十分❗",
    "展開頼みだが、捲り差しがハマれば一発あり。",
    "やや安定感に欠けるが、スタート決まれば怖い存在。",
  ];

  race.boats.forEach((boat, i) => {
    const p = document.createElement("p");
    const comment = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
    p.textContent = `${i+1}コース ${comment}`;
    aiComments.appendChild(p);
  });
}

// 戻るボタン
backToMain.onclick = () => {
  raceListScreen.classList.remove("active");
  mainScreen.classList.add("active");
};
backToRaceList.onclick = () => {
  raceDetailScreen.classList.remove("active");
  raceListScreen.classList.add("active");
};

// 本日/前日切替
todayBtn.onclick = () => {
  currentDay = "today";
  renderStadiums();
};
yesterdayBtn.onclick = () => {
  currentDay = "yesterday";
  renderStadiums();
};

// 更新
refreshBtn.onclick = () => {
  loadData();
};

// 日付表示
todayDateSpan.textContent = new Date().toLocaleDateString("ja-JP");

loadData();