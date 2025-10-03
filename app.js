// GitHub CSVのURLを指定（各自のリポジトリに置き換えてください）
const CSV_URL = "https://raw.githubusercontent.com/ユーザー名/リポジトリ名/main/race_data.csv";

let allData = [];

// CSVを読み込む
async function loadCSV() {
  try {
    const res = await fetch(CSV_URL);
    const text = await res.text();

    // CSVをパース
    const rows = text.trim().split("\n").map(r => r.split(","));
    const headers = rows.shift();

    allData = rows.map(r => {
      let obj = {};
      headers.forEach((h, i) => {
        obj[h] = r[i];
      });
      return obj;
    });

    populateControls();
  } catch (err) {
    console.error("CSV読み込みエラー:", err);
  }
}

// コントロール用のセレクトを埋める
function populateControls() {
  const dateSelect = document.getElementById("dateSelect");
  const stadiumSelect = document.getElementById("stadiumSelect");
  const raceSelect = document.getElementById("raceSelect");

  // ユニーク値抽出
  const dates = [...new Set(allData.map(d => d.race_date))];
  const stadiums = [...new Set(allData.map(d => d.race_stadium_number))];
  const races = [...new Set(allData.map(d => d.race_number))];

  // セレクトに追加
  dates.forEach(v => {
    let opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    dateSelect.appendChild(opt);
  });

  stadiums.forEach(v => {
    let opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    stadiumSelect.appendChild(opt);
  });

  races.forEach(v => {
    let opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    raceSelect.appendChild(opt);
  });

  // イベント登録
  dateSelect.addEventListener("change", updateTable);
  stadiumSelect.addEventListener("change", updateTable);
  raceSelect.addEventListener("change", updateTable);

  // 初期表示
  updateTable();
}

// 表を更新
function updateTable() {
  const date = document.getElementById("dateSelect").value;
  const stadium = document.getElementById("stadiumSelect").value;
  const race = document.getElementById("raceSelect").value;

  const tbody = document.querySelector("#raceTable tbody");
  tbody.innerHTML = "";

  const filtered = allData.filter(d =>
    (!date || d.race_date === date) &&
    (!stadium || d.race_stadium_number === stadium) &&
    (!race || d.race_number === race)
  );

  // レースタイトル更新
  document.getElementById("raceTitle").textContent =
    `${date} - 場:${stadium} - ${race}R`;

  // 表に行を追加
  filtered.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.racer_boat_number}</td>
      <td>${row.racer_number}</td>
      <td>${row.racer_name}</td>
      <td>${row.predicted_place}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 実行
loadCSV();