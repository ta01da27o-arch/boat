// script.js

// ====== 初期データ ======
const kyoteiJoList = [
  "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
  "蒲郡", "常滑", "津", "三国", "琵琶湖", "住之江",
  "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
  "下関", "若松", "芦屋", "福岡", "唐津", "大村"
];

// ====== 日付表示 ======
function updateDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  document.getElementById("today").textContent = `${yyyy}/${mm}/${dd}`;
}

// ====== トータルAI的中率（仮データ） ======
function getTotalAccuracy() {
  // 本来は結果データと予想を比較して計算
  return "AI的中率：65.2%";
}

// ====== メイン画面：競艇場一覧 ======
function renderMainScreen() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h1>競艇AI予想</h1>
    <div id="today"></div>
    <div id="accuracy">${getTotalAccuracy()}</div>
    <button onclick="renderMainScreen()">更新</button>
    <div class="grid-container" id="kyotei-list"></div>
  `;
  updateDate();

  const listDiv = document.getElementById("kyotei-list");
  kyoteiJoList.forEach((name, index) => {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.onclick = () => renderRaceList(name);
    listDiv.appendChild(btn);
  });
}

// ====== レース番号画面 ======
function renderRaceList(kyoteiJo) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>${kyoteiJo} - レース一覧</h2>
    <button onclick="renderMainScreen()" class="back-btn">戻る</button>
    <div class="grid-container" id="race-list"></div>
  `;

  const listDiv = document.getElementById("race-list");
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.onclick = () => renderRaceDetail(kyoteiJo, i);
    listDiv.appendChild(btn);
  }
}

// ====== 出走表 + AI予想画面 ======
function renderRaceDetail(kyoteiJo, raceNo) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>${kyoteiJo} ${raceNo}R 出走表</h2>
    <button onclick="renderRaceList('${kyoteiJo}')" class="back-btn">戻る</button>

    <table class="race-table">
      <thead>
        <tr>
          <th>枠番</th><th>級別</th><th>選手名</th>
          <th>平均ST</th><th>モーター</th>
        </tr>
      </thead>
      <tbody id="race-data"></tbody>
    </table>

    <h3>AI予想買い目</h3>
    <ul id="ai-bets"></ul>

    <h3>AIコメント</h3>
    <table class="comment-table">
      <thead><tr><th>コース</th><th>コメント</th></tr></thead>
      <tbody id="ai-comments"></tbody>
    </table>
  `;

  // 出走表（仮データ）
  const raceData = [
    { waku: 1, grade: "A1", name: "田中太郎", st: "0.15", motor: "12(36/55)" },
    { waku: 2, grade: "B2", name: "佐藤次郎", st: "0.20", motor: "34(22/40)" },
    { waku: 3, grade: "A2", name: "鈴木花子", st: "0.14", motor: "56(44/60)" },
    { waku: 4, grade: "B1", name: "山本健", st: "0.18", motor: "78(30/50)" },
    { waku: 5, grade: "A1", name: "中村光", st: "0.16", motor: "90(50/70)" },
    { waku: 6, grade: "B1", name: "小林大", st: "0.22", motor: "11(18/38)" },
  ];

  const tbody = document.getElementById("race-data");
  raceData.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.waku}</td>
      <td>${row.grade}</td>
      <td>${row.name}</td>
      <td>${row.st}</td>
      <td>${row.motor}</td>
    `;
    tbody.appendChild(tr);
  });

  // AI予想（仮データ）
  const bets = [
    { bet: "3-1-4", prob: 32 },
    { bet: "3-1-5", prob: 28 },
    { bet: "3-4-1", prob: 20 },
    { bet: "3-4-5", prob: 12 },
    { bet: "3-5-1", prob: 8 },
  ];
  const betList = document.getElementById("ai-bets");
  bets.forEach(b => {
    const li = document.createElement("li");
    li.textContent = `${b.bet} (${b.prob}%)`;
    betList.appendChild(li);
  });

  // AIコメント（コース別、仮データ）
  const comments = [
    { course: "1コース", text: "今節はスタートに不安あり。捲られる傾向。" },
    { course: "2コース", text: "ターンが甘く、2着までか。" },
    { course: "3コース", text: "スタート決まっており、捲り差し有力。" },
    { course: "4コース", text: "展開つけば浮上可能。" },
    { course: "5コース", text: "差しに回れば上位狙える。" },
    { course: "6コース", text: "展開待ち。大外で厳しい。" },
  ];
  const cbody = document.getElementById("ai-comments");
  comments.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${c.course}</td><td>${c.text}</td>`;
    cbody.appendChild(tr);
  });
}

// ====== 起動 ======
document.addEventListener("DOMContentLoaded", renderMainScreen);