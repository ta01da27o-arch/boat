// --- 競艇場一覧（24場固定） ---
const STADIUMS = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

// --- data.json 読み込み ---
async function loadData() {
  try {
    const response = await fetch("data.json?t=" + new Date().getTime()); // キャッシュ回避
    const data = await response.json();
    renderStadiums(data);
  } catch (error) {
    console.error("データ取得エラー:", error);
  }
}

// --- 競艇場ボタン表示 ---
function renderStadiums(data) {
  const stadiumList = document.getElementById("stadium-list");
  stadiumList.innerHTML = "";

  STADIUMS.forEach(stadium => {
    const div = document.createElement("div");
    div.className = "stadium-card";
    div.innerHTML = `<h3>${stadium}</h3>`;

    const btn = document.createElement("button");

    if (data[stadium]) {
      btn.textContent = "レース一覧";
      btn.onclick = () => showRaces(stadium, data[stadium]);
    } else {
      btn.textContent = "－"; // 開催なし
      btn.disabled = true;
    }

    div.appendChild(btn);
    stadiumList.appendChild(div);
  });
}

// --- レース一覧表示 ---
function showRaces(stadium, races) {
  const raceArea = document.getElementById("race-area");
  raceArea.innerHTML = `<h2>${stadium} のレース</h2>`;

  const raceGrid = document.createElement("div");
  raceGrid.className = "race-grid";

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;

    if (races && races[i]) {
      btn.onclick = () => showRaceDetail(stadium, i, races[i]);
    } else {
      btn.disabled = true;
    }

    raceGrid.appendChild(btn);
  }

  raceArea.appendChild(raceGrid);
}

// --- レース詳細表示 ---
function showRaceDetail(stadium, raceNo, detail) {
  const raceArea = document.getElementById("race-area");
  raceArea.innerHTML = `
    <h2>${stadium} ${raceNo}R</h2>
    <p><strong>AI予想:</strong> ${detail.ai || "データなし"}</p>
    <p><strong>平均ST:</strong> ${detail.avgST || "データなし"}</p>
    <p><strong>AIコメント:</strong> ${detail.comment || "データなし"}</p>
  `;
}

// --- ページ読み込み時に実行 ---
loadData();