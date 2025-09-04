document.addEventListener("DOMContentLoaded", () => {
  const currentDateEl = document.getElementById("current-date");
  const today = new Date();
  currentDateEl.textContent = today.toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric"
  });

  const mainView = document.getElementById("main-view");
  const raceView = document.getElementById("race-view");
  const detailsView = document.getElementById("details-view");

  const venuesGrid = document.getElementById("venues-grid");
  const venueTitle = document.getElementById("venue-title");
  const venueTotalRate = document.getElementById("venue-total-rate");
  const raceButtons = document.getElementById("race-buttons");
  const raceTitle = document.getElementById("race-title");
  const raceTableBody = document.querySelector("#race-table tbody");
  const aiPredictions = document.getElementById("ai-predictions");
  const aiCommentsBody = document.querySelector("#ai-comments tbody");

  let data = {};

  fetch("data.json?ver=" + Date.now())
    .then(res => res.json())
    .then(json => {
      data = json;
      renderVenues();
    });

  function renderVenues() {
    venuesGrid.innerHTML = "";
    data.venues.forEach(venue => {
      const btn = document.createElement("button");
      btn.textContent = venue.name;
      btn.className = "venue-btn";
      btn.disabled = !venue.is_open;
      btn.addEventListener("click", () => showRaces(venue));
      venuesGrid.appendChild(btn);
    });
  }

  function showRaces(venue) {
    mainView.classList.add("hidden");
    detailsView.classList.add("hidden");
    raceView.classList.remove("hidden");

    venueTitle.textContent = venue.name;
    venueTotalRate.textContent = `AI的中率: ${venue.hit_rate || "-"}%`;

    raceButtons.innerHTML = "";
    for (let i = 1; i <= 12; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${i}R`;
      btn.className = "race-btn";
      btn.addEventListener("click", () => showRaceDetails(venue, i));
      raceButtons.appendChild(btn);
    }
  }

  function showRaceDetails(venue, raceNo) {
    raceView.classList.add("hidden");
    detailsView.classList.remove("hidden");

    raceTitle.textContent = `${venue.name} ${raceNo}R`;

    const race = venue.races[raceNo];
    raceTableBody.innerHTML = "";
    race.entries.forEach(entry => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.waku}</td>
        <td>${entry.class}</td>
        <td>${entry.name}</td>
        <td>${entry.st}</td>
        <td>${entry.motor.no}<br>
            ${entry.motor.rate2}%<br>
            ${entry.motor.rate3}%</td>
      `;
      raceTableBody.appendChild(tr);
    });

    aiPredictions.innerHTML = "";
    race.predictions.forEach(p => {
      const li = document.createElement("li");
      li.textContent = `${p.buy} (${p.rate}%)`;
      aiPredictions.appendChild(li);
    });

    aiCommentsBody.innerHTML = "";
    race.comments.forEach(c => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${c.course}</td><td>${c.text}</td>`;
      aiCommentsBody.appendChild(tr);
    });
  }

  document.getElementById("back-to-venues").addEventListener("click", () => {
    raceView.classList.add("hidden");
    mainView.classList.remove("hidden");
  });

  document.getElementById("back-to-races").addEventListener("click", () => {
    detailsView.classList.add("hidden");
    raceView.classList.remove("hidden");
  });
});