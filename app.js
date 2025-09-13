let allRaces = [];
let currentVenue = null;
let currentDay = "today"; // today / yesterday

const venueListContainer = document.getElementById("venueList");
const raceListContainer = document.getElementById("raceList");
const entryTableBody = document.querySelector("#entryTable tbody");

const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const backBtnRace = document.getElementById("backBtnRace");
const backBtnDetail = document.getElementById("backBtnDetail");

todayBtn.addEventListener("click", () => { currentDay = "today"; updateTab(); renderVenues(); });
yesterdayBtn.addEventListener("click", () => { currentDay = "yesterday"; updateTab(); renderVenues(); });
backBtnRace.addEventListener("click", () => switchScreen("venues"));
backBtnDetail.addEventListener("click", () => switchScreen("races"));

function updateTab() {
  todayBtn.classList.toggle("active", currentDay === "today");
  yesterdayBtn.classList.toggle("active", currentDay === "yesterday");
}

// 日付の判定
function filterByDay() {
  const today = new Date();
  const targetDate = new Date(today);
  if (currentDay === "yesterday") targetDate.setDate(today.getDate() - 1);
  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, "0");
  const d = String(targetDate.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// データ取得
async function loadRaceData() {
  try {
    const res = await fetch("https://ta01da27o-arch.github.io/boat/data.json?nocache=" + Date.now());
    const json = await res.json();
    if (json && json.races && Array.isArray(json.races.programs)) {
      allRaces = json.races.programs;
    } else {
      throw new Error("JSON形式エラー");
    }
    renderVenues();
  } catch (e) {
    venueListContainer.innerHTML = `<p>データ取得失敗: ${e}</p>`;
  }
}

// 画面切替
function switchScreen(screen) {
  screenVenues.classList.add("hidden");
  screenRaces.classList.add("hidden");
  screenDetail.classList.add("hidden");
  if (screen === "venues") screenVenues.classList.remove("hidden");
  if (screen === "races") screenRaces.classList.remove("hidden");
  if (screen === "detail") screenDetail.classList.remove("hidden");
}

// 場一覧
function renderVenues() {
  const targetDate = filterByDay();
  const venues = [...new Set(allRaces.filter(r => r.race_date === targetDate).map(r => r.race_stadium_number))];
  venueListContainer.innerHTML = "";
  venues.forEach(v => {
    const div = document.createElement("div");
    div.textContent = `場 ${v}`;
    div.onclick = () => renderRaces(v, targetDate);
    venueListContainer.appendChild(div);
  });
  switchScreen("venues");
}

// レース一覧
function renderRaces(venue, date) {
  currentVenue = venue;
  document.getElementById("venueTitle").textContent = `場 ${venue}`;
  const races = allRaces.filter(r => r.race_stadium_number === venue && r.race_date === date);
  raceListContainer.innerHTML = "";
  races.forEach(r => {
    const div = document.createElement("div");
    div.textContent = `${r.race_number}`;
    div.onclick = () => renderRaceDetail(r);
    raceListContainer.appendChild(div);
  });
  switchScreen("races");
}

// 出走表
function renderRaceDetail(race) {
  document.getElementById("raceTitle").textContent = `${race.race_number}R`;
  entryTableBody.innerHTML = "";
  race.boats.forEach(b => {
    const tr = document.createElement("tr");
    tr.classList.add(`lane-${b.racer_boat_number}`);

    // 評価算出
    const evalScore = (1 / (b.racer_average_start_timing || 0.3)) *
                      (b.racer_flying_count === 0 ? 1 : 0.8) *
                      (b.racer_national_top_1_percent || 1) *
                      (b.motor_win_rate || 1) *
                      (b.course_win_rate || 1);
    let evalMark = "ー";
    if (evalScore > 50) evalMark = "◎";
    else if (evalScore > 30) evalMark = "○";
    else if (evalScore > 20) evalMark = "△";
    else if (evalScore > 10) evalMark = "✕";

    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>
        <div>${["A1","A2","B1","B2"][b.racer_class_number-1] || ""}</div>
        <div>${b.racer_name}</div>
        <div>ST:${b.racer_average_start_timing}</div>
      </td>
      <td>${b.racer_flying_count > 0 ? "F" : ""}</td>
      <td>${b.local_win_rate || "-"}</td>
      <td>${b.motor_win_rate || "-"}</td>
      <td>${b.course_win_rate || "-"}</td>
      <td class="${evalMark === "◎" ? "eval-strong" : ""}">${evalMark}</td>
    `;
    entryTableBody.appendChild(tr);
  });
  switchScreen("detail");
}

loadRaceData();