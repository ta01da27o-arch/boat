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

    // 出走表テーブル
    const table = document.createElement("table");
    table.className = "entry-table";

    const header = document.createElement("tr");
    header.innerHTML = `
      <th>枠番</th><th>階級</th><th>選手名</th>
      <th>平均ST</th>
      <th>当地勝率</th>
      <th>モーター勝率</th>
      <th>コース勝率</th>
    `;
    table.appendChild(header);

    (stadium.entries?.[raceNo] || []).forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.lane}</td>
        <td>${entry.rank}</td>
        <td>${entry.name}</td>
        <td>${entry.st}</td>
        <td>${entry.local_rate}</td>
        <td>${entry.motor_no} (${entry.motor_rate})</td>
        <td>${entry.course_rate}</td>
      `;
      table.appendChild(row);
    });

    view.appendChild(table);

    // AI予想買い目
    const predWrap = document.createElement("div");
    predWrap.className = "comment";
    const preds = stadium.predictions?.[raceNo] || [];
    if (preds.length > 0) {
      predWrap.innerHTML = "<strong>AI予想買い目:</strong><br>" +
        preds.map(p => `${p.combo} (${p.prob}%)`).join("<br>");
    } else {
      predWrap.textContent = "AI予想買い目: データなし";
    }
    view.appendChild(predWrap);

    // AIコメント
    const comWrap = document.createElement("div");
    comWrap.className = "comment";
    const comments = stadium.comments?.[raceNo] || {};
    if (Object.keys(comments).length > 0) {
      let html = "<strong>AIコメント:</strong><table class='entry-table'><tr><th>コース</th><th>コメント</th></tr>";
      for (let lane in comments) {
        html += `<tr><td>${lane}</td><td>${comments[lane]}</td></tr>`;
      }
      html += "</table>";
      comWrap.innerHTML = html;
    } else {
      comWrap.textContent = "AIコメント: データなし";
    }
    view.appendChild(comWrap);
  }

  loadData();
});