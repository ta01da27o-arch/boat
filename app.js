// 24場名
const venueNames = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

// HTML要素
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const venueList = document.getElementById("venueList");
const raceList = document.getElementById("raceList");
const entryTableBody = document.getElementById("entryTableBody");
const aiPredictionBody = document.getElementById("aiPredictionBody");
const aiCommentBody = document.getElementById("aiCommentBody");

const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");

const todayLabel = document.getElementById("todayLabel");
const overallHit = document.getElementById("overallHit");

// 日付表示
const today = new Date();
todayLabel.textContent = today.toISOString().split("T")[0];

// 24場カード生成
function renderVenues() {
  venueList.innerHTML = "";
  venueNames.forEach((name, i) => {
    const div = document.createElement("div");
    div.className = "venue-card";
    div.innerHTML = `
      <div>${name}</div>
      <div>開催中</div>
      <div>ー%</div>
    `;
    div.onclick = () => showRaces(name);
    venueList.appendChild(div);
  });
}

// レース番号表示
function showRaces(venue) {
  screenVenues.classList.add("hidden");
  screenRaces.classList.remove("hidden");
  venueTitle.textContent = `${venue}`;
  raceList.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    const div = document.createElement("div");
    div.className = "race-card";
    div.textContent = `${i}R`;
    div.onclick = () => showRaceDetail(venue, i);
    raceList.appendChild(div);
  }
}

// 出走表表示（サンプル）
function showRaceDetail(venue, raceNo) {
  screenRaces.classList.add("hidden");
  screenDetail.classList.remove("hidden");
  raceTitle.textContent = `${venue} ${raceNo}R 出走表`;

  // 出走表
  entryTableBody.innerHTML = "";
  const classes = ["A1","A2","B1","B2"];
  for (let i = 1; i <= 6; i++) {
    const tr = document.createElement("tr");
    const rank = classes[Math.floor(Math.random()*classes.length)];
    const st = (Math.random()*0.3+0.1).toFixed(2);
    tr.innerHTML = `
      <td>${i}</td>
      <td><div>${rank}</div><div>選手${i}</div><div>${st}</div></td>
      <td>-</td>
      <td>${(Math.random()*7).toFixed(2)}</td>
      <td>${(Math.random()*7).toFixed(2)}</td>
      <td>${(Math.random()*7).toFixed(2)}</td>
      <td>A</td>
    `;
    entryTableBody.appendChild(tr);
  }

  // AI予想（サンプル）
  aiPredictionBody.innerHTML = "";
  const buys = ["1-2-3","1-3-2","3-1-2","2-1-4","1-4-5"];
  buys.forEach(b=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${b}</td><td>${Math.floor(Math.random()*40+30)}%</td>`;
    aiPredictionBody.appendChild(tr);
  });

  // AIコメント
  aiCommentBody.innerHTML = "";
  for (let i=1;i<=6;i++) {
    const tr=document.createElement("tr");
    const comment=`選手${i}：スタート鋭く展開有利。伸び脚も上向きで注目。`;
    tr.innerHTML=`<td>${comment}</td>`;
    aiCommentBody.appendChild(tr);
  }
}

// 戻るボタン
document.getElementById("backToVenues").onclick = () => {
  screenRaces.classList.add("hidden");
  screenVenues.classList.remove("hidden");
};
document.getElementById("backToRaces").onclick = () => {
  screenDetail.classList.add("hidden");
  screenRaces.classList.remove("hidden");
};

// 初期化
renderVenues();