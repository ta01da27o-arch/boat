// JSONデータの読み込み
async function loadData() {
  const response = await fetch("data.json?nocache=" + new Date().getTime());
  return await response.json();
}

// 初期化
loadData().then(data => {
  const stadiumList = document.getElementById("stadium-list");
  const raceList = document.getElementById("race-list");
  const raceDetail = document.getElementById("race-detail");

  // 競艇場ボタンを作成
  Object.keys(data).forEach(stadium => {
    const div = document.createElement("div");
    div.className = "stadium-card";
    div.innerHTML = `<h3>${stadium}</h3>`;
    const btn = document.createElement("button");
    btn.textContent = "レース一覧";
    btn.onclick = () => showRaces(stadium, data[stadium]);
    div.appendChild(btn);
    stadiumList.appendChild(div);
  });

  // レース番号を表示
  function showRaces(stadium, races) {
    raceList.innerHTML = "";
    raceDetail.innerHTML = "";

    for (let i = 1; i <= 12; i++) {
      const btn = document.createElement("button");
      btn.textContent = i + "R";
      btn.onclick = () => showDetail(stadium, i, races[i]);
      raceList.appendChild(btn);
    }
  }

  // 出走表やAI予想を表示
  function showDetail(stadium, raceNo, raceData) {
    raceDetail.innerHTML = `
      <h2>${stadium} ${raceNo}R</h2>
      <p><strong>AI予想:</strong> ${raceData.ai}</p>
      <p><strong>平均ST:</strong> ${raceData.avgST}</p>
      <p><strong>コメント:</strong> ${raceData.comment}</p>
    `;
  }
});