document.addEventListener("DOMContentLoaded", () => {
  const todayLabel = document.getElementById("todayLabel");
  const globalHit = document.getElementById("globalHit");
  const refreshBtn = document.getElementById("refreshBtn");
  const view = document.getElementById("view");

  // 今日の日付表示
  const today = new Date();
  todayLabel.textContent = today.toLocaleDateString("ja-JP");

  // データロード
  async function loadData() {
    try {
      const res = await fetch("./data.json");
      const data = await res.json();
      renderStadiums(data);
      globalHit.textContent = data.global_hit + "%";
    } catch (e) {
      view.innerHTML = "<p>データ取得エラー。</p>";
    }
  }

  refreshBtn.addEventListener("click", loadData);

  // 競艇場一覧表示
  function renderStadiums(data) {
    view.innerHTML = "";

    const grid = document.createElement("div");
    grid.className = "stadium-grid";

    data.stadiums.forEach(stadium => {
      const card = document.createElement("div");
      card.className = "stadium-card";

      const name = document.createElement("div");
      name.className = "stadium-name";
      name.textContent = stadium.name;

      const hit = document.createElement("div");
      hit.className = "stadium-hit";
      hit.textContent = `的中率: ${stadium.hit_rate}%`;

      const liveBtn = document.createElement("button");
      liveBtn.className = "btn-live";
      liveBtn.textContent = "開催中";
      liveBtn.addEventListener("click", () => renderRaces(stadium));

      card.appendChild(name);
      card.appendChild(hit);
      card.appendChild(liveBtn);
      grid.appendChild(card);
    });

    view.appendChild(grid);
  }

  // レース番号一覧表示
  function renderRaces(stadium) {
    view.innerHTML = "";

    const backBtn = document.getElementById("tpl-back-btn").content.cloneNode(true);
    backBtn.querySelector("#backBtn").addEventListener("click", loadData);
    view.appendChild(backBtn);

    const grid = document.createElement("div");
    grid.className = "race-grid";

    for (let i = 1; i <= 12; i++) {
      const card = document.createElement("div");
      card.className = "race-card";
      card.textContent = `${i}R`;
      card.addEventListener("click", () => renderRaceDetail(stadium, i));
      grid.appendChild(card);
    }

    view.appendChild(grid);
  }

  // 出走表 & 予想詳細表示
  function renderRaceDetail(stadium, raceNo) {
    view.innerHTML = "";

    const backBtn = document.getElementById("tpl-back-btn").content.cloneNode(true);
    backBtn.querySelector("#backBtn").addEventListener("click", () => renderRaces(stadium));
    view.appendChild(backBtn);

    const title = document.createElement("h2");
    title.textContent = `${stadium.name} ${raceNo}R 出走表`;
    view.appendChild(title);

    const table = document.createElement("table");
    table.className = "entry-table";

    const header = document.createElement("tr");
    header.innerHTML = "<th>枠番</th><th>選手名</th>";
    table.appendChild(header);

    (stadium.entries?.[raceNo] || []).forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${entry.lane}</td><td>${entry.name}</td>`;
      table.appendChild(row);
    });

    view.appendChild(table);

    const buy = document.createElement("div");
    buy.className = "comment";
    buy.textContent = `AI予想買い目: ${stadium.predictions?.[raceNo] || "データなし"}`;
    view.appendChild(buy);

    const comment = document.createElement("div");
    comment.className = "comment";
    comment.textContent = stadium.comments?.[raceNo] || "コメントなし";
    view.appendChild(comment);
  }

  loadData();
});