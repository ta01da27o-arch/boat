const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-race");

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const raceTableBody = document.getElementById("raceTableBody");
const aiPicks = document.getElementById("aiPicks");
const aiCommentsList = document.getElementById("aiCommentsList");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

document.querySelectorAll(".back-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    const target = e.target.getAttribute("data-target");
    showScreen(target);
  });
});

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

// 24場ダミーデータ
const venues = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

venues.forEach(v => {
  const div = document.createElement("div");
  div.className = "venue-card";
  div.innerHTML = `<div>${v}</div><div>開催中</div><div>ー%</div>`;
  div.addEventListener("click", () => {
    venueTitle.textContent = v;
    showScreen("screen-races");
    loadRaces();
  });
  venuesGrid.appendChild(div);
});

// レース番号表示
function loadRaces() {
  racesGrid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => {
      raceTitle.textContent = `${i}R 出走表`;
      showScreen("screen-race");
      loadRaceData();
    });
    racesGrid.appendChild(btn);
  }
}

// 出走表＋AI予想
function loadRaceData() {
  raceTableBody.innerHTML = "";
  aiPicks.innerHTML = "";
  aiCommentsList.innerHTML = "";

  const sampleRace = [
    {艇:1, 級:"A1", 名前:"佐藤信一", ST:"0.14", 当地:"6.50", モーター:"5.80", コース:"6.20"},
    {艇:2, 級:"B1", 名前:"鈴木一郎", ST:"0.19", 当地:"4.20", モーター:"5.10", コース:"4.50"},
    {艇:3, 級:"A2", 名前:"田中太郎", ST:"0.13", 当地:"7.00", モーター:"6.80", コース:"6.70"},
    {艇:4, 級:"A1", 名前:"中村健", ST:"0.17", 当地:"5.90", モーター:"6.40", コース:"5.80"},
    {艇:5, 級:"B1", 名前:"山本進", ST:"0.21", 当地:"3.50", モーター:"4.20", コース:"3.80"},
    {艇:6, 級:"B2", 名前:"小林誠", ST:"0.22", 当地:"2.80", モーター:"3.50", コース:"2.90"}
  ];

  sampleRace.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.艇}</td>
      <td>${r.級}<br>${r.名前}<br>${r.ST}</td>
      <td>${r.当地}</td>
      <td>${r.モーター}</td>
      <td>${r.コース}</td>
    `;
    raceTableBody.appendChild(tr);
  });

  // AI予想買い目
  const picks = [
    {buy:"3-1-4", prob:"52%"},
    {buy:"3-4-1", prob:"45%"},
    {buy:"3-4-5", prob:"40%"},
    {buy:"4-1-3", prob:"33%"},
    {buy:"4-3-5", prob:"28%"}
  ];

  picks.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${p.buy}</span><span>${p.prob}</span>`;
    aiPicks.appendChild(li);
  });

  // AIコメント（各艇ごと）
  const comments = [
    "1コース「スタート遅れ気味。展開に乗れず苦しいか」",
    "2コース「ターンでの切れはあるが伸び足不足」",
    "3コース「今節のスタート感、絶好調。モーター上位。捲り濃厚！」",
    "4コース「3コース主導権なら展開ついて頭まで見える」",
    "5コース「展開待ちの走り。舟券は押さえまで」",
    "6コース「直線弱く厳しい戦い」"
  ];

  comments.forEach(c => {
    const div = document.createElement("div");
    div.className = "comment-box";
    div.textContent = c;
    aiCommentsList.appendChild(div);
  });
}