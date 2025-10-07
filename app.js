const todayBtn = document.getElementById("todayBtn");
const prevBtn = document.getElementById("prevBtn");
const raceTableContainer = document.getElementById("raceTableContainer");
const raceTitle = document.getElementById("raceTitle");
const mainPicks = document.getElementById("mainPicks");
const midPicks = document.getElementById("midPicks");
const longPicks = document.getElementById("longPicks");
const commentText = document.getElementById("commentText");

let currentDataType = "today"; // デフォルト：本日

todayBtn.addEventListener("click", () => {
  currentDataType = "today";
  todayBtn.classList.add("active");
  prevBtn.classList.remove("active");
  loadRaceData();
});

prevBtn.addEventListener("click", () => {
  currentDataType = "yesterday";
  prevBtn.classList.add("active");
  todayBtn.classList.remove("active");
  loadRaceData();
});

async function loadRaceData() {
  try {
    const response = await fetch("data.json");
    const json = await response.json();
    const data = json[currentDataType];
    if (!data) throw new Error("データが見つかりません");

    renderRaceTable(data.raceInfo);
    renderPredictions(data.predictions);
    renderComment(data.comment);
    raceTitle.textContent = data.title;
  } catch (e) {
    console.error(e);
    raceTitle.textContent = "データ読み込みエラー";
    raceTableContainer.innerHTML = "";
    commentText.textContent = "データ取得に失敗しました。";
  }
}

function renderRaceTable(raceInfo) {
  let html = `
    <table>
      <tr>
        <th>選手名</th>
        <th>F</th>
        <th>全国</th>
        <th>当地</th>
        <th>モーター</th>
        <th>コース</th>
        <th>評価</th>
      </tr>
  `;
  raceInfo.forEach(p => {
    html += `
      <tr class="tr-${p.waku}">
        <td>${p.name}</td>
        <td>${p.f}</td>
        <td>${p.national}%</td>
        <td>${p.local}%</td>
        <td>${p.motor}</td>
        <td>${p.course}</td>
        <td class="strength-${p.strength}">${p.score}</td>
      </tr>
    `;
  });
  html += `</table>`;
  raceTableContainer.innerHTML = html;
}

function renderPredictions(predictions) {
  mainPicks.innerHTML = predictions.main.map(p => `<li>${p}</li>`).join("");
  midPicks.innerHTML = predictions.middle.map(p => `<li>${p}</li>`).join("");
  longPicks.innerHTML = predictions.long.map(p => `<li>${p}</li>`).join("");
}

function renderComment(comment) {
  commentText.textContent = comment;
}

loadRaceData();