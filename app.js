let data = {};
let currentVenue = null;
let currentRace = null;

// 初期ロード
fetch("data.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    showVenues();
  })
  .catch(err => {
    document.getElementById("app").innerHTML = `<p>データ取得エラー: ${err}</p>`;
  });

// 日付
document.getElementById("date").textContent = new Date().toLocaleDateString("ja-JP");

// 競艇場画面
function showVenues() {
  const app = document.getElementById("app");
  app.innerHTML = `<div class="grid-venues">
    ${data.venues.map(v => `
      <div class="venue-card" onclick="showRaces('${v.id}')">${v.name}</div>
    `).join("")}
  </div>`;
}

// レース番号画面
function showRaces(venueId) {
  currentVenue = venueId;
  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>${data.venues.find(v => v.id === venueId).name}</h2>
    <div class="grid-races">
      ${Array.from({length: 12}, (_, i) => `
        <div class="race-card" onclick="showRaceDetail(${i+1})">${i+1}R</div>
      `).join("")}
    </div>
    <button class="back" onclick="showVenues()">戻る</button>
  `;
}

// 出走表画面
function showRaceDetail(raceNo) {
  currentRace = raceNo;
  const venue = data.venues.find(v => v.id === currentVenue);
  const race = venue.races.find(r => r.no === raceNo);

  let rows = race.entries.map(e => `
    <tr>
      <td>${e.waku}</td>
      <td>${e.class}</td>
      <td>${e.name} ${e.f || ""}</td>
      <td>${e.st}</td>
      <td>${markWithRank(e.local)}</td>
      <td>${markWithRank(e.motor)}</td>
      <td>${markWithRank(e.course)}</td>
    </tr>
  `).join("");

  let aiMain = race.ai.main.map(p => `<li>${p.bet} ${p.rate}%</li>`).join("");
  let aiSub = race.ai.sub.map(p => `<li>${p.bet} ${p.rate}%</li>`).join("");
  let comments = race.comments.map(c => `<tr><td>${c.no}</td><td>${c.text}</td></tr>`).join("");

  const app = document.getElementById("app");
  app.innerHTML = `
    <h2>${venue.name} ${raceNo}R</h2>
    <table class="table">
      <tr><th>枠</th><th>級</th><th>選手</th><th>ST</th><th>当地勝率</th><th>モーター勝率</th><th>コース勝率</th></tr>
      ${rows}
    </table>

    <h3>AI本命予想</h3>
    <ul>${aiMain}</ul>
    <h3>AI穴予想</h3>
    <ul>${aiSub}</ul>

    <h3>コメント</h3>
    <table class="table">${comments}</table>

    <button class="back" onclick="showRaces('${currentVenue}')">戻る</button>
  `;
}

// 勝率記号付け
function markWithRank(stat) {
  const symbols = ["◎","○","△","✕","ー","ー"];
  return stat.map((s, i) => `<div class="${i===0 ? "red" : ""}">${symbols[i]}${s}%</div>`).join("");
}