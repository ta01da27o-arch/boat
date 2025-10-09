// ===============================
// 競艇AI予想アプリ - 自然言語強化版
// ===============================

const VIEW = document.getElementById('view');
const todayLabel = document.getElementById('todayLabel');
const refreshBtn = document.getElementById('refreshBtn');

let raceData = {};
let currentScreen = "venues"; // "venues" / "races" / "race"
let selectedVenue = null;
let selectedRace = null;

// 日付ラベル設定
const today = new Date();
todayLabel.textContent = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;

// 5分ごとにデータ自動更新
setInterval(fetchData, 5 * 60 * 1000);

refreshBtn.addEventListener("click", fetchData);

// ===============================
// データ取得
// ===============================
async function fetchData() {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("データ取得失敗");
    raceData = await response.json();
    renderVenues();
  } catch (e) {
    console.error("データ取得エラー:", e);
  }
}

// ===============================
// メイン画面（24場表示）
// ===============================
function renderVenues() {
  currentScreen = "venues";
  VIEW.innerHTML = "";

  const container = document.createElement("div");
  container.className = "venues-grid";

  const venues = Object.keys(raceData);
  venues.forEach(venue => {
    const info = raceData[venue];
    const card = document.createElement("div");
    card.className = "venue-card";

    const title = document.createElement("div");
    title.className = "venue-title";
    title.textContent = venue;

    const status = document.createElement("div");
    status.className = "venue-status";
    status.textContent = info.status === "開催中" ? "開催中" : "ー";

    const hitRate = document.createElement("div");
    hitRate.className = "venue-hit";
    hitRate.textContent = `的中率 ${info.hit_rate ?? 0}%`;

    card.appendChild(title);
    card.appendChild(status);
    card.appendChild(hitRate);

    card.addEventListener("click", () => {
      selectedVenue = venue;
      renderRaces(venue);
    });

    container.appendChild(card);
  });

  VIEW.appendChild(container);
}

// ===============================
// レース番号画面
// ===============================
function renderRaces(venue) {
  currentScreen = "races";
  VIEW.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = `${venue} のレース一覧`;
  VIEW.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "races-grid";

  const races = Object.keys(raceData[venue].races);
  races.forEach(num => {
    const btn = document.createElement("button");
    btn.className = "race-btn";
    btn.textContent = `${num}R`;
    btn.addEventListener("click", () => {
      selectedRace = num;
      renderRaceDetail(venue, num);
    });
    grid.appendChild(btn);
  });

  VIEW.appendChild(grid);
}

// ===============================
// 出走表 + 展開予想コメント（自然言語強化）
// ===============================
function renderRaceDetail(venue, raceNo) {
  currentScreen = "race";
  VIEW.innerHTML = "";

  const race = raceData[venue].races[raceNo];

  const backBtn = document.createElement("button");
  backBtn.textContent = "← 戻る";
  backBtn.className = "back-btn";
  backBtn.addEventListener("click", () => renderRaces(venue));
  VIEW.appendChild(backBtn);

  const title = document.createElement("h2");
  title.textContent = `${venue} ${raceNo}R 出走表`;
  VIEW.appendChild(title);

  const table = document.createElement("div");
  table.className = "race-table";

  race.entry.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = `race-row lane-${p.lane}`;

    const info = `
      <div class="player-info">
        <div class="grade">${p.grade ?? ""}</div>
        <div class="name">${p.name ?? "未登録"}</div>
        <div class="st">ST:${p.st ?? "-"}</div>
      </div>
      <div class="rate">全国:${p.rate_national ?? "-"}%</div>
      <div class="rate">当地:${p.rate_local ?? "-"}%</div>
      <div class="rate">モーター:${p.rate_motor ?? "-"}%</div>
      <div class="rate">コース:${p.rate_course ?? "-"}%</div>
      <div class="f-count">${p.f_count > 0 ? "F" + p.f_count : "ー"}</div>
      <div class="eval">${p.eval ?? "◎"}</div>
    `;
    row.innerHTML = info;
    table.appendChild(row);
  });

  VIEW.appendChild(table);

  // 展開予想コメント欄
  const commentTitle = document.createElement("h3");
  commentTitle.textContent = "展開予想コメント（AI分析）";
  VIEW.appendChild(commentTitle);

  const commentBox = document.createElement("div");
  commentBox.className = "comment-box";
  commentBox.innerHTML = generateAIComments(race.entry);
  VIEW.appendChild(commentBox);
}

// ===============================
// AIコメント生成（自然言語強化版）
// ===============================
function generateAIComments(entryList) {
  const comments = entryList.map(p => {
    const st = parseFloat(p.st) || 0.20;
    const rate = parseFloat(p.rate_national) || 0;
    const evalMark = p.eval ?? "◎";
    const name = p.name ?? "選手";

    // 評価に応じてトーンを変化
    if (rate >= 35) {
      const patterns = [
        `${name}は今節かなり仕上がり良く、スタートも鋭い。ターンの押し足も光り、展開次第では独走も期待できる。`,
        `${name}は序盤から出足・伸び足ともに上々。特に行き足の良さが際立っており、ここは主導権を握る展開になりそう。`,
        `${name}のモーター気配は上々。前半の勢いそのままに、今日も好レースが期待される。`
      ];
      return `<p class="good">${patterns[Math.floor(Math.random() * patterns.length)]}</p>`;
    } else if (rate >= 25) {
      const patterns = [
        `${name}は徐々にリズムを掴みつつある印象。展開さえハマれば上位争いに加われる。`,
        `前走で見せた旋回力が好印象。${name}は中位以上を狙えるポテンシャルを感じる。`,
        `スタートのタイミングは安定。道中の展開次第で連対も視野に。`
      ];
      return `<p class="normal">${patterns[Math.floor(Math.random() * patterns.length)]}</p>`;
    } else {
      const patterns = [
        `${name}は機力的にもう一歩。伸び足で見劣りしており、ここは厳しい展開になりそう。`,
        `${name}はここ数走で波に乗れず、リズムを欠いている。立て直しが急務の一戦。`,
        `調整が合っていない様子。流れを掴めなければ後方追走に終わる可能性も。`
      ];
      return `<p class="bad">${patterns[Math.floor(Math.random() * patterns.length)]}</p>`;
    }
  });

  return comments.join("");
}

// ===============================
// 初期ロード
// ===============================
fetchData();