let DATA = [];
let HISTORY = [];

const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES = document.getElementById("screen-races");
const SCREEN_RACE = document.getElementById("screen-race");

const VENUES_DIV = document.getElementById("venues");
const RACES_DIV = document.getElementById("races");
const ENTRIES_DIV = document.getElementById("entries");
const VENUE_NAME = document.getElementById("venueName");
const RACE_TITLE = document.getElementById("raceTitle");
const AI_COMMENT = document.getElementById("aiComment");

async function loadData() {
  try {
    const res1 = await fetch("data.json");
    DATA = await res1.json();
    const res2 = await fetch("history.json");
    HISTORY = await res2.json();
    renderVenues();
  } catch (e) {
    console.error("データ読み込み失敗:", e);
  }
}

function renderVenues() {
  VENUES_DIV.innerHTML = "";
  const venues = [...new Set(DATA.map(r => r.stadium_name))];
  venues.forEach(v => {
    const btn = document.createElement("button");
    btn.textContent = v;
    btn.onclick = () => openVenue(v);
    VENUES_DIV.appendChild(btn);
  });
}

function openVenue(venue) {
  VENUE_NAME.textContent = venue;
  RACES_DIV.innerHTML = "";
  DATA.filter(r => r.stadium_name === venue).forEach(r => {
    const btn = document.createElement("button");
    btn.textContent = `${r.race_number}R`;
    btn.onclick = () => openRace(r);
    RACES_DIV.appendChild(btn);
  });

  SCREEN_VENUES.classList.add("hidden");
  SCREEN_RACES.classList.remove("hidden");
}

function openRace(race) {
  RACE_TITLE.textContent = `${race.stadium_name} ${race.race_number}R`;
  ENTRIES_DIV.innerHTML = "";
  race.entries.forEach(e => {
    const div = document.createElement("div");
    div.textContent = `${e.lane}号艇 ${e.name} (勝率:${e.win_rate ?? "不明"})`;
    ENTRIES_DIV.appendChild(div);
  });

  AI_COMMENT.textContent = generateComment(race, HISTORY);

  SCREEN_RACES.classList.add("hidden");
  SCREEN_RACE.classList.remove("hidden");
}

function backToVenues() {
  SCREEN_RACES.classList.add("hidden");
  SCREEN_VENUES.classList.remove("hidden");
}
function backToRaces() {
  SCREEN_RACE.classList.add("hidden");
  SCREEN_RACES.classList.remove("hidden");
}

loadData();