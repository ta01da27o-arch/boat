const todayLabel = document.getElementById("todayLabel");
const todayBtn = document.getElementById("todayBtn");
const prevBtn = document.getElementById("prevBtn");
const refreshBtn = document.getElementById("refreshBtn");

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-race");

const venuesGrid = document.getElementById("venuesGrid");
const venueTitle = document.getElementById("venueTitle");
const racesList = document.getElementById("racesList");
const raceTitle = document.getElementById("raceTitle");
const entryTable = document.getElementById("entryTable");
const commentsDiv = document.getElementById("comments");

const backBtn = document.getElementById("backBtn");
const raceBackBtn = document.getElementById("raceBackBtn");

// サンプル競艇場（24固定）
const venues = [
  "桐生","戸田","江戸川","平和島",
  "多摩川","浜名湖","蒲郡","常滑",
  "津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島",
  "宮島","徳山","下関","若松",
  "芦屋","福岡","唐津","大村"
];

// ランダムコメント（言葉のみ）
const comments = [
  "今節のST絶好調❗捲り一撃濃厚❗",
  "冷静な差しが決まる展開❗",
  "スタートで主導権を握る可能性大❗",
  "地元水面で気合十分❗",
  "展開次第で差し抜けあり❗",
  "ターン回り抜群の仕上がり❗",
  "ここは自在戦に期待❗",
  "外枠から強襲も十分❗",
  "連日安定感ある走りを披露❗",
  "波乱の立役者となりそう❗"
];

// 日付表示
const today = new Date();
todayLabel.textContent = today.toISOString().slice(0,10) + " (日)";

// 競艇場一覧表示
function renderVenues() {
  venuesGrid.innerHTML = "";
  venues.forEach(v => {
    const card = document.createElement("div");
    card.className = "venue-card";
    card.innerHTML = `
      <h3>${v}</h3>
      <div class="venue-status">開催中</div>
      <div>--%</div>
    `;
    card.addEventListener("click", () => openVenue(v));
    venuesGrid.appendChild(card);
  });
}

// 競艇場クリック時
function openVenue(name) {
  SCREEN_VENUES.classList.add("hidden");
  SCREEN_RACES.classList.remove("hidden");
  venueTitle.textContent = name + " のレース一覧";
  racesList.innerHTML = "";
  for (let i=1; i<=12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => openRace(name, i));
    racesList.appendChild(btn);
  }
}

// レースクリック時
function openRace(venue, raceNo) {
  SCREEN_RACES.classList.add("hidden");
  SCREEN_RACE.classList.remove("hidden");
  raceTitle.textContent = `${venue} ${raceNo}R`;

  entryTable.innerHTML = "<p>出走表データ（仮）</p>";

  const randomComment = comments[Math.floor(Math.random() * comments.length)];
  commentsDiv.textContent = randomComment;
}

// 戻るボタン
backBtn.addEventListener("click", () => {
  SCREEN_RACES.classList.add("hidden");
  SCREEN_VENUES.classList.remove("hidden");
});

raceBackBtn.addEventListener("click", () => {
  SCREEN_RACE.classList.add("hidden");
  SCREEN_RACES.classList.remove("hidden");
});

// 初期表示
renderVenues();