const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-race");

const VENUES_GRID = document.getElementById("venues");
const RACES_GRID = document.getElementById("races");
const RACE_DETAIL = document.getElementById("raceDetail");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const backToVenues = document.getElementById("backToVenues");
const backToRaces = document.getElementById("backToRaces");
const refreshBtn = document.getElementById("refreshBtn");
const todayLabel = document.getElementById("todayLabel");

const venues = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

let currentVenue = null;
let currentRace = null;

function showScreen(screen) {
  [SCREEN_VENUES, SCREEN_RACES, SCREEN_RACE].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

// メイン画面の日付
function updateDate() {
  const d = new Date();
  todayLabel.textContent = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}
refreshBtn.addEventListener("click", updateDate);

// 競艇場一覧生成
function renderVenues() {
  VENUES_GRID.innerHTML = "";
  venues.forEach(v => {
    const div = document.createElement("div");
    div.className = "venue-card";
    div.innerHTML = `
      <h3>${v}</h3>
      <p>開催中</p>
      <p>ー%</p>
    `;
    div.addEventListener("click", () => openVenue(v));
    VENUES_GRID.appendChild(div);
  });
}

// レース番号画面
function openVenue(venue) {
  currentVenue = venue;
  venueTitle.textContent = venue;
  RACES_GRID.innerHTML = "";
  for (let i=1; i<=12; i++) {
    const div = document.createElement("div");
    div.className = "race-card";
    div.textContent = `${i}R`;
    div.addEventListener("click", () => openRace(i));
    RACES_GRID.appendChild(div);
  }
  showScreen(SCREEN_RACES);
}

// レース詳細画面
function openRace(raceNo) {
  currentRace = raceNo;
  raceTitle.textContent = `${currentVenue} ${raceNo}R`;
  RACE_DETAIL.innerHTML = `<p>${currentVenue} ${raceNo}R の詳細データ</p>`;
  showScreen(SCREEN_RACE);
}

// 戻る操作
backToVenues.addEventListener("click", () => showScreen(SCREEN_VENUES));
backToRaces.addEventListener("click", () => showScreen(SCREEN_RACES));

// 初期表示
updateDate();
renderVenues();
showScreen(SCREEN_VENUES);