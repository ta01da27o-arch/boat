const venues = [
  "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
  "蒲郡","常滑","津","三国","びわこ","住之江",
  "尼崎","鳴門","丸亀","児島","宮島","徳山",
  "下関","若松","芦屋","福岡","唐津","大村"
];

let selectedVenue = null;
let selectedDate = new Date().toISOString().split("T")[0];
let raceData = []; // 本来は fetch_data.py で取得

const venuesGrid = document.getElementById("venuesGrid");
const racesGrid = document.getElementById("racesGrid");
const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.getElementById("entryTableBody");
const aiPredictionBody = document.getElementById("aiPredictionBody");
const aiCommentDiv = document.getElementById("aiCommentDiv");
const overallHit = document.getElementById("overallHit");
const dateLabel = document.getElementById("dateLabel");

// 日付セット
dateLabel.textContent = selectedDate;

// 24場カード生成
venues.forEach(v=>{
  const div=document.createElement("div");
  div.className="venue-card";
  div.innerHTML=`<strong>${v}</strong><br>開催中<br>ー%`;
  div.addEventListener("click",()=>showRaces(v));
  venuesGrid.appendChild(div);
});

// レース番号画面
function showRaces(venue){
  selectedVenue=venue;
  screenVenues.classList.add("hidden");
  screenRaces.classList.remove("hidden");
  venueTitle.textContent=`${venue} レース一覧`;
  racesGrid.innerHTML="";
  for(let i=1;i<=12;i++){
    const div=document.createElement("div");
    div.className="race-card";
    div.textContent=`${i}R`;
    div.addEventListener("click",()=>showRaceDetail({race_no:i,entries:dummyEntries()}));
    racesGrid.appendChild(div);
  }
}

// 出走表画面
function showRaceDetail(race){
  screenRaces.classList.add("hidden");
  screenDetail.classList.remove("hidden");
  raceTitle.textContent=`${selectedVenue} ${race.race_no}R 出走表`;

  entryTableBody.innerHTML="";
  race.entries.forEach((e)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${e.lane}</td>
      <td>
        <div>${e.grade}</div>
        <div>${e.name}</div>
        <div>${e.avgStart}</div>
      </td>
      <td>${e.f}</td>
      <td>${formatRate(e.local)}</td>
      <td>${formatRate(e.motor)}</td>
      <td>${formatRate(e.course)}</td>
      <td>${calcEval(e)}</td>`;
    entryTableBody.appendChild(tr);
  });

  // AI予想
  aiPredictionBody.innerHTML="";
  const predictions = generateAIPrediction(race.entries);
  predictions.forEach(p=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${p.main}</td><td>${p.ana}</td><td>${p.rate}%</td>`;
    aiPredictionBody.appendChild(tr);
  });

  // AIコメント
  aiCommentDiv.innerHTML="";
  race.entries.forEach((e)=>{
    const c=document.createElement("div");
    c.className="comment-card";
    c.textContent=generateComment(e);
    aiCommentDiv.appendChild(c);
  });
}

// AI予想ダミー
function generateAIPrediction(entries){
  return [
    {main:"3-1-5", ana:"2-4-1", rate:52},
    {main:"3-1-2", ana:"1-5-4", rate:38}
  ];
}

// AIコメント生成
function generateComment(racer){
  const playerComments = [
    "上積み期待","気配は悪くない","展開待ち",
    "リズム下降気味","波に乗れず"
  ];
  const motorComments = [
    "仕上がり上々","直線は強力","出足がいい",
    "回り足しっかり","重たい","乗りづらい"
  ];
  const pc = playerComments[Math.floor(Math.random()*playerComments.length)];
  const mc = motorComments[Math.floor(Math.random()*motorComments.length)];
  return `${racer.lane}号艇 ${racer.name}：${pc}。モーターは${mc}。`;
}

// 補助
function formatRate(v){ return v? v+"%" : "ー"; }
function calcEval(e){ return "B"; }

// ダミーデータ
function dummyEntries(){
  return [
    {lane:1,grade:"A1",name:"佐藤信一",avgStart:0.19,f:0,local:25,motor:40,course:30},
    {lane:2,grade:"A2",name:"田中一郎",avgStart:0.18,f:0,local:22,motor:35,course:28},
    {lane:3,grade:"B1",name:"鈴木健",avgStart:0.21,f:0,local:18,motor:30,course:25},
    {lane:4,grade:"A1",name:"高橋健太",avgStart:0.17,f:0,local:28,motor:42,course:33},
    {lane:5,grade:"B2",name:"山本剛",avgStart:0.22,f:0,local:15,motor:25,course:20},
    {lane:6,grade:"A2",name:"松本優",avgStart:0.20,f:0,local:20,motor:33,course:27},
  ];
}

// 戻るボタン
document.getElementById("backToVenues").onclick=()=>{
  screenRaces.classList.add("hidden");
  screenVenues.classList.remove("hidden");
};
document.getElementById("backToRaces").onclick=()=>{
  screenDetail.classList.add("hidden");
  screenRaces.classList.remove("hidden");
};