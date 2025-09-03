// データをキャッシュせず常に最新を取得
fetch('data.json?time=' + new Date().getTime())
  .then(response => response.json())
  .then(data => {
    renderRaces(data);
  })
  .catch(error => {
    console.error("データ取得エラー:", error);
  });

function renderRaces(data) {
  const container = document.getElementById("race-tables");
  container.innerHTML = "";

  data.forEach(venue => {
    const venueSection = document.createElement("section");
    const venueTitle = document.createElement("h3");
    venueTitle.textContent = `🏟 ${venue.venue}`;
    venueSection.appendChild(venueTitle);

    venue.races.forEach(race => {
      const table = document.createElement("table");

      // 見出し行
      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th>レース</th>
          <th>出走表</th>
          <th>平均ST</th>
          <th>AI予想ST</th>
          <th>予想買い目</th>
          <th>AIコメント</th>
        </tr>
      `;
      table.appendChild(thead);

      // データ行
      const tbody = document.createElement("tbody");
      const row = document.createElement("tr");
      row.innerHTML = `
        <td data-label="レース">${race.race_no}</td>
        <td data-label="出走表">${race.entries.join(" / ")}</td>
        <td data-label="平均ST">${race.avg_st.join(" / ")}</td>
        <td data-label="AI予想ST">${race.ai_st.join(" / ")}</td>
        <td data-label="予想買い目">${race.predictions.join(", ")}</td>
        <td data-label="AIコメント">${race.comment}</td>
      `;
      tbody.appendChild(row);
      table.appendChild(tbody);

      venueSection.appendChild(table);
    });

    container.appendChild(venueSection);
  });
}