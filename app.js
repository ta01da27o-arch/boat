let raceData = [];
let currentVenue = null;
let currentRaces = [];

async function loadData() {
  try {
    const res = await fetch("data.json?time=" + Date.now()); // キャッシュ防止
    raceData = await res.json();
    showVenues();
  } catch (e) {
    console.error("データ読み込み失敗", e);
  }
}

function showVenues() {
  document.getElementById("screen-venues").classList.remove("hidden");
  document.getElementById("screen-races").classList.add("hidden");
  document.getElementById("screen-race").classList.add("hidden");

  const venueList = document.getElementById("venueList");
  venueList.innerHTML = "";

  const venues = [...new Set(raceData.map(r => r.race_stadium_number))];
  venues.forEach(v => {
    const div = document.createElement("div");
    div.className = "venue-item";
    div.textContent = `場 ${v}`;
    div.onclick = () => showRaces(v);
    venueList.appendChild(div);
  });
}

function showRaces(venue) {
  currentVenue = venue;
  document.getElementById("screen-venues").classList.add("hidden");
  document.getElementById("screen-races").classList.remove("hidden");
  document.getElementById("screen-race").classList.add("hidden");

  document.getElementById("venueTitle").textContent = `会場 ${venue}`;

  currentRaces = raceData.filter(r => r.race_stadium_number === venue);
  const raceList = document.getElementById("raceList");
  raceList.innerHTML = "";

  currentRaces.forEach(r => {
    const div = document.createElement("div");
    div.className = "race-item";
    div.textContent = `${r.race_number}R`;
    div.onclick = () => showRace(r.race_number);
    raceList.appendChild(div);
  });
}

function showRace(raceNo) {
  document.getElementById("screen-venues").classList.add("hidden");
  document.getElementById("screen-races").classList.add("hidden");
  document.getElementById("screen-race").classList.remove("hidden");

  const race = currentRaces.find(r => r.race_number === raceNo);
  document.getElementById("raceTitle").textContent = `${race.race_number}R 出走表`;

  const tbody = document.querySelector("#raceTable tbody");
  tbody.innerHTML = "";
  race.boats.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${b.lane}</td><td>${b.player}</td><td>${b.win_rate ?? "-"}</td>`;
    tbody.appendChild(tr);
  });

  document.getElementById("aiComment").textContent = generateComment(race);
}

window.onload = loadData;