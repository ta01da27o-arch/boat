document.addEventListener("DOMContentLoaded", () => {
  fetch("data.json")
    .then(res => res.json())
    .then(data => {
      showVenues(data.venues, data.races);
    });

  function showVenues(venues, races) {
    const main = document.getElementById("main-content");
    main.innerHTML = "<h2>開催場一覧</h2>";
    const grid = document.createElement("div");
    grid.className = "grid";

    venues.forEach(venue => {
      const card = document.createElement("div");
      card.className = "card";
      card.textContent = venue;
      card.addEventListener("click", () => showRaces(venue, races));
      grid.appendChild(card);
    });

    main.appendChild(grid);
  }

  function showRaces(venue, races) {
    const main = document.getElementById("main-content");
    main.innerHTML = `
      <button class="back-button">戻る</button>
      <h2>${venue} - 出走表</h2>
    `;
    document.querySelector(".back-button").addEventListener("click", () => {
      fetch("data.json").then(res => res.json()).then(data => {
        showVenues(data.venues, data.races);
      });
    });

    const venueRaces = races.filter(r => r.venue === venue);
    venueRaces.forEach(race => {
      const div = document.createElement("div");
      div.innerHTML = `<h3>${race.race_number}R</h3>`;

      // 出走表
      const table = document.createElement("table");
      table.className = "race-table";
      table.innerHTML = `
        <tr><th>枠</th><th>選手</th><th>印</th></tr>
      `;
      race.entries.forEach((e, i) => {
        table.innerHTML += `
          <tr>
            <td>${i + 1}</td>
            <td>${e.name}</td>
            <td class="mark" data-type="${e.mark}">${e.mark}</td>
          </tr>
        `;
      });
      div.appendChild(table);

      // 予想買い目
      const predTable = document.createElement("table");
      predTable.className = "prediction-table";
      predTable.innerHTML = `
        <tr><th>買い目</th><th>確率</th></tr>
      `;
      race.predictions.forEach(p => {
        predTable.innerHTML += `
          <tr><td>${p.bet}</td><td>${p.percent}%</td></tr>
        `;
      });
      div.appendChild(predTable);

      main.appendChild(div);
    });
  }
});