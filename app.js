let data = {};
let currentVenue = null;
let currentRace = null;

window.onload = async () => {
  document.getElementById("today").textContent = new Date().toLocaleDateString();
  await loadData();
  renderVenues();
  document.getElementById("update-btn").onclick = () => {
    loadData().then(renderVenues);
  };
};

async function loadData() {
  const res = await fetch("data.json");
  data = await res.json();
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function renderVenues() {
  const grid = document.getElementById("venues-grid");
  grid.innerHTML = "";
  data.venues.forEach(v => {
    const div = document.createElement("div");
    div.className = "venue-card";
    div.innerHTML = `
      <div>${v.name}</div>
      <div>${v.accuracy}%</div>
      <button onclick="selectVenue(${v.id})">開催中</button>
    `;
    grid.appendChild(div);
  });
}

function selectVenue(id) {
  currentVenue = data.venues.find(v => v.id === id);
  document.getElementById("venue-title").textContent = currentVenue.name;
  renderRaces();
  showScreen("races-screen");
}

function renderRaces() {
  const grid = document.getElementById("races-grid");
  grid.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.onclick = () => selectRace(i);
    grid.appendChild(btn);
  }
}

function selectRace(no) {
  currentRace = currentVenue.races.find(r => r.no === no);
  if (!currentRace) {
    alert("データがありません");
    return;
  }
  document.getElementById("race-title").textContent =
    `${currentVenue.name} ${no}R 出走表`;
  renderEntries();
  renderAi();
  renderComments();
  showScreen("entries-screen");
}

function renderEntries() {
  const div = document.getElementById("entries-table");
  div.innerHTML = `
    <table>
      <tr>
        <th>枠番</th>
        <th>選手</th>
        <th>F</th>
        <th>ST</th>
        <th>当地</th>
        <th>モーター</th>
        <th>コース</th>
        <th>評価</th>
      </tr>
      ${currentRace.entries.map(e => `
        <tr>
          <td>${e.waku}</td>
          <td>${e.class}<br>${e.name}<br>ST:${e.st}</td>
          <td>${e.f}</td>
          <td>${e.st}</td>
          <td>${e.local}%</td>
          <td>${e.motor}%</td>
          <td>${e.course}%</td>
          <td class="${e.symbol === '◎' ? 'symbol-red':'symbol-black'}">${e.symbol}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function renderAi() {
  const div = document.getElementById("ai-predictions");
  div.innerHTML = `
    <table>
      <tr><th>本命予想</th></tr>
      ${currentRace.ai.main.map(m => `<tr><td>${m}</td></tr>`).join("")}
    </table>
    <table>
      <tr><th>穴予想</th></tr>
      ${currentRace.ai.sub.map(s => `<tr><td>${s}</td></tr>`).join("")}
    </table>
  `;
}

function renderComments() {
  const div = document.getElementById("comments");
  div.innerHTML = `
    <table>
      <tr><th>コース</th><th>コメント</th></tr>
      ${currentRace.comments.map(c => `<tr><td>${c.no}コース</td><td>${c.text}</td></tr>`).join("")}
    </table>
  `;
}

function goBack(screen) {
  showScreen(screen);
}