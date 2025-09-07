async function loadRaceData() {
  const response = await fetch("data.json");
  const data = await response.json();

  const venueSelect = document.getElementById("venue");
  const selectedVenue = venueSelect.value;
  const race = data[selectedVenue]["1R"];

  renderEntryList(race.entry);
  renderPredictions(race.predictions);
  renderComments(race.comments);
}

function renderEntryList(entries) {
  const container = document.getElementById("entry-list");
  let html = "<table><thead><tr><th>艇番</th><th>選手名</th><th>支部</th><th>勝率</th></tr></thead><tbody>";
  entries.forEach(e => {
    html += `
      <tr>
        <td data-label="艇番">${e.number}</td>
        <td data-label="選手名">${e.name}</td>
        <td data-label="支部">${e.branch}</td>
        <td data-label="勝率">${e.rate}</td>
      </tr>
    `;
  });
  html += "</tbody></table>";
  container.innerHTML = html;
}

function renderPredictions(predictions) {
  const container = document.getElementById("predictions");
  container.innerHTML = predictions.map(p => `<li>${p}</li>`).join("");
}

function renderComments(comments) {
  const container = document.getElementById("comments");
  container.innerHTML = comments.map(c => `<p>・${c}</p>`).join("");
}

document.getElementById("venue").addEventListener("change", loadRaceData);

// 初期読み込み
loadRaceData();