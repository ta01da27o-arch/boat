// --- 出走表表示 ---
function showRaceDetail(stadium, raceNo, detail) {
  document.getElementById("race-area").classList.add("hidden");
  const detailArea = document.getElementById("detail-area");
  detailArea.classList.remove("hidden");
  detailArea.innerHTML = "";

  const header = document.createElement("div");
  header.className = "race-header";
  header.innerHTML = `<h2>${stadium} ${raceNo}R 出走表</h2>`;
  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "戻る";
  backBtn.onclick = () => {
    detailArea.classList.add("hidden");
    document.getElementById("race-area").classList.remove("hidden");
  };
  header.appendChild(backBtn);
  detailArea.appendChild(header);

  // 出走表テーブル
  const table = document.createElement("table");
  table.className = "race-table";
  const thead = `
    <tr>
      <th>枠</th>
      <th>選手</th>
      <th>平均ST</th>
      <th>モーター</th>
    </tr>
  `;
  table.innerHTML = thead;

  detail.entries.forEach(entry => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.waku}</td>
      <td>
        ${entry.name} (${entry.grade})<br>
        <small>(${entry.rank})</small>
      </td>
      <td>${entry.avgST}</td>
      <td>
        ${entry.motorNo}<br>
        <small>2連対:${entry.motor2 || "-"}%</small><br>
        <small>3連対:${entry.motor3 || "-"}%</small>
      </td>
    `;
    table.appendChild(tr);
  });

  detailArea.appendChild(table);

  // AI予想買い目
  const buyBox = document.createElement("div");
  buyBox.className = "detail-box";
  buyBox.innerHTML = `
    <h3>AI予想買い目</h3>
    <p>${(detail.ai || []).join("　")}</p>
  `;
  detailArea.appendChild(buyBox);

  // AIコメント
  const commentBox = document.createElement("div");
  commentBox.className = "detail-box";
  commentBox.innerHTML = `
    <h3>AIコメント</h3>
    <p>${detail.comment || "－"}</p>
  `;
  detailArea.appendChild(commentBox);
}