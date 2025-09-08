let raceData = {};
let currentVenue = null;
let currentRace = null;

// 日付表示
document.getElementById("today-date").textContent =
  new Date().toLocaleDateString("ja-JP");

// データ読み込み
async function loadData() {
  const cache = localStorage.getItem("raceData");
  if (cache) {
    raceData = JSON.parse(cache);
  }
  try {
    const res = await fetch("data.json");
    const data = await res.json();
    raceData = data;
    localStorage.setItem("raceData", JSON.stringify(data));
  } catch (e) {
    console.error("データ読み込み失敗", e);
  }
  renderVenues();
}

document.getElementById("refresh-btn").addEventListener("click", () => {
  localStorage.removeItem("raceData");
  loadData();
});

// 画面切り替え
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id + "-screen").classList.add("active");
}

// 戻る
function goBack(to) {
  showScreen(to + "-screen");
}

// 24場表示
function renderVenues() {
  const grid = document.getElementById("venues-grid");
  grid.innerHTML = "";
  raceData.venues.forEach(v => {
    const card = document.createElement("div");
    card.className = "venue-card";
    if (!v.active) {
      card.classList.add("disabled");
    }
    card.innerHTML = `
      <div>${v.name}</div>
      <div>${v.active ? "開催中" : "ー"}</div>
      <div>${v.rate}%</div>
    `;
    if (v.active) {
      card.addEventListener("click", () => {
        currentVenue = v;
        renderRaces(v);
      });
    }
    grid.appendChild(card);
  });
}

// レース番号表示
function renderRaces(venue) {
  showScreen("races");
  document.getElementById("races-title").textContent = venue.name;
  const grid = document.getElementById("races-grid");
  grid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("div");
    btn.className = "race-btn";
    btn.textContent = i + "R";
    const race = venue.races.find(r => r.no === i);
    if (race) {
      btn.addEventListener("click", () => {
        currentRace = race;
        renderEntries(venue, race);
      });
    } else {
      btn.classList.add("disabled");
    }
    grid.appendChild(btn);
  }
}

// 出走表表示
function renderEntries(venue, race) {
  showScreen("entries");
  document.getElementById("entries-title").textContent = `${venue.name} ${race.no}R 出走表`;

  let html = "<table><tr><th>枠</th><th>選手</th><th>F</th><th>当地</th><th>モーター</th><th>コース</th><th>総合</th></tr>";
  race.entries.forEach(e => {
    html += `
      <tr>
        <td>${e.waku}</td>
        <td>
          <div>${e.class}</div>
          <div>${e.name}</div>
          <div>ST:${e.st}</div>
        </td>
        <td>${e.f || "-"}</td>
        <td><div class="mark ${e.localMark==="◎"?"red":""}">${e.localMark}</div><div>${e.local2}%</div><div>${e.local3}%</div></td>
        <td><div class="mark ${e.motorMark==="◎"?"red":""}">${e.motorMark}</div><div>${e.motor2}%</div><div>${e.motor3}%</div></td>
        <td><div class="mark ${e.courseMark==="◎"?"red":""}">${e.courseMark}</div><div>${e.course2}%</div><div>${e.course3}%</div></td>
        <td><div class="mark ${e.eval==="◎"?"red":""}">${e.eval}</div></td>
      </tr>
    `;
  });
  html += "</table>";
  document.getElementById("entries-table").innerHTML = html;

  // AI予想
  let predHTML = `
    <table><tr><th>本命</th></tr>
      ${race.ai.main.map(p=>`<tr><td>${p.combo} ${p.rate}%</td></tr>`).join("")}
    </table>
    <table><tr><th>穴</th></tr>
      ${race.ai.sub.map(p=>`<tr><td>${p.combo} ${p.rate}%</td></tr>`).join("")}
    </table>
  `;
  document.getElementById("ai-predictions").innerHTML = predHTML;

  // コメント
  document.getElementById("ai-comments").innerHTML =
    race.comments.map(c => `<div>${c.no}号艇: ${c.text}</div>`).join("");
}

loadData();