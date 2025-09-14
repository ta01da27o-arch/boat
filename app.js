const raceListEl = document.getElementById("raceList");
const screenRaces = document.getElementById("screen-races");
const screenRace = document.getElementById("screen-race");
const raceTitleEl = document.getElementById("raceTitle");
const raceTableWrapper = document.getElementById("raceTableWrapper");
const aiPredictionList = document.getElementById("aiPredictionList");
const aiCommentEl = document.getElementById("aiComment");

// ダミーデータ (通常は data.json を fetch する)
const data = {
  "programs": [
    {
      "race_date": "2025-09-14",
      "race_stadium_number": 2,
      "race_number": 1,
      "race_title": "第41回 日本モーターボート選手会会長賞",
      "race_subtitle": "一般戦",
      "race_distance": 1800,
      "boats": [
        { "racer_boat_number": 1, "racer_name": "岡部 太郎", "racer_exhibit_time": "6.71" },
        { "racer_boat_number": 2, "racer_name": "佐藤 一郎", "racer_exhibit_time": "6.65" },
        { "racer_boat_number": 3, "racer_name": "田中 実", "racer_exhibit_time": "6.80" },
        { "racer_boat_number": 4, "racer_name": "山本 健", "racer_exhibit_time": "6.77" },
        { "racer_boat_number": 5, "racer_name": "中村 勇", "racer_exhibit_time": "6.69" },
        { "racer_boat_number": 6, "racer_name": "鈴木 修", "racer_exhibit_time": "6.74" }
      ]
    }
  ]
};

// 初期表示
function init() {
  raceListEl.innerHTML = "";
  data.programs.forEach(race => {
    const li = document.createElement("li");
    li.textContent = `${race.race_number}R ${race.race_title}`;
    li.onclick = () => showRace(race.race_stadium_number, race.race_number);
    raceListEl.appendChild(li);
  });
}
init();

// レース詳細表示
function showRace(stadium, number) {
  const race = data.programs.find(r => r.race_stadium_number === stadium && r.race_number === number);
  if (!race) return;

  screenRaces.classList.add("hidden");
  screenRace.classList.remove("hidden");

  raceTitleEl.textContent = `${race.race_number}R ${race.race_title} (${race.race_subtitle})`;

  // 出走表生成
  let table = `
    <table class="race-table">
      <tr>
        <th>枠</th><th>選手名</th><th>展示タイム</th><th>総合評価</th>
      </tr>
  `;
  race.boats.forEach(b => {
    table += `
      <tr class="waku-${b.racer_boat_number}">
        <td>${b.racer_boat_number}</td>
        <td>${b.racer_name}</td>
        <td>${b.racer_exhibit_time}</td>
        <td>ー</td>
      </tr>
    `;
  });
  table += "</table>";
  raceTableWrapper.innerHTML = table;

  // AI買い目予想 (ダミー)
  aiPredictionList.innerHTML = "";
  const dummyPredictions = ["1-2-3", "1-3-4", "2-1-5", "3-1-2"];
  dummyPredictions.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p;
    aiPredictionList.appendChild(li);
  });

  // AIコメント (ダミー)
  const dummyComments = [
    "1号艇のスピードが抜けており、逃げ切り濃厚。",
    "2号艇の差しが決まれば波乱もありそう。",
    "外枠勢も展開次第で頭も十分に狙える。"
  ];
  aiCommentEl.textContent = dummyComments[Math.floor(Math.random() * dummyComments.length)];
}

// 戻る
function backToRaces() {
  screenRace.classList.add("hidden");
  screenRaces.classList.remove("hidden");
}