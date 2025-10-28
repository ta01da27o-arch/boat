// app.js
document.addEventListener("DOMContentLoaded", () => {
  const VIEW = document.getElementById("view");
  const todayLabel = document.getElementById("todayLabel");

  const SCREEN_VENUES = document.getElementById("screen-venues");
  const SCREEN_RACES = document.getElementById("screen-races");
  const SCREEN_RACE = document.getElementById("screen-race");
  const backBtn = document.getElementById("backBtn");

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  todayLabel.textContent = `${yyyy}/${mm}/${dd}`;

  const venues = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
    "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
    "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
    "下関", "若松", "芦屋", "福岡", "唐津", "大村"
  ];

  // 擬似的に「開催中」「ー」をランダム付与
  function getRandomStatus() {
    const statuses = ["開催中", "ー"];
    return statuses[Math.random() < 0.4 ? 0 : 1]; // 40%が開催中
  }

  // ランダム的中率 (10〜85%)
  function getRandomAccuracy() {
    return Math.floor(Math.random() * 75) + 10 + "%";
  }

  // 初期表示：24場カード
  function renderVenues() {
    SCREEN_VENUES.innerHTML = `
      <div class="venues-grid">
        ${venues.map(v => {
          const status = getRandomStatus();
          const accuracy = getRandomAccuracy();
          const statusClass =
            status === "開催中" ? "v-status active" : "v-status closed";
          const clickable = status === "開催中" ? "clickable" : "disabled";

          return `
            <div class="venue-card ${clickable}" data-venue="${v}">
              <div class="v-name">${v}</div>
              <div class="${statusClass}">${status}</div>
              <div class="v-accuracy">${accuracy}</div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    document.querySelectorAll(".venue-card.clickable").forEach(card => {
      card.addEventListener("click", () => {
        const venue = card.dataset.venue;
        showRaces(venue);
      });
    });
  }

  // レース番号一覧表示
  function showRaces(venue) {
    SCREEN_VENUES.classList.remove("active");
    SCREEN_RACES.classList.add("active");
    backBtn.style.display = "block";

    SCREEN_RACES.innerHTML = `
      <h2 class="h2">${venue}：レース選択</h2>
      <div class="races-grid">
        ${Array.from({ length: 12 }, (_, i) => `
          <div class="race-btn">${i + 1}R</div>
        `).join("")}
      </div>
    `;

    SCREEN_RACES.querySelectorAll(".race-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const raceNum = btn.textContent;
        showRaceDetail(venue, raceNum);
      });
    });
  }

  // 出走表画面
  function showRaceDetail(venue, raceNum) {
    SCREEN_RACES.classList.remove("active");
    SCREEN_RACE.classList.add("active");

    SCREEN_RACE.innerHTML = `
      <h2 class="h2">${venue} ${raceNum} 出走表（例）</h2>
      <table class="table">
        <thead>
          <tr>
            <th>枠</th><th>級</th><th>選手名</th><th>ST平均</th><th>F</th>
            <th>全国勝率</th><th>当地勝率</th><th>モーター勝率</th><th>コース勝率</th>
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: 6 }, (_, i) => `
            <tr class="row-${i + 1}">
              <td>${i + 1}</td>
              <td>A${Math.random() < 0.6 ? 1 : 2}</td>
              <td>選手${i + 1}</td>
              <td>${(Math.random() * 0.25 + 0.1).toFixed(2)}</td>
              <td>${Math.random() < 0.1 ? 1 : 0}</td>
              <td>${(Math.random() * 3 + 5).toFixed(2)}</td>
              <td>${(Math.random() * 3 + 5).toFixed(2)}</td>
              <td>${(Math.random() * 3 + 5).toFixed(2)}</td>
              <td>${(Math.random() * 3 + 5).toFixed(2)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  // 戻るボタン
  backBtn.addEventListener("click", () => {
    if (SCREEN_RACE.classList.contains("active")) {
      SCREEN_RACE.classList.remove("active");
      SCREEN_RACES.classList.add("active");
    } else if (SCREEN_RACES.classList.contains("active")) {
      SCREEN_RACES.classList.remove("active");
      SCREEN_VENUES.classList.add("active");
      backBtn.style.display = "none";
    }
  });

  // 初期化
  SCREEN_VENUES.classList.add("active");
  renderVenues();
});