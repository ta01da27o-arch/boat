document.getElementById('today').textContent = new Date().toLocaleDateString();

async function loadData() {
  const res = await fetch('data.json', { cache: "no-store" });
  const data = await res.json();
  return data;
}

async function showVenues() {
  const venueList = document.getElementById('venueList');
  venueList.innerHTML = '';
  const data = await loadData();
  
  let totalRate = 0;
  data.venues.forEach(venue => totalRate += venue.aiRate);
  document.getElementById('totalAiRate').textContent = `総合AI的中率: ${Math.round(totalRate / data.venues.length)}%`;

  data.venues.forEach(venue => {
    const li = document.createElement('li');
    li.textContent = venue.name + `\nAI的中率: ${venue.aiRate}%`;
    li.onclick = () => showRaces(venue);
    venueList.appendChild(li);
  });
}

function showRaces(venue) {
  const main = document.querySelector('main');
  main.innerHTML = `<button onclick="showVenues()">戻る</button><ul id="raceList"></ul>`;
  const ul = document.getElementById('raceList');

  venue.races.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `R${r.number}`;
    li.onclick = () => showRaceDetail(r, venue);
    ul.appendChild(li);
  });
}

function showRaceDetail(race, venue) {
  const main = document.querySelector('main');
  main.innerHTML = `<button onclick="showRaces(venue)">戻る</button>`;
  
  const table = document.createElement('table');
  table.innerHTML = `<tr><th>枠</th><th>選手</th><th>平均ST</th><th>モーター</th></tr>`;
  race.entries.forEach(e => {
    table.innerHTML += `<tr>
      <td>${e.frame}</td>
      <td>${e.name}(${e.grade})</td>
      <td>${e.avgSt}</td>
      <td>番号:${e.motorNum}<br>2連:${e.twoRate}%<br>3連:${e.threeRate}%</td>
    </tr>`;
  });
  main.appendChild(table);

  const aiDiv = document.createElement('div');
  aiDiv.innerHTML = `<h3>AI予想</h3>`;
  race.aiPrediction.forEach(p => {
    aiDiv.innerHTML += `<div>${p.combo} → ${p.prob}%</div>`;
  });
  main.appendChild(aiDiv);

  const commentDiv = document.createElement('div');
  commentDiv.innerHTML = `<h3>AIコメント</h3>`;
  race.aiComments.forEach(c => {
    commentDiv.innerHTML += `<div>${c}</div>`;
  });
  main.appendChild(commentDiv);
}

showVenues();

document.getElementById('updateBtn').onclick = () => location.reload();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}