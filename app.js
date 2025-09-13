const screenVenues = document.getElementById("screen-venues");
const screenRaces = document.getElementById("screen-races");
const screenDetail = document.getElementById("screen-detail");

const backBtnRace = document.getElementById("backBtnRace");
const backBtnDetail = document.getElementById("backBtnDetail");
const refreshBtn = document.getElementById("refreshBtn");

const venueGrid = document.getElementById("venueGrid");
const raceGrid = document.getElementById("raceGrid");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiPredictionBody = document.getElementById("aiPredictionBody");
const aiCommentDiv = document.getElementById("aiComment");
const overallHit = document.getElementById("overallHit");
const currentDateDiv = document.getElementById("currentDate");

let raceData = [];
let selectedVenue = "";
let selectedRace = null;

const allVenues = ["桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑","津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島","宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"];

function showDate(){
  const d = new Date();
  currentDateDiv.textContent = `日付: ${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
}

async function loadRaceData(){
  showDate();
  try{
    const res = await fetch("https://ta01da27o-arch.github.io/boat/data.json?nocache="+Date.now());
    const json = await res.json();
    raceData = json.races.programs.map(p=>({
      date:p.race_date.replace(/-/g,""),
      place:`場${p.race_stadium_number}`,
      race_no:p.race_number,
      race_title:p.race_title,
      race_subtitle:p.race_subtitle,
      start_time:p.race_closed_at?p.race_closed_at.split(" ")[1]:"-",
      entries:p.boats.map(b=>({
        lane:b.racer_boat_number,
        name:b.racer_name,
        f:b.racer_flying_count,
        local1:b.racer_local_top_1_percent,
        motor1:b.racer_assigned_motor_top_2_percent,
        course1:null
      }))
    }));
    showVenueList();
  }catch(e){
    console.error(e);
  }
}

function showVenueList(){
  screenDetail.classList.add("hidden");
  screenRaces.classList.add("hidden");
  screenVenues.classList.remove("hidden");
  venueGrid.innerHTML="";
  allVenues.forEach(v=>{
    const card = document.createElement("div");
    card.className="venue-card";
    const race = raceData.find(r=>r.place.includes(v));
    card.innerHTML=`<div>${v}</div><div>${race?"開催中":"ー"}</div><div>${race?Math.floor(Math.random()*100)+"%":"-"}</div>`;
    if(race) card.addEventListener("click",()=>{ selectedVenue=v; showRaceList(); });
    else card.classList.add("disabled");
    venueGrid.appendChild(card);
  });
}

function showRaceList(){
  screenVenues.classList.add("hidden");
  screenDetail.classList.add("hidden");
  screenRaces.classList.remove("hidden");
  venueTitle.textContent=selectedVenue;
  raceGrid.innerHTML="";
  const filtered=raceData.filter(r=>r.place.includes(selectedVenue));
  filtered.forEach(r=>{
    const card = document.createElement("div");
    card.className="race-card";
    card.textContent=`${r.race_no}R\n${r.start_time}`;
    card.addEventListener("click",()=>showRaceDetail(r));
    raceGrid.appendChild(card);
  });
}

function showRaceDetail(race){
  screenVenues.classList.add("hidden");
  screenRaces.classList.add("hidden");
  screenDetail.classList.remove("hidden");
  raceTitle.textContent=`${selectedVenue} ${race.race_no}R 出走表`;
  entryTableBody.innerHTML="";
  race.entries.forEach(e=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${e.lane}</td><td>${e.name}</td><td>${e.f}</td><td>${e.local1??"-"}</td><td>${e.motor1??"-"}</td><td>${e.course1??"-"}</td><td>◎</td>`;
    entryTableBody.appendChild(tr);
  });
  aiPredictionBody.innerHTML="";
  for(let i=0;i<5;i++){
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>3-1-5</td><td>1-3-4</td>`;
    aiPredictionBody.appendChild(tr);
  }
  aiCommentDiv.innerHTML="<div class='comment-grid'>各選手コメント表示</div>";
}

backBtnRace.addEventListener("click",()=>showVenueList());
backBtnDetail.addEventListener("click",()=>showRaceList());
refreshBtn.addEventListener("click",()=>loadRaceData());

loadRaceData();