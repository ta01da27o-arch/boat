async function fetchData() {
  try {
    const res = await fetch("./data.json");
    return await res.json();
  } catch (e) {
    document.getElementById("view").innerHTML = "<p>データ取得エラー。</p>";
    return null;
  }
}

function renderVenues(data) {
  const view = document.getElementById("view");
  view.innerHTML = `
    <div class="grid-venues">
      ${data.venues.map(v => `
        <div class="venue-card" data-id="${v.id}">
          <div>${v.name}</div>
          ${v.hasRacesToday ? `<div class="active">開催中</div>` : ""}
        </div>
      `).join("")}
    </div>
  `;

  document.querySelectorAll(".venue-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      if (data.races[id]) renderRaces(id, data);
    });
  });
}

function renderRaces(venueId, data) {
  const view = document.getElementById("view");
  const races = data.races[venueId] || [];
  view.innerHTML = `
    <button class="btn back" id="backBtn">← 戻る</button>
    <table class="race-list">
      <tr>${[...Array(12).keys()].map(i => `<td class="race-btn" data-no="${i+1}">${i+1}R</td>`).join("")}</tr>
    </table>
  `;
  document.getElementById("backBtn").addEventListener("click", () => renderVenues(data));
  document.querySelectorAll(".race-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const no = btn.getAttribute("data-no");
      const race = races.find(r => r.number == no);
      if (race) renderRaceDetail(race, data, venueId);
    });
  });
}

function renderRaceDetail(race, data, venueId) {
  const view = document.getElementById("view");

  const entryRows = race.entries.map(e => `
    <tr>
      <td>${e.lane}</td>
      <td>${e.class}</td>
      <td>${e.name}${e.flying ? ` (F${e.flying})` : ""}</td>
      <td>${e.avgST}</td>
      <td><span class="symbol">${formatRate(e.localRate)}</span></td>
      <td><span class="symbol">${formatRate(e.motorRate)}</span> (${e.motor.no})</td>
      <td><span class="symbol">${formatRate(e.courseRate)}</span></td>
    </tr>
  `).join("");

  const predMain = race.predictions.map(p => `
    <div>${p.buy} (${p.probability}%)</div>
  `).join("");

  const predSub = race.predictionsAlt ? race.predictionsAlt.map(p => `
    <div>${p.buy} (${p.probability}%)</div>
  `).join("") : "";

  const comments = Object.entries(race.comments).map(([k,v]) => `
    <tr><td>${k}コース</td><td>${v || "-"}</td></tr>
  `).join("");

  view.innerHTML = `
    <button class="btn back" id="backBtn">← 戻る</button>
    <h2>${race.number}R 出走表</h2>
    <p>天候: ${race.env?.weather || "-"} / 風: ${race.env?.windDir || "-"} ${race.env?.windSpeed || "-"}m / 波高: ${race.env?.wave || "-"}cm</p>
    <table class="entry-table">
      <tr><th>枠</th><th>階級</th><th>選手名</th><th>平均ST</th><th>当地勝率</th><th>モーター勝率</th><th>コース勝率</th></tr>
      ${entryRows}
    </table>
    <h3>AI予想</h3>
    <div>${predMain}</div>
    <h3>AI穴予想</h3>
    <div>${predSub}</div>
    <h3>AIコメント</h3>
    <table class="comment-table">
      <tr><th>コース</th><th>コメント</th></tr>
      ${comments}
    </table>
  `;
  document.getElementById("backBtn").addEventListener("click", () => renderRaces(venueId, data));
}

function formatRate(val) {
  if (!val) return "-";
  if (val >= 40) return `◎${val}%`;
  if (val >= 30) return `○${val}%`;
  if (val >= 20) return `△${val}%`;
  if (val >= 10) return `✕${val}%`;
  return `ー${val}%`;
}

async function init() {
  const data = await fetchData();
  if (!data) return;
  document.getElementById("todayLabel").textContent = data.date;
  document.getElementById("globalHit").textContent = data.ai_accuracy + "%";
  renderVenues(data);

  document.getElementById("refreshBtn").addEventListener("click", init);
}

init();