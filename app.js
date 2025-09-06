let currentVenue = null;
let currentRace = null;
let data = {};

async function loadData() {
  const res = await fetch("data.json");
  data = await res.json();
  showVenues();
}

function showVenues() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <h1>競艇AI予想</h1>
    <h3>総合的中率：${data.accuracy}%</h3>
    <div class="venues-grid">
      ${data.venues.map(v => `
        <div class="venue" onclick="showRaces(${v.id})">
          <div>${v.name}</div>
          <p>${v.hit_rate}%</p>
        </div>
      `).join("")}
    </div>
  `;
}

function showRaces(venueId) {
  currentVenue = data.venues.find(v => v.id === venueId);
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>${currentVenue.name} - レース一覧</h2>
    <button class="back-btn" onclick="showVenues()">戻る</button>
    <div class="races-grid">
      ${currentVenue.races.map(r => `
        <div class="race-btn" onclick="showEntries(${r.no})">${r.no}R</div>
      `).join("")}
    </div>
  `;
}

function showEntries(raceNo) {
  currentRace = currentVenue.races.find(r => r.no === raceNo);
  const app = document.getElementById("app");

  app.innerHTML = `
    <h2>${currentVenue.name} ${currentRace.no}R 出走表</h2>
    <button class="back-btn" onclick="showRaces(${currentVenue.id})">戻る</button>

    <table>
      <tr>
        <th>枠番</th>
        <th>選手</th>
        <th>平均ST</th>
        <th>当地勝率</th>
        <th>モーター勝率</th>
        <th>コース勝率</th>
      </tr>
      ${currentRace.entries.map(e => `
        <tr>
          <td>${e.waku}</td>
          <td>
            <div>${e.class}</div>
            <div>${e.name}</div>
            <div>${e.f}</div>
          </td>
          <td>${e.st}</td>
          <td>${e.local.rank === 1 ? `<span class="rank-top">◎${e.local.value}%</span>` : `<span class="rank-mid">${e.local.symbol}${e.local.value}%</span>`}</td>
          <td>${e.motor.rank === 1 ? `<span class="rank-top">◎${e.motor.value}%</span>` : `<span class="rank-mid">${e.motor.symbol}${e.motor.value}%</span>`}</td>
          <td>${e.course.rank === 1 ? `<span class="rank-top">◎${e.course.value}%</span>` : `<span class="rank-mid">${e.course.symbol}${e.course.value}%</span>`}</td>
        </tr>
      `).join("")}
    </table>

    <div class="prediction-table">
      <table>
        <tr><th>AI本命買い目</th></tr>
        ${currentRace.ai.main.map(b => `<tr><td>${b}</td></tr>`).join("")}
      </table>
      <table>
        <tr><th>AI穴買い目</th></tr>
        ${currentRace.ai.sub.map(b => `<tr><td>${b}</td></tr>`).join("")}
      </table>
    </div>

    <table class="comment-table">
      <tr><th>コース</th><th>コメント</th></tr>
      ${currentRace.comments.map(c => `
        <tr><td>${c.no}コース</td><td>${c.text}</td></tr>
      `).join("")}
    </table>
  `;
}

loadData();