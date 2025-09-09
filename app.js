document.addEventListener("DOMContentLoaded", () => {
  const venuesScreen = document.getElementById("venues-screen");
  const racesScreen = document.getElementById("races-screen");
  const entriesScreen = document.getElementById("entries-screen");
  const venuesGrid = document.getElementById("venues-grid");
  const racesGrid = document.getElementById("races-grid");
  const entriesContainer = document.getElementById("entries-container");
  const aiSection = document.getElementById("ai-section");
  const venueTitle = document.getElementById("venue-title");
  const raceTitle = document.getElementById("race-title");
  const dateBar = document.getElementById("date-bar");

  // 日付表示
  const today = new Date();
  dateBar.textContent = today.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  // サンプルデータ読み込み
  fetch("data.json").then(res => res.json()).then(data => {
    renderVenues(data.venues);
  });

  function renderVenues(venues) {
    venuesGrid.innerHTML = "";
    venues.forEach(v => {
      const card = document.createElement("div");
      card.className = "venue-card";
      if (v.status === "開催中") {
        card.classList.add("clickable");
        card.addEventListener("click", () => showRaces(v));
      } else {
        card.classList.add("disabled");
      }
      card.innerHTML = `
        <div class="v-name">${v.name}</div>
        <div class="v-status">${v.status}</div>
        <div class="v-rate">${v.rate}%</div>
      `;
      venuesGrid.appendChild(card);
    });
  }

  function showRaces(venue) {
    venuesScreen.classList.remove("active");
    racesScreen.classList.add("active");
    venueTitle.textContent = venue.name;
    racesGrid.innerHTML = "";
    for (let i = 1; i <= 12; i++) {
      const btn = document.createElement("div");
      btn.className = "race-btn";
      btn.textContent = i + "R";
      btn.addEventListener("click", () => showEntries(venue, i));
      racesGrid.appendChild(btn);
    }
  }

  function showEntries(venue, raceNo) {
    racesScreen.classList.remove("active");
    entriesScreen.classList.add("active");
    raceTitle.textContent = `${venue.name} ${raceNo}R`;

    // 出走表サンプル
    entriesContainer.innerHTML = `
      <table class="table">
        <tr><th>コース</th><th>選手</th><th>当地勝率</th><th>モーター勝率</th><th>コース勝率</th><th>評価</th></tr>
        ${[1,2,3,4,5,6].map(i => `
          <tr class="row-${i}">
            <td>${i}</td>
            <td class="entry-left">
              <div class="klass">A1</div>
              <div class="name">選手${i}</div>
              <div class="st">ST.14</div>
            </td>
            <td><span class="metric-symbol ${i===1?"top":""}">${["◎","○","△","✕","ー","ー"][i-1]}</span><div class="metric-small">57%<br>78%</div></td>
            <td><span class="metric-symbol">${["◎","○","△","✕","ー","ー"][i-1]}</span><div class="metric-small">50%<br>65%</div></td>
            <td><span class="metric-symbol">${["◎","○","△","✕","ー","ー"][i-1]}</span><div class="metric-small">48%<br>60%</div></td>
            <td><span class="eval-mark ${i===1?"top":""}">${["◎","○","△","✕","ー","ー"][i-1]}</span></td>
          </tr>
        `).join("")}
      </table>
    `;

    // AI予想 + コメント
    aiSection.innerHTML = `
      <div class="ai-block">
        <div class="ai-col">
          <div class="h3">本命予想</div>
          <div>3-1-5 52%</div>
          <div>3-1-4 35%</div>
          <div>3-4-1 30%</div>
          <div>1-3-5 22%</div>
          <div>1-3-4 10%</div>
        </div>
        <div class="ai-col">
          <div class="h3">穴予想</div>
          <div>2-5-6 18%</div>
          <div>6-1-4 15%</div>
          <div>5-3-2 12%</div>
          <div>4-6-1 10%</div>
          <div>2-4-5 8%</div>
        </div>
      </div>
      <h3 class="h3">AIコメント</h3>
      <table class="ai-comments-table">
        <tr><th>枠</th><th>コメント</th></tr>
        <tr><td>1</td><td>イン有利、スタート安定</td></tr>
        <tr><td>2</td><td>スタート遅め、展開待ち</td></tr>
        <tr><td>3</td><td>捲り期待、攻め足有り</td></tr>
        <tr><td>4</td><td>差し主体、展開次第</td></tr>
        <tr><td>5</td><td>自在に立ち回り、波乱要因</td></tr>
        <tr><td>6</td><td>展開不利、展開次第</td></tr>
      </table>
    `;
  }

  // 戻るボタン
  document.getElementById("back-to-venues").addEventListener("click", () => {
    racesScreen.classList.remove("active");
    venuesScreen.classList.add("active");
  });
  document.getElementById("back-to-races").addEventListener("click", () => {
    entriesScreen.classList.remove("active");
    racesScreen.classList.add("active");
  });
});