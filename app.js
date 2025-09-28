// app.js

// --- ユーティリティ関数 ---

// 順位に応じた記号（◎だけ赤にする）
function getMarkByRank(rank) {
  switch (rank) {
    case 1: return "<span class='mark mark-top'>◎</span>";
    case 2: return "○";
    case 3: return "△";
    case 4: return "✕";
    case 5:
    case 6: return "ー";
    default: return "ー";
  }
}

// 評価スコアの算出
function calcEvaluationScore(racer) {
  const local = parseFloat(racer.localWinRate) || 0;   // 当地勝率
  const motor = parseFloat(racer.motorWinRate) || 0;   // モーター勝率
  const course = parseFloat(racer.courseWinRate) || 0; // コース勝率
  return local + motor + course;
}

// コースごとの背景色を返す
function getCourseColor(course) {
  switch (course) {
    case 1: return "#ffffff"; // 白
    case 2: return "#e0e0e0"; // 薄いグレー
    case 3: return "#ffcccc"; // 薄い赤
    case 4: return "#cce5ff"; // 薄い青
    case 5: return "#fff9c4"; // 薄い黄
    case 6: return "#ccffcc"; // 薄い緑
    default: return "#ffffff";
  }
}

// --- レースデータの表示 ---

// 出走表の描画
function renderRaceDetail(race) {
  const tbody = document.querySelector("#raceDetailTable tbody");
  tbody.innerHTML = "";

  // スコア付与
  let racers = race.racers.map(r => {
    return { ...r, score: calcEvaluationScore(r) };
  });

  // スコアで順位付け
  let sorted = [...racers].sort((a, b) => b.score - a.score);

  // 順位ごとに印を割り当て
  sorted.forEach((r, idx) => {
    r.mark = getMarkByRank(idx + 1);
  });

  // コース順に戻して描画
  racers.forEach(r => {
    const sortedR = sorted.find(s => s.name === r.name);
    const tr = document.createElement("tr");
    tr.style.backgroundColor = getCourseColor(r.course);

    tr.innerHTML = `
      <td>${r.course}</td>
      <td>${r.name} <span class="class">(${r.class || "-"})</span></td>
      <td>${r.localWinRate}%</td>
      <td>${r.motorWinRate}%</td>
      <td>${r.courseWinRate}%</td>
      <td>${sortedR.mark}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- 的中率表示 ---
function calcHitRateText(hit, total) {
  if (total === 0) return "0%";
  return ((hit / total) * 100).toFixed(1) + "%";
}

// --- 初期処理 ---
async function init() {
  try {
    const res = await fetch("data.json?" + Date.now()); // キャッシュ回避
    const data = await res.json();

    // レースリストの生成
    const raceList = document.querySelector("#raceList");
    raceList.innerHTML = "";

    data.races.forEach(race => {
      const li = document.createElement("li");
      li.textContent = `${race.venue} ${race.raceNo}R`;
      li.addEventListener("click", () => renderRaceDetail(race));
      raceList.appendChild(li);
    });
  } catch (e) {
    console.error("データ読み込みエラー:", e);
  }
}

// ページ読み込み時に初期化
window.addEventListener("DOMContentLoaded", init);