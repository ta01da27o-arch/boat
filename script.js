async function loadData() {
  try {
    const response = await fetch("data.json?nocache=" + new Date().getTime());
    const data = await response.json();
    renderVenues(data.venues);
  } catch (err) {
    console.error("データ取得エラー:", err);
  }
}

function renderVenues(venues) {
  const container = document.getElementById("venue-container");
  container.innerHTML = "";
  venues.forEach(venue => {
    const btn = document.createElement("button");
    btn.textContent = venue.name;
    btn.className = "venue-button";
    btn.disabled = !venue.open; // 開催中でなければ無効
    if (venue.open) {
      btn.onclick = () => renderRaces(venue);
    }
    container.appendChild(btn);
  });
}

function renderRaces(venue) {
  const raceContainer = document.getElementById("race-container");
  raceContainer.style.display = "grid";
  raceContainer.innerHTML = "";
  
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.className = "race-button";
    btn.onclick = () => renderResult(venue, i);
    raceContainer.appendChild(btn);
  }
}

function renderResult(venue, raceNum) {
  const resultContainer = document.getElementById("result-container");
  const race = venue.races.find(r => r.number === raceNum);
  
  if (!race) {
    resultContainer.innerHTML = `<p>${venue.name} ${raceNum}R のデータがありません</p>`;
    return;
  }

  resultContainer.innerHTML = `
    <h2>${venue.name} ${raceNum}R</h2>
    <table border="1" style="margin:auto; border-collapse: collapse;">
      <tr><th>選手</th><th>平均ST</th><th>AI予想ST</th></tr>
      ${race.entries.map(e => `<tr><td>${e.name}</td><td>${e.avgST}</td><td>${e.aiST}</td></tr>`).join("")}
    </table>
    <p><b>AI予想:</b> ${race.aiPrediction}</p>
    <p><b>的中率:</b> ${race.aiAccuracy}%</p>
    <p><b>展開予想:</b> ${race.comment}</p>
  `;
}

loadData();