const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-race");

const venuesDiv = document.getElementById("venues");
const racesDiv = document.getElementById("races");
const venueTitle = document.getElementById("venueTitle");

const todayLabel = document.getElementById("todayLabel");
const refreshBtn = document.getElementById("refreshBtn");

const venues = [
  "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
  "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
  "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
  "下関", "若松", "芦屋", "福岡", "唐津", "大村"
];

let currentVenue = "";

// 日付更新
function updateToday() {
  const d = new Date();
  todayLabel.textContent = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
updateToday();
refreshBtn.addEventListener("click", updateToday);

// 競艇場一覧を表示
function showVenues() {
  venuesDiv.innerHTML = "";
  venues.forEach(v => {
    const div = document.createElement("div");
    div.className = "venue-card";
    div.textContent = v;
    div.onclick = () => showRaces(v);
    venuesDiv.appendChild(div);
  });
}
showVenues();

// レース番号画面を表示
function showRaces(venue) {
  currentVenue = venue;
  venueTitle.textContent = venue; // ← 「〇〇のレース一覧」を「〇〇」に変更
  racesDiv.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const div = document.createElement("div");
    div.className = "race-card";
    div.textContent = `${i}R`;
    div.onclick = () => showRace(i);
    racesDiv.appendChild(div);
  }

  SCREEN_VENUES.classList.remove("active");
  SCREEN_RACES.classList.add("active");
}

// レース詳細画面
function showRace(raceNo) {
  document.getElementById("raceTitle").textContent = `${currentVenue} ${raceNo}R`;
  SCREEN_RACES.classList.remove("active");
  SCREEN_RACE.classList.add("active");
}

// 戻る機能
function goBack() {
  if (SCREEN_RACE.classList.contains("active")) {
    SCREEN_RACE.classList.remove("active");
    SCREEN_RACES.classList.add("active");
  } else if (SCREEN_RACES.classList.contains("active")) {
    SCREEN_RACES.classList.remove("active");
    SCREEN_VENUES.classList.add("active");
  }
}