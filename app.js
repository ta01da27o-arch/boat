// ===== モックデータ(3場分) =====
const venues = [
  {
    id: "fukuoka",
    name: "福岡",
    races: [
      {
        no: 1,
        entries: [
          {waku:1,class:"A1",name:"山田太郎",st:0.15,f:"F1",local:[45,40,30,20,5,7],motor:[50,40,30,20,10,5],course:[60,40,20,10,5,2]},
          {waku:2,class:"A2",name:"田中一郎",st:0.18,f:"",local:[30,25,20,15,5,3],motor:[40,35,30,15,10,5],course:[45,35,25,15,5,2]},
          {waku:3,class:"B1",name:"佐藤次郎",st:0.20,f:"",local:[20,18,15,10,5,2],motor:[30,25,20,15,10,5],course:[35,28,20,10,5,2]},
          {waku:4,class:"B1",name:"鈴木三郎",st:0.21,f:"F2",local:[15,12,10,8,5,1],motor:[25,20,15,10,5,2],course:[30,22,15,10,5,1]},
          {waku:5,class:"B2",name:"高橋四郎",st:0.23,f:"",local:[10,8,6,5,3,1],motor:[20,15,10,8,5,2],course:[25,18,12,8,5,2]},
          {waku:6,class:"B2",name:"伊藤五郎",st:0.25,f:"",local:[8,6,5,3,2,1],motor:[18,12,8,5,3,1],course:[20,15,10,5,3,1]}
        ],
        ai: {
          main:[{bet:"1-2-3",rate:56},{bet:"1-3-2",rate:20},{bet:"2-1-3",rate:10},{bet:"1-4-2",rate:8},{bet:"3-1-4",rate:6}],
          sub:[{bet:"3-1-4",rate:18},{bet:"4-1-2",rate:15},{bet:"2-3-1",rate:12},{bet:"5-1-2",rate:10},{bet:"6-1-2",rate:8}]
        },
        comments:[
          {no:1,text:"インから強力。地元水面も得意。"},
          {no:2,text:"差しが決まれば上位。"},
          {no:3,text:"スタートにムラあり。"},
          {no:4,text:"モーター力不足。"},
          {no:5,text:"展開待ち。"},
          {no:6,text:"-"}
        ]
      }
    ]
  },
  {
    id:"toda",
    name:"戸田",
    races:[
      {
        no:1,
        entries:[
          {waku:1,class:"A1",name:"佐々木太郎",st:0.14,f:"",local:[50,40,35,30,20,10],motor:[55,45,35,25,15,5],course:[60,50,40,30,20,10]},
          {waku:2,class:"A2",name:"田中次郎",st:0.17,f:"",local:[35,30,25,20,15,5],motor:[40,35,30,25,20,10],course:[50,40,30,20,10,5]},
          {waku:3,class:"B1",name:"鈴木三郎",st:0.19,f:"F1",local:[30,25,20,15,10,5],motor:[35,30,25,20,15,10],course:[40,35,25,15,10,5]},
          {waku:4,class:"B1",name:"高橋四郎",st:0.22,f:"",local:[20,15,10,8,5,2],motor:[25,20,15,10,5,2],course:[25,20,15,10,5,2]},
          {waku:5,class:"B2",name:"伊藤五郎",st:0.24,f:"",local:[15,10,8,5,3,1],motor:[20,15,10,8,5,2],course:[20,15,10,5,3,1]},
          {waku:6,class:"B2",name:"山本六郎",st:0.26,f:"F2",local:[10,5,3,2,1,0],motor:[15,10,8,5,3,1],course:[15,10,8,5,3,1]}
        ],
        ai:{main:[{bet:"1-2-3",rate:55}],sub:[{bet:"3-1-2",rate:15}]},
        comments:[{no:1,text:"-"}]
      }
    ]
  },
  {
    id:"biwako",
    name:"琵琶湖",
    races:[
      {
        no:1,
        entries:[
          {waku:1,class:"A1",name:"松本太郎",st:0.13,f:"",local:[50,45,40,35,30,25],motor:[55,50,45,40,35,30],course:[60,55,50,45,40,35]},
          {waku:2,class:"A2",name:"中村一郎",st:0.16,f:"",local:[40,35,30,25,20,15],motor:[45,40,35,30,25,20],course:[50,45,40,35,30,25]},
          {waku:3,class:"B1",name:"小林次郎",st:0.18,f:"F1",local:[35,30,25,20,15,10],motor:[40,35,30,25,20,15],course:[45,40,35,30,25,20]},
          {waku:4,class:"B1",name:"加藤三郎",st:0.21,f:"",local:[30,25,20,15,10,5],motor:[35,30,25,20,15,10],course:[40,35,30,25,20,15]},
          {waku:5,class:"B2",name:"佐々木四郎",st:0.23,f:"",local:[25,20,15,10,5,2],motor:[30,25,20,15,10,5],course:[35,30,25,15,10,5]},
          {waku:6,class:"B2",name:"田村五郎",st:0.25,f:"F2",local:[20,15,10,5,3,1],motor:[25,20,15,10,5,2],course:[30,25,20,10,5,2]}
        ],
        ai:{main:[{bet:"1-2-3",rate:52}],sub:[{bet:"2-3-1",rate:14}]},
        comments:[{no:1,text:"-"}]
      }
    ]
  }
];

// ===== 画面操作 =====
const venueList = document.getElementById("venue-list");
const raceList = document.getElementById("race-list");
const entryTableBody = document.querySelector("#entry-table tbody");
const aiMain = document.getElementById("ai-main");
const aiSub = document.getElementById("ai-sub");
const commentsUl = document.getElementById("comments");

const venueScreen = document.getElementById("venue-screen");
const raceScreen = document.getElementById("race-screen");
const entryScreen = document.getElementById("entry-screen");

let currentVenue = null;
let currentRace = null;

// 競艇場一覧
venues.forEach(venue => {
  const btn = document.createElement("div");
  btn.className = "venue-btn";
  btn.textContent = venue.name;
  btn.addEventListener("click", () => {
    currentVenue = venue;
    showRaces(venue);
  });
  venueList.appendChild(btn);
});

// レース一覧
function showRaces(venue){
  venueScreen.style.display="none";
  raceScreen.style.display="block";
  raceList.innerHTML = "";
  venue.races.forEach(r => {
    const btn = document.createElement("div");
    btn.className="race-btn";
    btn.textContent = `レース${r.no}`;
    btn.addEventListener("click", ()=>{
      currentRace = r;
      showEntries(r);
    });
    raceList.appendChild(btn);
  });
}

// 出走表表示
function showEntries(race){
  raceScreen.style.display="none";
  entryScreen.style.display="block";
  entryTableBody.innerHTML="";
  aiMain.innerHTML="";
  aiSub.innerHTML="";
  commentsUl.innerHTML="";

  race.entries.forEach(e=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.waku}</td>
      <td>${e.class}</td>
      <td>${e.name}</td>
      <td>${e.st}</td>
      <td>${e.f}</td>
      <td>${e.local.join(",")}</td>
      <td>${e.motor.join(",")}</td>
      <td>${e.course.join(",")}</td>
    `;
    entryTableBody.appendChild(tr);
  });

  race.ai.main.forEach(b=>{
    const li = document.createElement("li");
    li.textContent=`${b.bet} → ${b.rate}%`;
    aiMain.appendChild(li);
  });
  race.ai.sub.forEach(b=>{
    const li = document.createElement("li");
    li.textContent=`${b.bet} → ${b.rate}%`;
    aiSub.appendChild(li);
  });

  race.comments.forEach(c=>{
    const li = document.createElement("li");
    li.textContent=c.text;
    commentsUl.appendChild(li);
  });
}

// 戻るボタン
document.getElementById("back-venue").addEventListener("click", ()=>{
  raceScreen.style.display="none";
  venueScreen.style.display="block";
});
document.getElementById("back-race").addEventListener("click", ()=>{
  entryScreen.style.display="none";
  raceScreen.style.display="block";
});