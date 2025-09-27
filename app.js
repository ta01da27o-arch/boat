// app.js

// DOM要素取得
const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const globalHit = document.getElementById('globalHit');
const refreshBtn = document.getElementById('refreshBtn');

const SCREEN_VENUES = document.getElementById('screen-venues');
const SCREEN_RACES  = document.getElementById('screen-races');
const SCREEN_RACE   = document.getElementById('screen-race');

let raceData = null;
let venues = {};
let currentVenue = null;
let currentRace = null;

// JSONデータ取得
async function fetchData() {
  try {
    const response = await fetch('https://ta01da27o-arch.github.io/boat/data.json');
    raceData = await response.json();
    renderVenues();
  } catch (error) {
    console.error("データ取得エラー:", error);
  }
}

// 開催場表示
function renderVenues() {
  SCREEN_VENUES.innerHTML = "";
  venues = {};

  if (!raceData || !raceData.programs) return;

  raceData.programs.forEach(program => {
    const venueId = program.race_stadium_number;
    if (!venues[venueId]) {
      venues[venueId] = {
        name: getVenueName(venueId),
        races: []
      };
    }
    venues[venueId].races.push(program);
  });

  for (const venueId in venues) {
    const venue = venues[venueId];
    const div = document.createElement("div");
    div.className = "venue";
    div.textContent = venue.name;
    div.addEventListener("click", () => {
      currentVenue = venueId;
      renderRaces(venueId);
    });
    SCREEN_VENUES.appendChild(div);
  }
}

// レース一覧表示
function renderRaces(venueId) {
  SCREEN_RACES.innerHTML = "";
  const venue = venues[venueId];

  venue.races.forEach(race => {
    const div = document.createElement("div");
    div.className = "race";
    div.textContent = `${race.race_number}R ${race.race_title}`;
    div.addEventListener("click", () => {
      currentRace = race;
      renderRace(race);
    });
    SCREEN_RACES.appendChild(div);
  });

  SCREEN_VENUES.style.display = "none";
  SCREEN_RACES.style.display = "block";
  SCREEN_RACE.style.display = "none";
}

// 出走表表示（当地勝率変換込み）
function renderRace(race) {
  SCREEN_RACE.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = `${race.race_number}R ${race.race_title}`;
  SCREEN_RACE.appendChild(title);

  const table = document.createElement("table");
  const header = document.createElement("tr");
  header.innerHTML = `
    <th>艇番</th>
    <th>選手名</th>
    <th>当地勝率</th>
    <th>モーター2連率</th>
    <th>ボート2連率</th>
  `;
  table.appendChild(header);

  race.boats.forEach(boat => {
    const tr = document.createElement("tr");

    // ✅ 当地勝率の変換処理
    let localRate = boat.racer_local_top_1_percent;
    let localRateDisplay = "-";
    if (localRate !== null && localRate !== undefined) {
      localRateDisplay = Math.round(localRate * 10) + "%";
    }

    const motorRate = boat.racer_assigned_motor_top_2_percent
      ? boat.racer_assigned_motor_top_2_percent + "%"
      : "-";

    const boatRate = boat.racer_assigned_boat_top_2_percent
      ? boat.racer_assigned_boat_top_2_percent + "%"
      : "-";

    tr.innerHTML = `
      <td>${boat.racer_boat_number}</td>
      <td>${boat.racer_name}</td>
      <td>${localRateDisplay}</td>
      <td>${motorRate}</td>
      <td>${boatRate}</td>
    `;
    table.appendChild(tr);
  });

  SCREEN_RACE.appendChild(table);

  const backBtn = document.createElement("button");
  backBtn.textContent = "戻る";
  backBtn.addEventListener("click", () => {
    SCREEN_RACES.style.display = "block";
    SCREEN_RACE.style.display = "none";
  });
  SCREEN_RACE.appendChild(backBtn);

  SCREEN_RACES.style.display = "none";
  SCREEN_RACE.style.display = "block";
}

// 開催場名をIDから取得（例: 桐生=1, 戸田=2, …）
function getVenueName(id) {
  const venues = {
    1: "桐生",
    2: "戸田",
    3: "江戸川",
    4: "平和島",
    5: "多摩川",
    6: "浜名湖",
    7: "蒲郡",
    8: "常滑",
    9: "津",
    10: "三国",
    11: "びわこ",
    12: "住之江",
    13: "尼崎",
    14: "鳴門",
    15: "丸亀",
    16: "児島",
    17: "宮島",
    18: "徳山",
    19: "下関",
    20: "若松",
    21: "芦屋",
    22: "福岡",
    23: "唐津",
    24: "大村"
  };
  return venues[id] || `場ID:${id}`;
}

// 初期化
refreshBtn.addEventListener("click", fetchData);
fetchData();