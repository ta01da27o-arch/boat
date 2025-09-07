let data = {};
let currentVenue = null;
let currentRace = null;

fetch("data.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    renderVenues();
  });

function renderVenues() {
  const container = document.getElementById("venues-list");
  container.innerHTML = "";
  data.venues.forEach(v => {
    const card = document.createElement("div");
    card.className = "venue-card";
    if (!v.open) card.classList.add("disabled");
    card.innerHTML = `<div>${v.name}</div><div>${v.accuracy}%</div>`;
    if (v.open) card.onclick = () => openVenue(v);
    container.appendChild(card);
  });
}

function openVenue(venue) {
  currentVenue = venue;
  document.getElementById("main-screen").classList.add("hidden");
  document.getElementById("race-screen").classList.remove("hidden");
  document.getElementById("venue-title").innerText = venue.name;
  const container = document.getElementById("races-list");
  container.innerHTML = "";
  venue.races.forEach(r => {
    const card = document.createElement("div");
    card.className = "race-card";
    card.innerText = `${r.no}R`;
    card.onclick = () => openRace(r);
    container.appendChild(card);
  });
}

function openRace(race) {
  currentRace = race;
  document.getElementById("race-screen").classList.add("hidden");
  document.getElementById("entries-screen").classList.remove("hidden");
  document.getElementById("race-title").innerText =
    `${currentVenue.name} ${race.no}R 出走表`;

  // 出走表
  const table = document.getElementById("entries-table");
  table.innerHTML = `
    <tr>
      <th>枠</th><th>階級/選手名/ST</th><th>F</th>
      <th>当地勝率</th><th>モーター勝率</th><th>コース勝率</th><th>評価</th>
    </tr>`;
  race.entries.forEach(e => {
    const tr = document.createElement("tr");
    const mark = getRankMark(e.rank);
    tr.innerHTML = `
      <td>${e.waku}</td>
      <td>${e.class}<br>${e.name}<br>${e.st}</td>
      <td>${e.f}</td>
      <td>${e.local}%</td>
      <td>${e.motor}%</td>
      <td>${e.course}%</td>
      <td style="color:${mark.color}">${mark.symbol}</td>
    `;
    table.appendChild(tr);
  });

  // AI予想
  const aiMain = document.getElementById("ai-main");
  const aiSub = document.getElementById("ai-sub");
  aiMain.innerHTML = "";
  aiSub.innerHTML = "";
  race.ai.main.forEach(b => aiMain.innerHTML += `<li>${b}</li>`);
  race.ai.sub.forEach(b => aiSub.innerHTML += `<li>${b}</li>`);

  // コメント
  const commentsList = document.getElementById("comments-list");
  commentsList.innerHTML = "";
  race.comments.forEach(c => {
    commentsList.innerHTML += `<li>${c.text || "-"}</li>`;
  });
}

function getRankMark(rank) {
  if (rank === 1) return {symbol: "◎", color: "red"};
  if (rank === 2) return {symbol: "○", color: "black"};
  if (rank === 3) return {symbol: "△", color: "black"};
  if (rank === 4) return {symbol: "✕", color: "black"};
  if (rank === 5) return {symbol: "ー", color: "black"};
  return {symbol: "-", color: "black"};
}

function goBack(target) {
  document.querySelectorAll("main,section").forEach(s => s.classList.add("hidden"));
  document.getElementById(target).classList.remove("hidden");
}

document.getElementById("refresh").onclick = () => renderVenues();