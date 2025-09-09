async function loadData() {
  const res = await fetch("data.json");
  return res.json();
}

function showVenues(data) {
  const main = document.getElementById("main-content");
  main.innerHTML = "";

  data.forEach(venue => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h2>${venue.name}</h2>
      <p>${venue.status}</p>
      <p>的中率: ${venue.rate}%</p>
    `;
    card.onclick = () => showVenueDetail(venue);
    main.appendChild(card);
  });
}

function showVenueDetail(venue) {
  const main = document.getElementById("main-content");
  main.innerHTML = `
    <button class="back-btn" onclick="init()">戻る</button>
    <h2>${venue.name} - ${venue.status}</h2>
  `;

  venue.races.forEach(race => {
    const raceDiv = document.createElement("div");
    raceDiv.className = "race";
    raceDiv.innerHTML = `
      <h3>${race.no}R</h3>
      <table class="entry-table">
        <tr>
          <th>枠</th><th>選手</th><th>印</th>
        </tr>
        ${race.entries.map((e,i)=>`
          <tr>
            <td>${i+1}</td>
            <td>${e.name}</td>
            <td class="mark" data-type="${e.mark}">${e.mark}</td>
          </tr>`).join("")}
      </table>
      <h4>予想買い目</h4>
      <table class="buy-table">
        <tr><th>買い目</th><th>確率</th></tr>
        ${race.predictions.map(p=>`
          <tr>
            <td>${p.bet}</td>
            <td>${p.rate}%</td>
          </tr>`).join("")}
      </table>
    `;
    main.appendChild(raceDiv);
  });
}

async function init() {
  const data = await loadData();
  showVenues(data);
}

init();