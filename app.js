const SCREEN_VENUES = document.getElementById("screen-venues");
const SCREEN_RACES  = document.getElementById("screen-races");
const SCREEN_RACE   = document.getElementById("screen-race");

const venueList     = document.getElementById("venue-list");
const raceList      = document.getElementById("race-list");
const raceTable     = document.getElementById("race-table");
const aiMainPicks   = document.getElementById("ai-main-picks");
const aiHolePicks   = document.getElementById("ai-hole-picks");
const aiComments    = document.getElementById("ai-comments");
const aiPrediction  = document.getElementById("ai-prediction");

let allData = [];

fetch("data.json")
  .then(r => r.json())
  .then(data => {
    allData = data;
    renderVenues(data);
  });

function renderVenues(data) {
  venueList.innerHTML = "";
  const venues = [...new Set(data.map(r => r.jyo))];
  venues.forEach(v => {
    const div = document.createElement("div");
    div.className = "venue-card";
    div.innerHTML = `
      <h3>${v}</h3>
      <p>開催中</p>
      <p>0%</p>
    `;
    div.onclick = () => showRaces(v);
    venueList.appendChild(div);
  });
}

function showRaces(venue) {
  SCREEN_VENUES.classList.add("hidden");
  SCREEN_RACES.classList.remove("hidden");

  document.getElementById("venue-name").textContent = venue;
  const races = allData.filter(r => r.jyo === venue);

  raceList.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const race = races.find(r => Number(r.rno) === i);
    const div = document.createElement("div");
    div.className = "race-card";
    div.textContent = race ? `${i}R 出走表` : `${i}R データなし`;
    div.onclick = () => showRaceDetail(race);
    raceList.appendChild(div);
  }
}

document.getElementById("backToVenues").onclick = () => {
  SCREEN_RACES.classList.add("hidden");
  SCREEN_VENUES.classList.remove("hidden");
};

document.getElementById("backToRaces").onclick = () => {
  SCREEN_RACE.classList.add("hidden");
  SCREEN_RACES.classList.remove("hidden");
};

function showRaceDetail(race) {
  SCREEN_RACES.classList.add("hidden");
  SCREEN_RACE.classList.remove("hidden");

  document.getElementById("race-title").textContent =
    `${race.jyo} ${race.rno}R`;

  raceTable.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    const entry = race[`boat${i}`];
    if (!entry) continue;

    const div = document.createElement("div");
    div.className = `racer-row bg-${i}`;
    const rate = entry.localWinRate ? `${(entry.localWinRate*10).toFixed(0)}%(${(entry.localWinRate).toFixed(1)}割)` : "-";
    div.innerHTML = `
      <div class="racer-info">
        <div class="racer-grade">${entry.grade || "-"}</div>
        <div class="racer-name">${entry.name}</div>
        <div class="racer-st">平均ST ${entry.st || "-"}</div>
      </div>
      <div class="racer-rate">${rate}</div>
    `;
    raceTable.appendChild(div);
  }

  aiMainPicks.innerHTML = `<b>本命5点:</b> ${generatePicks(race, "main").join(", ")}`;
  aiHolePicks.innerHTML = `<b>穴5点:</b> ${generatePicks(race, "hole").join(", ")}`;
  aiComments.innerHTML  = generateComments(race).map(c => `<p>${c}</p>`).join("");
  aiPrediction.innerHTML = `<p>${generatePrediction(race)}</p>`;
}

function generatePicks(race, type) {
  const picks = [];
  for (let i = 0; i < 5; i++) {
    picks.push(`${Math.floor(Math.random()*6)+1}-${Math.floor(Math.random()*6)+1}-${Math.floor(Math.random()*6)+1}`);
  }
  return picks;
}

function generateComments(race) {
  const templates = [
    "鋭いスタートで展開を作りそう",
    "安定感ある走りで前々へ",
    "ターン巧者、展開待ちも侮れない",
    "仕上がり良く差し切り十分",
    "スピード勝負に持ち込むか",
    "流れに乗れれば上位も"
  ];
  return Array.from({length:6}, (_,i)=>`【${i+1}号艇】${templates[Math.floor(Math.random()*templates.length)]}`);
}

function generatePrediction(race) {
  const ranks = [1,2,3,4,5,6].sort(() => Math.random() - 0.5);
  return `予想順位: ${ranks.join(" → ")}`;
}