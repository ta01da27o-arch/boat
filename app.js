// ================================
// app.js 外部データ取得対応版
// ================================

// データ取得
async function loadData() {
  try {
    const response = await fetch("https://your-domain.com/data.json?_=" + Date.now()); 
    // ↑ 公開している data.json のURLに置き換えて下さい
    const data = await response.json();
    renderData(data);
  } catch (error) {
    console.error("データ取得失敗:", error);
    document.getElementById("app").innerHTML = `
      <div class="p-4 text-red-600">
        データを取得できませんでした。<br>
        ネット接続やサーバーURLを確認してください。
      </div>`;
  }
}

// データ描画
function renderData(data) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  // 24場カード (4×6固定表示)
  const grid = document.createElement("div");
  grid.className = "grid grid-cols-4 gap-2 p-2";

  data.jo_list.forEach((jo, index) => {
    const card = document.createElement("div");
    card.className = "border rounded-xl shadow p-4 bg-white hover:bg-blue-100 cursor-pointer";
    card.textContent = jo.name;
    card.onclick = () => showRaces(jo);
    grid.appendChild(card);
  });

  app.appendChild(grid);
}

// レース番号表示 (3×4固定)
function showRaces(jo) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const back = document.createElement("button");
  back.textContent = "← 戻る";
  back.className = "p-2 m-2 bg-gray-300 rounded";
  back.onclick = loadData;
  app.appendChild(back);

  const grid = document.createElement("div");
  grid.className = "grid grid-cols-3 gap-2 p-2";

  jo.races.forEach((race, index) => {
    const btn = document.createElement("div");
    btn.className = "border rounded-lg shadow p-4 bg-white hover:bg-green-100 cursor-pointer text-center";
    btn.textContent = `${race.number}R`;
    btn.onclick = () => showRaceDetail(jo, race);
    grid.appendChild(btn);
  });

  app.appendChild(grid);
}

// 出走表 + AI予想
function showRaceDetail(jo, race) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  const back = document.createElement("button");
  back.textContent = "← 戻る";
  back.className = "p-2 m-2 bg-gray-300 rounded";
  back.onclick = () => showRaces(jo);
  app.appendChild(back);

  const title = document.createElement("h2");
  title.className = "text-xl font-bold p-2";
  title.textContent = `${jo.name} ${race.number}R`;
  app.appendChild(title);

  // 出走表 (6枠固定)
  const table = document.createElement("table");
  table.className = "w-full border-collapse";

  race.entries.forEach((entry, i) => {
    const tr = document.createElement("tr");
    tr.className = "border";

    // 背景色 (枠ごと)
    const colors = ["bg-red-200", "bg-blue-200", "bg-green-200", "bg-yellow-200", "bg-pink-200", "bg-gray-200"];
    tr.classList.add(colors[i % 6]);

    const td1 = document.createElement("td");
    td1.className = "p-2 font-bold";
    td1.textContent = `${i + 1}号艇`;

    const td2 = document.createElement("td");
    td2.className = "p-2";
    td2.textContent = entry.name;

    tr.appendChild(td1);
    tr.appendChild(td2);
    table.appendChild(tr);
  });

  app.appendChild(table);

  // AI予想
  const aiBox = document.createElement("div");
  aiBox.className = "p-4 mt-4 bg-blue-50 rounded shadow";

  aiBox.innerHTML = `
    <h3 class="font-bold">AI予想</h3>
    <p>本命: ${race.ai.honmei}</p>
    <p>穴: ${race.ai.ana}</p>
    <p class="text-sm text-gray-600 mt-2">${race.ai.comment}</p>
  `;

  app.appendChild(aiBox);
}

// 初期化
window.addEventListener("load", loadData);