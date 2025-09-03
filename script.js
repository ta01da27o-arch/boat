// --- 競艇場一覧（24場固定） ---
const STADIUMS = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

// --- 今日の日付を表示 ---
document.getElementById("today-date").textContent = new Date().toLocaleDateString("ja-JP", {
  year: "numeric", month: "long", day: "numeric", weekday: "short"
});

// --- データ読み込み ---
async function loadData() {
  try {
    const res = await fetch("data.json?t=" + new Date().getTime());
    const data = await res.json();
    renderStadiums(data);
  } catch (err) {
    console.error("データ読み込みエラー:", err);
  }
}

// --- 競艇場一覧 ---
function renderStadiums(data) {
  const stadiumList = document.getElementById("stadium-list");
  stadiumList.innerHTML = "";

  STADIUMS.forEach(stadium => {
    const div = document.createElement("div");
    div.className = "stadium-card";
    div.textContent = stadium;

    if (data[stadium]) {
      div.onclick = () => showRaces(stadium, data[stadium]);
    } else {
      div.style.opacity = "0.5"; // 開催なしは半透明
      div.style.cursor = "not-allowed";
    }

    stadiumList.appendChild(div);
  });
}

// --- レース番号表示 ---
function showRaces(stadium, races) {
  document.getElementById("stadium-list").classList.add("hidden");
  const raceArea = document.getElementById("race-area");
  raceArea.classList.remove("hidden");
  raceArea.innerHTML = "";

  const header = document.createElement("div");
  header.className = "race-header";
  header.innerHTML = `<h2>${stadium} レース一覧</h2>`;
  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "戻る";
  backBtn.onclick = () => {
    raceArea.classList.add("hidden");
    document.getElementById("stadium-list").classList.remove("hidden");
  };
  header.appendChild(backBtn);
  raceArea.appendChild(header);

  const raceGrid = document.createElement("div");
  raceGrid.className = "race-grid";

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;

    if (races[i]) {
      btn.onclick = () => showRaceDetail(stadium, i, races[i]);
    } else {
      btn.disabled = true;
    }

    raceGrid.appendChild(btn);
  }

  raceArea.appendChild(raceGrid);
}

// --- 出走表表示 ---
function showRaceDetail(stadium, raceNo, detail) {
  document.getElementById("race-area").classList.add("hidden");
  const detailArea = document.getElementById("detail-area");
  detailArea.classList.remove("hidden");
  detailArea.innerHTML = "";

  const header = document.createElement("div");
  header.className = "race-header";
  header.innerHTML = `<h2>${stadium} ${raceNo}R 出走表</h2>`;
  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.textContent = "戻る";
  backBtn.onclick = () => {
    detailArea.classList.add("hidden");
    document.getElementById("race-area").classList.remove("hidden");
  };
  header.appendChild(backBtn);
  detailArea.appendChild(header);

  const box = document.createElement("div");
  box.className = "detail-box";
  box.innerHTML = `
    <p><strong>AI予想:</strong> ${detail.ai || "－"}</p>
    <p><strong>平均ST:</strong> ${detail.avgST || "－"}</p>
    <p><strong>コメント:</strong> ${detail.comment || "－"}</p>
  `;
  detailArea.appendChild(box);
}

// --- 初期表示 ---
loadData();