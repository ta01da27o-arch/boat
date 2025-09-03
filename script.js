document.addEventListener("DOMContentLoaded", () => {
  // 今日の日付を表示
  const today = new Date();
  document.getElementById("today-date").textContent =
    `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日`;

  // 24競艇場リスト
  const stadiums = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
    "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
    "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
    "下関", "若松", "芦屋", "福岡", "唐津", "大村"
  ];

  const stadiumList = document.getElementById("stadium-list");

  // 各競艇場ボタンを追加（全24場固定）
  stadiums.forEach(name => {
    const div = document.createElement("div");
    div.className = "stadium-card";
    const btn = document.createElement("button");
    btn.textContent = name;

    // 仮：全ボタン押せるように（本日開催チェックは後でdata.json連携）
    btn.disabled = false;

    btn.addEventListener("click", () => showRaces(name));
    div.appendChild(btn);
    stadiumList.appendChild(div);
  });
});

// レース番号表示
function showRaces(stadiumName) {
  document.getElementById("stadium-screen").style.display = "none";
  document.getElementById("race-screen").style.display = "block";
  document.getElementById("race-title").textContent = `${stadiumName} レース一覧`;

  const raceList = document.getElementById("race-list");
  raceList.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.addEventListener("click", () => showEntries(stadiumName, i));
    raceList.appendChild(btn);
  }
}

// 出走表表示
function showEntries(stadiumName, raceNo) {
  document.getElementById("race-screen").style.display = "none";
  document.getElementById("entry-screen").style.display = "block";
  document.getElementById("entry-title").textContent = `${stadiumName} ${raceNo}R 出走表`;

  // 出走表サンプルデータ
  const sampleData = [
    { waku:1, rank:"A1", name:"山田太郎", st:"0.15", motor:"12", rate2:"35%", rate3:"50%" },
    { waku:2, rank:"B2", name:"佐藤次郎", st:"0.20", motor:"34", rate2:"20%", rate3:"30%" },
    { waku:3, rank:"A2", name:"鈴木三郎", st:"0.12", motor:"56", rate2:"40%", rate3:"55%" },
    { waku:4, rank:"B1", name:"高橋四郎", st:"0.18", motor:"78", rate2:"25%", rate3:"40%" },
    { waku:5, rank:"A1", name:"田中五郎", st:"0.14", motor:"22", rate2:"50%", rate3:"65%" },
    { waku:6, rank:"B1", name:"中村六郎", st:"0.22", motor:"44", rate2:"15%", rate3:"25%" }
  ];

  let html = "<table><tr><th>枠番</th><th>階級</th><th>選手名</th><th>平均ST</th><th>モーター</th></tr>";
  sampleData.forEach(d => {
    html += `<tr>
      <td>${d.waku}</td>
      <td>${d.rank}</td>
      <td>${d.name}</td>
      <td>${d.st}</td>
      <td>
        No.${d.motor}<br>
        <small>2連: ${d.rate2}</small><br>
        <small>3連: ${d.rate3}</small>
      </td>
    </tr>`;
  });
  html += "</table>";
  document.getElementById("entry-table").innerHTML = html;

  // AI予想サンプル
  document.getElementById("ai-prediction").innerHTML =
    "<h3>AI予想買い目</h3><p>3-1-4　3-1-5　3-4-1　3-4-5　3-5-1</p>";

  // AIコメントサンプル
  document.getElementById("ai-comment").innerHTML =
    "<h3>AIコメント</h3><p>今節は、3号艇の舟足とスタートが良く、2号艇(B2)はスタート不安。3号艇の捲り差し濃厚。4、5号艇が連動し、1号艇も連対率高い。</p>";
}

// 戻るボタン制御
function goBackToStadiums() {
  document.getElementById("race-screen").style.display = "none";
  document.getElementById("stadium-screen").style.display = "block";
}
function goBackToRaces() {
  document.getElementById("entry-screen").style.display = "none";
  document.getElementById("race-screen").style.display = "block";
}