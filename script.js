const app = document.getElementById("app");
const currentDate = document.getElementById("current-date");

// 今日の日付表示
const today = new Date();
currentDate.textContent = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

const kyoteiJoList = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

// 仮のデータ（モック）
const sampleRaceData = {
  "1R": {
    racers: [
      { waku: 1, grade: "A1", name: "田中太郎", st: "0.15", motor: "12 (2連20% / 3連35%)" },
      { waku: 2, grade: "B2", name: "佐藤次郎", st: "0.23", motor: "33 (2連15% / 3連25%)" },
      { waku: 3, grade: "A2", name: "鈴木三郎", st: "0.14", motor: "45 (2連40% / 3連55%)" },
    ],
    aiPrediction: [
      { bet: "3-1-4", prob: 32 },
      { bet: "3-1-5", prob: 25 },
      { bet: "3-4-1", prob: 20 },
      { bet: "3-4-5", prob: 15 },
      { bet: "3-5-1", prob: 8 }
    ],
    aiComment: [
      { course: "1コース", text: "スタートに不安あり。捲られる傾向が多い。" },
      { course: "2コース", text: "伸びに欠ける。序盤で遅れる可能性あり。" },
      { course: "3コース", text: "スタート決まっており舟足良好。捲り差し濃厚。" },
      { course: "4コース", text: "展開を突く動き。連下候補。" },
      { course: "5コース", text: "差し足伸び良く、上位食い込み可能。" },
      { course: "6コース", text: "展開次第で3着狙い。" }
    ],
    totalRate: 58 // トータル的中率（モック）
  }
};

// 初期画面（競艇場リスト）
function showKyoteiJoList() {
  let html = `<div class="grid">`;
  kyoteiJoList.forEach(name => {
    // モック的中率（50〜70%の範囲でランダム生成）
    const rate = Math.floor(Math.random() * 20) + 50;
    html += `
      <div>
        <button class="active" onclick="showRaceList('${name}')">${name}</button>
        <div class="total-rate">的中率: ${rate}%</div>
      </div>`;
  });
  html += `</div>`;
  app.innerHTML = html;
}

// レース番号リスト
function showRaceList(joName) {
  let html = `<h2>${joName}</h2><div class="race-grid">`;
  for (let i = 1; i <= 12; i++) {
    html += `<button onclick="showRaceDetail('${joName}', '${i}R')">${i}R</button>`;
  }
  html += `</div><button class="back-button" onclick="showKyoteiJoList()">戻る</button>`;
  app.innerHTML = html;
}

// 出走表 + 予想
function showRaceDetail(joName, raceNo) {
  const race = sampleRaceData[raceNo];
  if (!race) {
    app.innerHTML = `<h2>${joName} ${raceNo}</h2>
    <p>データ未登録</p>
    <button class="back-button" onclick="showRaceList('${joName}')">戻る</button>`;
    return;
  }

  // 出走表
  let table = `<table><tr><th>枠</th><th>級</th><th>選手名</th><th>平均ST</th><th>モーター</th></tr>`;
  race.racers.forEach(r =>
    table += `<tr><td>${r.waku}</td><td>${r.grade}</td><td>${r.name}</td><td>${r.st}</td><td>${r.motor}</td></tr>`
  );
  table += `</table>`;

  // AI予想買い目 + 確率
  let buys = race.aiPrediction.map(b => `<li>${b.bet} (${b.prob}%)</li>`).join("");

  // AIコメント（表形式）
  let commentTable = `<table class="ai-comment-table"><tr><th>コース</th><th>コメント</th></tr>`;
  race.aiComment.forEach(c =>
    commentTable += `<tr><td>${c.course}</td><td>${c.text}</td></tr>`
  );
  commentTable += `</table>`;

  let html = `
    <h2>${joName} ${raceNo}</h2>
    <h3>出走表</h3>
    ${table}
    <h3>AI予想買い目</h3>
    <ul>${buys}</ul>
    <h3>AIコメント</h3>
    ${commentTable}
    <button class="back-button" onclick="showRaceList('${joName}')">戻る</button>
  `;

  app.innerHTML = html;
}

// 初期表示
showKyoteiJoList();