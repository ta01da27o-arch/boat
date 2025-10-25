// /静的/app.js
document.addEventListener("DOMContentLoaded", () => {
  const view = document.getElementById("view");
  const todayLabel = document.getElementById("todayLabel");
  const tabToday = document.getElementById("tabToday");
  const tabPrev = document.getElementById("tabPrev");
  const refreshBtn = document.getElementById("refreshBtn");

  const screenVenues = document.getElementById("screen-venues");
  const screenRaces  = document.getElementById("screen-races");
  const screenRace   = document.getElementById("screen-race");

  let currentDate = new Date();
  let jsonData = {};

  // === 日付表示 ===
  const setDateLabel = () => {
    todayLabel.textContent = currentDate.toLocaleDateString("ja-JP", {
      month: "2-digit",
      day: "2-digit"
    });
  };

  // === 日付タブ切替 ===
  tabToday.addEventListener("click", () => {
    tabToday.classList.add("active");
    tabPrev.classList.remove("active");
    currentDate = new Date();
    setDateLabel();
    loadData();
  });

  tabPrev.addEventListener("click", () => {
    tabPrev.classList.add("active");
    tabToday.classList.remove("active");
    const d = new Date();
    d.setDate(d.getDate() - 1);
    currentDate = d;
    setDateLabel();
    loadData();
  });

  refreshBtn.addEventListener("click", () => {
    loadData(true);
  });

  setDateLabel();

  // === 24場一覧 ===
  const VENUES = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
    "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
    "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
  ];

  // === データ読み込み ===
  async function loadData(forceReload = false) {
    try {
      const res = await fetch("../データ/data.json" + (forceReload ? `?t=${Date.now()}` : ""));
      jsonData = await res.json();
      renderVenues();
    } catch (e) {
      console.error("データ読み込みエラー:", e);
    }
  }

  // === 開催中／非開催の制御 ===
  function isActive(status) {
    return status === "開催中";
  }

  // === 24場表示 ===
  function renderVenues() {
    view.innerHTML = "";
    screenVenues.classList.add("active");
    screenRaces.classList.remove("active");
    screenRace.classList.remove("active");

    const grid = document.createElement("div");
    grid.className = "venues-grid";

    VENUES.forEach(vname => {
      const data = jsonData[vname];
      const card = document.createElement("div");
      card.className = "venue-card";

      if (!data) {
        // データなし → 非開催扱い
        card.innerHTML = `
          <div class="v-name">${vname}</div>
          <div class="v-status">ー</div>
          <div class="v-hit">的中率: -%</div>
        `;
        card.classList.add("disabled");
      } else {
        const status = data.status || "ー";
        const hit = data.hit_rate ?? "-";
        const active = isActive(status);

        card.innerHTML = `
          <div class="v-name">${vname}</div>
          <div class="v-status">${active ? "開催中" : "ー"}</div>
          <div class="v-hit">的中率: ${hit}%</div>
        `;

        if (active) {
          card.classList.add("clickable");
          card.addEventListener("click", () => renderRaces(vname));
        } else {
          card.classList.add("disabled");
        }
      }
      grid.appendChild(card);
    });

    view.appendChild(grid);
  }

  // === レース番号選択画面 ===
  function renderRaces(vname) {
    screenVenues.classList.remove("active");
    screenRaces.classList.add("active");
    screenRace.classList.remove("active");
    view.innerHTML = "";

    const back = document.createElement("button");
    back.textContent = "戻る";
    back.className = "btn back";
    back.onclick = () => renderVenues();
    view.appendChild(back);

    const title = document.createElement("h2");
    title.textContent = `${vname}：レース選択`;
    view.appendChild(title);

    const races = jsonData[vname]?.races || {};
    const grid = document.createElement("div");
    grid.className = "races-grid";

    if (Object.keys(races).length === 0) {
      const msg = document.createElement("p");
      msg.textContent = "出走データがありません。";
      msg.style.textAlign = "center";
      msg.style.padding = "10px";
      view.appendChild(msg);
    } else {
      Object.keys(races).forEach(num => {
        const btn = document.createElement("div");
        btn.className = "race-btn";
        btn.textContent = `${num}R`;
        btn.onclick = () => renderRace(vname, num);
        grid.appendChild(btn);
      });
      view.appendChild(grid);
    }
  }

  // === 出走表 ===
  function renderRace(vname, rnum) {
    screenVenues.classList.remove("active");
    screenRaces.classList.remove("active");
    screenRace.classList.add("active");
    view.innerHTML = "";

    const back = document.createElement("button");
    back.textContent = "戻る";
    back.className = "btn back";
    back.onclick = () => renderRaces(vname);
    view.appendChild(back);

    const title = document.createElement("h2");
    title.textContent = `${vname} 第${rnum}R 出走表`;
    view.appendChild(title);

    const entries = jsonData[vname]?.races?.[rnum] || [];

    // データが空でも表構造を維持
    const table = document.createElement("table");
    table.className = "table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>艇</th>
          <th>選手名</th>
          <th>級</th>
          <th>ST</th>
          <th>F</th>
          <th>全国</th>
          <th>当地</th>
          <th>モーター</th>
          <th>評価</th>
        </tr>
      </thead>
    `;
    const tbody = document.createElement("tbody");

    if (entries.length === 0) {
      for (let i = 0; i < 6; i++) {
        const tr = document.createElement("tr");
        tr.className = `row-${i + 1}`;
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>-</td><td>-</td><td>-</td><td>-</td>
          <td>-</td><td>-</td><td>-</td><td>-</td>
        `;
        tbody.appendChild(tr);
      }
    } else {
      entries.forEach((e, i) => {
        const tr = document.createElement("tr");
        tr.className = `row-${i + 1}`;
        tr.innerHTML = `
          <td>${e.number}</td>
          <td>${e.name}</td>
          <td>${e.grade}</td>
          <td>${e.st}</td>
          <td>${e.f}</td>
          <td>${e.all}</td>
          <td>${e.local}</td>
          <td>${e.mt}</td>
          <td>${e.eval}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    table.appendChild(tbody);
    view.appendChild(table);
  }

  // 初期ロード
  loadData();
});