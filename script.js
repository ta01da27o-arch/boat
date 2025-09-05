const view = document.getElementById("view");
const todayLabel = document.getElementById("todayLabel");
const globalHit = document.getElementById("globalHit");
const refreshBtn = document.getElementById("refreshBtn");

let appData = null;

// 今日の日付を表示
function updateToday() {
  const d = new Date();
  todayLabel.textContent = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
}

// データ取得
async function loadData() {
  try {
    const res = await fetch("./data.json?_=" + Date.now());
    appData = await res.json();
    globalHit.textContent = appData.globalHit || "--%";
    showVenues();
  } catch (e) {
    view.innerHTML = "<p>データ取得エラー。data.jsonを確認して下さい。</p>";
  }
}

// 競艇場一覧
function showVenues() {
  view.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "grid-venues";

  appData.venues.forEach((v, i) => {
    const card = document.createElement("div");
    card.className = "venue-card";
    card.innerHTML = `<div>${v.name}</div><button class="btn ghost">開催中</button>`;
    card.querySelector("button").addEventListener("click", () => showRaces(v));
    grid.appendChild(card);
  });

  view.appendChild(grid);
}

// レース一覧
function showRaces(venue) {
  view.innerHTML = "";
  const back = document.getElementById("tpl-back-btn").content.cloneNode(true);
  back.querySelector("#backBtn").addEventListener("click", showVenues);
  view.appendChild(back);

  const ul = document.createElement("ul");
  venue.races.forEach(r => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "btn ghost";
    btn.textContent = `${r.no}R`;
    btn.addEventListener("click", () => showRaceDetail(venue, r));
    li.appendChild(btn);
    ul.appendChild(li);
  });
  view.appendChild(ul);
}

// 出走表詳細
function showRaceDetail(venue, race) {
  view.innerHTML = "";
  const back = document.getElementById("tpl-back-btn").content.cloneNode(true);
  back.querySelector("#backBtn").addEventListener("click", () => showRaces(venue));
  view.appendChild(back);

  // 出走表
  const table = document.createElement("table");
  table.className = "entry-table";
  table.innerHTML = `
    <tr>
      <th>枠番</th><th>階級</th><th>選手名</th><th>平均ST</th>
      <th>当地勝率</th><th>モーター</th><th>コース勝率</th>
    </tr>
  `;
  race.entries.forEach(e => {
    table.innerHTML += `
      <tr>
        <td>${e.no}</td>
        <td>${e.rank}</td>
        <td>${e.name}</td>
        <td>${e.st}</td>
        <td>${e.local}</td>
        <td>${e.motor}</td>
        <td>${e.course}</td>
      </tr>
    `;
  });
  view.appendChild(table);

  // AI予想
  const picks = document.createElement("div");
  picks.className = "ai-picks";
  picks.innerHTML = "<h3>AI買い目予想</h3><ul>" +
    race.ai.picks.map(p => `<li>${p.no} (${p.rate})</li>`).join("") +
    "</ul>";
  view.appendChild(picks);

  // AIコメント
  const comments = document.createElement("table");
  comments.className = "ai-comments";
  comments.innerHTML = "<tr><th>コース</th><th>コメント</th></tr>" +
    race.ai.comments.map(c => `<tr><td>${c.course}</td><td>${c.text}</td></tr>`).join("");
  view.appendChild(comments);
}

refreshBtn.addEventListener("click", loadData);
updateToday();
loadData();