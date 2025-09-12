const raceListSection = document.getElementById("raceList");
const raceDetailSection = document.getElementById("raceDetail");
const raceListContainer = document.getElementById("raceListContainer");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiCommentDiv = document.getElementById("aiComment");

const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const backBtn = document.getElementById("backBtn");

let raceData = [];
let mode = "today"; // "today" or "yesterday"

async function loadRaceData() {
  try {
    const res = await fetch("data/race_data.json?nocache=" + Date.now());
    const json = await res.json();
    raceData = json.races;
    renderRaceList();
  } catch (e) {
    raceListContainer.innerHTML = `<li>データ取得失敗: ${e}</li>`;
  }
}

function renderRaceList() {
  raceListContainer.innerHTML = "";
  const filtered = raceData.filter(r =>
    mode === "today" ? r.date === getToday() : r.date === getYesterday()
  );

  filtered.forEach(race => {
    const li = document.createElement("li");
    li.textContent = `${race.place} ${race.race_no}R (${race.start_time})`;
    li.addEventListener("click", () => showRaceDetail(race));
    raceListContainer.appendChild(li);
  });
}

function showRaceDetail(race) {
  raceListSection.classList.add("hidden");
  raceDetailSection.classList.remove("hidden");

  raceTitle.textContent = `${race.place} ${race.race_no}R 出走表`;

  entryTableBody.innerHTML = "";
  race.entries.forEach(e => {
    const tr = document.createElement("tr");
    tr.classList.add(`lane-${e.lane}`);
    tr.innerHTML = `
      <td>${e.lane}</td>
      <td>${e.name}</td>
      <td>${e.win_rate?.toFixed(2) ?? "-"}</td>
      <td>${e.start_avg ?? "-"}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  aiCommentDiv.innerHTML = `<p>${generateComment(race)}</p>`;
}

backBtn.addEventListener("click", () => {
  raceDetailSection.classList.add("hidden");
  raceListSection.classList.remove("hidden");
});

todayBtn.addEventListener("click", () => {
  mode = "today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  renderRaceList();
});

yesterdayBtn.addEventListener("click", () => {
  mode = "yesterday";
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  renderRaceList();
});

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// 初期化
loadRaceData();