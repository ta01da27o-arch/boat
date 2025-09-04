// script.js
async function loadData() {
  try {
    const res = await fetch("./data.json?cachebust=" + Date.now());
    const data = await res.json();
    renderMain(data);
  } catch (e) {
    console.error("データ取得失敗:", e);
  }
}

function renderMain(data) {
  // 日付
  const todayLabel = document.getElementById("todayLabel");
  todayLabel.textContent = data.date || "--/--/--";

  // 総合AI的中率
  const globalHit = document.getElementById("globalHit");
  globalHit.textContent = (data.ai_accuracy ?? "--") + "%";

  // 競艇場リスト
  const view = document.getElementById("view");
  view.innerHTML = "";

  const table = document.createElement("table");
  table.className = "venue-table";
  const tbody = document.createElement("tbody");

  data.venues.forEach(v => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = v.name;
    tr.appendChild(tdName);

    const tdStatus = document.createElement("td");
    tdStatus.textContent = v.hasRacesToday ? "開催中" : "開催なし";
    tr.appendChild(tdStatus);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  view.appendChild(table);
}

// 更新ボタン
document.getElementById("refreshBtn").addEventListener("click", () => {
  loadData();
});

// 初期ロード
loadData();