// JSONデータを読み込んで表示
async function loadRaces() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();

    const racesContainer = document.getElementById("races");
    racesContainer.innerHTML = "";

    data.races.forEach(race => {
      const card = document.createElement("div");
      card.className = "race-card";

      card.innerHTML = `
        <h3>${race.place} ${race.date} 第${race.race_number}R</h3>
        <p><strong>AI予想:</strong> ${race.ai_prediction}</p>
        <p><strong>平均ST:</strong> 
          ${Object.entries(race.average_start).map(([k, v]) => `${k}号艇 ${v}`).join(" / ")}
        </p>
        <p><strong>AIコメント:</strong> ${race.ai_comment}</p>
      `;

      racesContainer.appendChild(card);
    });
  } catch (error) {
    console.error("データ読み込みエラー:", error);
  }
}

// ページ読み込み時に実行
document.addEventListener("DOMContentLoaded", loadRaces);