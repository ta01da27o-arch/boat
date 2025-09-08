let app = document.getElementById("main-view");

// 今日の日付表示
document.getElementById("today-date").textContent = new Date().toLocaleDateString("ja-JP");

// 更新ボタン
document.getElementById("refresh-btn").addEventListener("click", () => {
  caches.keys().then(names => names.forEach(n => caches.delete(n)));
  location.reload();
});

// JSON読み込み
async function loadData() {
  const res = await fetch("data.json");
  return await res.json();
}

// 初期表示
loadData().then(data => {
  showVenues(data);
});

// 競艇場一覧
function showVenues(data) {
  app.innerHTML = `<div class="grid-venues"></div>`;
  const grid = app.querySelector(".grid-venues");

  data.venues.forEach(v => {
    let div = document.createElement("div");
    if (v.active) {
      div.className = "venue-card venue-active";
      div.innerHTML = `<div>開催中</div><div>${v.name}</div><div>的中率 ${v.rate}%</div>`;
      div.onclick = () => showRaces(v, data);
    } else {
      div.className = "venue-card venue-inactive";
      div.innerHTML = `<div>ー</div><div>${v.name}</div><div>的中率 ${v.rate}%</div>`;
    }
    grid.appendChild(div);
  });
}

// レース番号画面
function showRaces(venue, data) {
  app.innerHTML = `
    <div class="back-btn" onclick="showVenues(window.appData)">戻る</div>
    <h2>${venue.name} レース選択</h2>
    <div class="grid-races"></div>
  `;
  const grid = app.querySelector(".grid-races");

  for (let i = 1; i <= 12; i++) {
    let div = document.createElement("div");
    div.className = "race-btn";
    div.textContent = `${i}R`;
    div.onclick = () => {
      const race = venue.races.find(r => r.no === i);
      showRace(venue, race);
    };
    grid.appendChild(div);
  }
  window.appData = data;
}

// 出走表
function showRace(venue, race) {
  app.innerHTML = `
    <div class="back-btn" onclick="showRaces(window.appData.venues.find(v=>v.id==='${venue.id}'), window.appData)">戻る</div>
    <h2>${venue.name} ${race.no}R 出走表</h2>
    <table class="race-table">
      <tr>
        <th>枠</th><th>階級/選手/ST/F</th><th>当地</th><th>モーター</th><th>コース</th><th>評価</th>
      </tr>
      ${race.entries.map(e => `
        <tr>
          <td>${e.waku}</td>
          <td>
            <div>${e.class}</div>
            <div>${e.name}</div>
            <div>${e.st} ${e.f}</div>
          </td>
          <td>
            <div class="symbol ${e.local.symbol==='◎'?'red':'black'}">${e.local.symbol}</div>
            <div>${e.local.two}%</div>
            <div>${e.local.three}%</div>
          </td>
          <td>
            <div class="symbol ${e.motor.symbol==='◎'?'red':'black'}">${e.motor.symbol}</div>
            <div>${e.motor.two}%</div>
            <div>${e.motor.three}%</div>
          </td>
          <td>
            <div class="symbol ${e.course.symbol==='◎'?'red':'black'}">${e.course.symbol}</div>
            <div>${e.course.two}%</div>
            <div>${e.course.three}%</div>
          </td>
          <td>
            <div class="symbol ${e.eval==='◎'?'red':'black'}">${e.eval}</div>
          </td>
        </tr>
      `).join("")}
    </table>

    <div class="ai-section">
      <h3>AI予想</h3>
      <table class="ai-table">
        <tr><th>本命</th><th>穴</th></tr>
        ${[0,1,2,3,4].map(i => `
          <tr>
            <td>${race.ai.main[i] || "-"}</td>
            <td>${race.ai.sub[i] || "-"}</td>
          </tr>
        `).join("")}
      </table>
    </div>

    <div class="ai-section">
      <h3>コメント</h3>
      <table class="comment-table">
        ${race.comments.map(c => `
          <tr><th>${c.no}号艇</th><td>${c.text||"-"}</td></tr>
        `).join("")}
      </table>
    </div>
  `;
}