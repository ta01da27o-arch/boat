// 日付の表示
document.getElementById("date").textContent =
  new Date().toLocaleDateString("ja-JP");

// 総合AI的中率（ダミー値）
document.getElementById("overall-accuracy").textContent =
  "総合AI的中率: 65%";

// 競艇場一覧
const stadiums = [
  "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
  "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
  "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
  "下関", "若松", "芦屋", "福岡", "唐津", "大村"
];

const mainScreen = document.getElementById("main-screen");
const raceScreen = document.getElementById("race-screen");
const detailScreen = document.getElementById("detail-screen");

const stadiumList = document.getElementById("stadium-list");
const raceList = document.getElementById("race-list");
const raceDetail = document.getElementById("race-detail");
const stadiumTitle = document.getElementById("stadium-title");
const raceTitle = document.getElementById("race-title");

// 競艇場ボタン生成
stadiums.forEach(stadium => {
  const btn = document.createElement("button");
  btn.textContent = stadium;
  btn.onclick = () => showRaces(stadium);
  stadiumList.appendChild(btn);
});

// レース番号表示
function showRaces(stadium) {
  mainScreen.classList.add("hidden");
  raceScreen.classList.remove("hidden");
  stadiumTitle.textContent = stadium;

  raceList.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.onclick = () => showRaceDetail(stadium, i);
    raceList.appendChild(btn);
  }
}

// 出走表・予想表示
function showRaceDetail(stadium, raceNo) {
  raceScreen.classList.add("hidden");
  detailScreen.classList.remove("hidden");
  raceTitle.textContent = `${stadium} ${raceNo}R`;

  raceDetail.innerHTML = `
    <h3>出走表</h3>
    <table>
      <tr><th>枠</th><th>階級</th><th>選手名</th><th>平均ST</th><th>モーター</th></tr>
      <tr><td>1</td><td>A1</td><td>山田太郎</td><td>0.14</td><td>12 (2連対率45% / 3連対率65%)</td></tr>
      <tr><td>2</td><td>B1</td><td>佐藤次郎</td><td>0.19</td><td>25 (35% / 55%)</td></tr>
      <tr><td>3</td><td>A2</td><td>鈴木三郎</td><td>0.12</td><td>7 (40% / 60%)</td></tr>
      <tr><td>4</td><td>B2</td><td>田中四郎</td><td>0.21</td><td>30 (25% / 45%)</td></tr>
      <tr><td>5</td><td>A1</td><td>高橋五郎</td><td>0.15</td><td>18 (50% / 70%)</td></tr>
      <tr><td>6</td><td>B1</td><td>松本六郎</td><td>0.20</td><td>9 (30% / 50%)</td></tr>
    </table>

    <h3>AI予想買い目</h3>
    <p>3-1-4 (35%) / 3-1-5 (25%) / 3-4-1 (15%) / 3-4-5 (15%) / 3-5-1 (10%)</p>

    <h3>AIコメント</h3>
    <table>
      <tr><td>1コース</td><td>今節はスタートに不安あり、捲られる傾向。</td></tr>
      <tr><td>2コース</td><td>B1選手で出足不足、壁になりにくい。</td></tr>
      <tr><td>3コース</td><td>スタート決まっており、捲り差し濃厚。</td></tr>
      <tr><td>4コース</td><td>展開次第で連対可能。</td></tr>
      <tr><td>5コース</td><td>差しが届く展開なら上位あり。</td></tr>
      <tr><td>6コース</td><td>展開待ちで3着候補。</td></tr>
    </table>
  `;
}

// 戻る機能
function goBack(to) {
  if (to === "main") {
    raceScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");
  } else if (to === "race") {
    detailScreen.classList.add("hidden");
    raceScreen.classList.remove("hidden");
  }
}