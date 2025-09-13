// ===============================
// 要素取得
// ===============================
const screenVenues = document.getElementById("screen-venues"); // メイン画面
const screenRaces = document.getElementById("screen-races");   // レース番号画面
const screenDetail = document.getElementById("screen-detail"); // 出走表画面

const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const backBtnRace = document.getElementById("backBtnRace");
const backBtnDetail = document.getElementById("backBtnDetail");
const refreshBtn = document.getElementById("refreshBtn");

const venueGrid = document.getElementById("venueGrid");
const raceGrid = document.getElementById("raceGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.querySelector("#entryTable tbody");
const mainPredictionsDiv = document.getElementById("mainPredictions");
const aiCommentsDiv = document.getElementById("aiComments");
const raceDateDiv = document.getElementById("raceDate");
const overallHitDiv = document.getElementById("overallHit");

// ===============================
// データ保持
// ===============================
let selectedDate = "";
let selectedVenue = "";
let selectedRace = "";

// ===============================
// AIコメント候補
// ===============================
const aiCommentCandidates = [
  "今節のスタート感、絶好調。モーター上位。2コースのST遅め。捲り濃厚！",
  "3コースが主導権を握る可能性大。展開ついて頭まで見える。",
  "出足の伸びが良く、序盤でリードが期待できる。",
  "ペラ調整が良好で、終盤まで粘りが効きそう。",
  "スタート微妙だが、展開次第で好走の余地あり。",
  "ターン回りが安定、差しやまくりに対応可能。",
  "出足まずまず、競り合いで上位確保に期待。",
  "波に乗れず、展開待ちが必要。",
  "ST速めで逃げ先行の展開有利。",
  "舟券絡みの可能性大、注目コース。",
  "調整上々で2連対圏内を狙える。",
  "中盤の伸びで差し優位、頭まで可能。",
  "スタートやや遅れ気味、展開待ち。",
  "ペラの仕上がり良好、加速力に期待。",
  "ターンの切れ味良く、3コース差しが決まりやすい。",
  "序盤スタート悪いが、後半追い上げ可能。",
  "コンディション安定、堅実にまとめる。",
  "スタート微妙もモーター評価高く期待値あり。",
  "先行艇の動きを見て頭まで狙える。",
  "終盤粘り強く、3連対圏内可能。"
];

// ===============================
// ランダムコメント生成関数
// ===============================
function generateAIComments() {
  const comments = [];
  for (let i = 0; i < 6; i++) {
    const index = Math.floor(Math.random() * aiCommentCandidates.length);
    comments.push(aiCommentCandidates[index]);
  }
  return comments;
}

// ===============================
// メイン画面生成（24場一覧）
// ===============================
const venues = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

function renderVenues() {
  venueGrid.innerHTML = "";
  venues.forEach((v) => {
    const div = document.createElement("div");
    div.className = "venue-card";
    div.innerHTML = `
      <div>${v}</div>
      <div>開催中</div>
      <div>54%</div>
    `;
    div.addEventListener("click", () => {
      selectedVenue = v;
      openRacesScreen();
    });
    venueGrid.appendChild(div);
  });
  raceDateDiv.textContent = new Date().toLocaleDateString();
  overallHitDiv.textContent = "総合的中率: -";
}

// ===============================
// レース番号画面生成
// ===============================
function openRacesScreen() {
  screenVenues.classList.add("hidden");
  screenRaces.classList.remove("hidden");
  venueTitle.textContent = selectedVenue;
  raceGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const div = document.createElement("div");
    div.className = "venue-card";
    div.textContent = `R${i}`;
    div.addEventListener("click", () => {
      selectedRace = i;
      openDetailScreen();
    });
    raceGrid.appendChild(div);
  }
}

// ===============================
// 出走表画面生成
// ===============================
function openDetailScreen() {
  screenRaces.classList.add("hidden");
  screenDetail.classList.remove("hidden");
  raceTitle.textContent = `${selectedVenue} R${selectedRace}`;

  // 仮データ6艇
  const boats = [
    {class:"A2", name:"佐藤信一", st:0.19, local:57, motor:40, course:42, grade:"◎"},
    {class:"A1", name:"田中太郎", st:0.17, local:60, motor:38, course:41, grade:"○"},
    {class:"B1", name:"鈴木次郎", st:0.18, local:52, motor:45, course:43, grade:"△"},
    {class:"B2", name:"山田三郎", st:0.16, local:48, motor:50, course:39, grade:"✕"},
    {class:"A2", name:"伊藤四郎", st:0.15, local:55, motor:42, course:44, grade:"○"},
    {class:"B1", name:"加藤五郎", st:0.20, local:50, motor:40, course:40, grade:"△"},
  ];

  entryTableBody.innerHTML = "";
  boats.forEach((b, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${b.class}<br>${b.name}<br>${b.st.toFixed(2)}</td>
      <td>${b.local}%</td>
      <td>${b.motor}%</td>
      <td>${b.course}%</td>
      <td>${b.grade}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  // Ai予想
  const predictions = [
    {bet:"3-1-4", rate:52},
    {bet:"3-4-1", rate:38},
    {bet:"3-4-5", rate:35},
    {bet:"4-1-3", rate:28},
    {bet:"4-3-5", rate:22},
  ];

  mainPredictionsDiv.innerHTML = "";
  predictions.forEach(p => {
    const div = document.createElement("div");
    div.innerHTML = `<span>${p.bet}</span><span>${p.rate}%</span>`;
    mainPredictionsDiv.appendChild(div);
  });

  // Aiコメント生成
  const comments = generateAIComments();
  aiCommentsDiv.innerHTML = "";
  comments.forEach((c, i) => {
    const div = document.createElement("div");
    div.textContent = `コース${i+1}: ${c}`;
    aiCommentsDiv.appendChild(div);
  });
}

// ===============================
// 戻るボタン右配置
// ===============================
backBtnRace.addEventListener("click", () => {
  screenRaces.classList.add("hidden");
  screenVenues.classList.remove("hidden");
});
backBtnDetail.addEventListener("click", () => {
  screenDetail.classList.add("hidden");
  screenRaces.classList.remove("hidden");
});

// ===============================
// 更新ボタン
// ===============================
refreshBtn.addEventListener("click", () => {
  renderVenues();
});

// ===============================
// 初期描画
// ===============================
renderVenues();