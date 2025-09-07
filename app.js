// 固定24場データ（4列×6行）
const venues = [
  { id: 1, name: "桐生", rate: 75, status: "開催中" },
  { id: 2, name: "戸田", rate: 62, status: "開催中" },
  { id: 3, name: "江戸川", rate: 48, status: "終了" },
  { id: 4, name: "平和島", rate: 55, status: "開催中" },
  { id: 5, name: "多摩川", rate: 50, status: "終了" },
  { id: 6, name: "浜名湖", rate: 65, status: "開催中" },
  { id: 7, name: "蒲郡", rate: 72, status: "開催中" },
  { id: 8, name: "常滑", rate: 58, status: "終了" },
  { id: 9, name: "津", rate: 63, status: "開催中" },
  { id:10, name: "三国", rate: 60, status: "終了" },
  { id:11, name: "びわこ", rate: 70, status: "開催中" },
  { id:12, name: "住之江", rate: 66, status: "開催中" },
  { id:13, name: "尼崎", rate: 52, status: "終了" },
  { id:14, name: "鳴門", rate: 64, status: "開催中" },
  { id:15, name: "丸亀", rate: 59, status: "終了" },
  { id:16, name: "児島", rate: 68, status: "開催中" },
  { id:17, name: "宮島", rate: 57, status: "終了" },
  { id:18, name: "徳山", rate: 61, status: "開催中" },
  { id:19, name: "下関", rate: 53, status: "終了" },
  { id:20, name: "若松", rate: 67, status: "開催中" },
  { id:21, name: "芦屋", rate: 54, status: "終了" },
  { id:22, name: "福岡", rate: 69, status: "開催中" },
  { id:23, name: "唐津", rate: 56, status: "終了" },
  { id:24, name: "大村", rate: 65, status: "開催中" }
];

// 初期表示
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("date").innerText = new Date().toLocaleDateString();
  renderVenues();
});

function renderVenues() {
  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";

  venues.forEach(venue => {
    const card = document.createElement("div");
    card.className = "venue-card";

    if(venue.status === "開催中"){
      card.addEventListener("click", () => openRaces(venue));
    }

    card.innerHTML = `
      <div class="venue-name">${venue.name}</div>
      <div class="venue-rate">${venue.rate}%</div>
      <div class="venue-status">${venue.status}</div>
    `;
    grid.appendChild(card);
  });
}

// レース画面
function openRaces(venue){
  document.getElementById("mainScreen").style.display = "none";
  document.getElementById("raceScreen").style.display = "block";
  document.getElementById("raceTitle").innerText = `${venue.name} レース一覧`;

  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";
  for(let i=1;i<=12;i++){
    const btn = document.createElement("div");
    btn.className="venue-card";
    btn.innerText = `${i}R`;
    btn.addEventListener("click", ()=> openEntry(venue,i));
    grid.appendChild(btn);
  }
}

function goBackMain(){
  document.getElementById("raceScreen").style.display = "none";
  document.getElementById("mainScreen").style.display = "block";
}

function goBackRace(){
  document.getElementById("entryScreen").style.display = "none";
  document.getElementById("raceScreen").style.display = "block";
}

// 出走表表示サンプル
function openEntry(venue, raceNo){
  document.getElementById("raceScreen").style.display = "none";
  document.getElementById("entryScreen").style.display = "block";
  document.getElementById("entryTitle").innerText = `${venue.name} ${raceNo}R 出走表`;

  // サンプルデータ埋め込み（後で JSON 取得可）
  const entries = [
    {waku:1, class:"A1", name:"佐藤太郎", st:0.12, f:"", local:50, motor:45, course:60},
    {waku:2, class:"A2", name:"鈴木次郎", st:0.15, f:"F1", local:48, motor:42, course:55},
    {waku:3, class:"B1", name:"田中三郎", st:0.13, f:"", local:46, motor:44, course:50},
    {waku:4, class:"A1", name:"山本四郎", st:0.11, f:"", local:52, motor:47, course:62},
    {waku:5, class:"B2", name:"中村五郎", st:0.16, f:"", local:45, motor:40, course:53},
    {waku:6, class:"A2", name:"小林六郎", st:0.14, f:"", local:49, motor:43, course:56},
  ];

  const tableDiv = document.getElementById("entryTable");
  tableDiv.innerHTML = "<table><tr><th>枠</th><th>階級</th><th>選手名</th><th>ST</th><th>F</th><th>当地%</th><th>モーター%</th><th>コース%</th></tr>";
  entries.forEach(e=>{
    tableDiv.innerHTML += `<tr>
      <td>${e.waku}</td>
      <td>${e.class}</td>
      <td>${e.name}</td>
      <td>${e.st}</td>
      <td>${e.f}</td>
      <td>${e.local}</td>
      <td>${e.motor}</td>
      <td>${e.course}</td>
    </tr>`;
  });
  tableDiv.innerHTML += "</table>";
}