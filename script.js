document.getElementById("stadium").addEventListener("change", function () {
  const stadium = this.value;
  if (!stadium) return;

  fetch(`data/${stadium}.json`)
    .then((res) => res.json())
    .then((data) => {
      const raceSelect = document.getElementById("race");
      raceSelect.innerHTML = "";

      data.races.forEach((race, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        opt.textContent = race.title;
        raceSelect.appendChild(opt);
      });

      document.getElementById("race-select").style.display = "block";
      document.getElementById("result").style.display = "none";

      raceSelect.onchange = () => {
        const race = data.races[raceSelect.value];
        document.getElementById("race-title").textContent = race.title;
        document.getElementById("ai-prediction").textContent = race.ai_prediction;
        document.getElementById("avg-start").textContent = race.avg_start;
        document.getElementById("ai-comment").textContent = race.ai_comment;
        document.getElementById("result").style.display = "block";
      };
    });
});