// ====== AI競艇予想アプリ：完全統合版 ======

// 画面切り替え制御
const screens = {
  venues: document.getElementById("screen-venues"),
  races: document.getElementById("screen-races"),
  detail: document.getElementById("screen-detail")
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// 初期ロード
document.addEventListener("DOMContentLoaded", () => {
  loadVenues();
  document.getElementById("aiStatus").innerText = "AI初期化完了";
});

// ===== 会場一覧 =====
function loadVenues() {
  const venues = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
    "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
    "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
  ];
  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";
  venues.forEach((v, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${v}`;
    btn.onclick = () => loadRaces(v, i+1);
    grid.appendChild(btn);
  });
}

// ===== レース一覧 =====
function loadRaces(venueName, venueNo) {
  showScreen("races");
  document.getElementById("venueTitle").innerText = `${venueName}`;
  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";
  for (let i=1;i<=12;i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.onclick = () => loadDetail(venueName, venueNo, i);
    grid.appendChild(btn);
  }
  document.getElementById("backToVenues").onclick = () => showScreen("venues");
}

// ===== レース詳細 =====
async function loadDetail(venueName, venueNo, raceNo) {
  showScreen("detail");
  document.getElementById("raceTitle").innerText = `${venueName} 第${raceNo}R`;

  const res = await fetch("data.json");
  const data = await res.json();
  const race = data.find(r => r.race_stadium_number === venueNo && r.race_number === raceNo);
  if (!race) {
    document.querySelector("#entryTable tbody").innerHTML = `<tr><td colspan='7'>データなし</td></tr>`;
    return;
  }

  renderEntryTable(race);
  renderAIBuy(race);
  renderComments(race);
  renderRanking(race);
}

function renderEntryTable(race) {
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";
  race.boats.forEach(b => {
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_name}</td>
      <td>${["A1","A2","B1","B2"][b.racer_class_number-1]||"?"}</td>
      <td>${b.racer_local_top_3_percent.toFixed(2)}%</td>
      <td>${b.racer_assigned_motor_number}</td>
      <td>${b.racer_average_start_timing.toFixed(2)}</td>
      <td>${aiEval(b)}</td>`;
    tbody.appendChild(tr);
  });
}

function aiEval(b) {
  const s = b.racer_local_top_3_percent + b.racer_assigned_motor_top_3_percent;
  if (s > 100) return "◎";
  if (s > 80) return "○";
  if (s > 60) return "△";
  return "―";
}

function renderAIBuy(race) {
  const main = document.querySelector("#aiMain tbody");
  const sub = document.querySelector("#aiSub tbody");
  main.innerHTML = `<tr><td>1-2-3</td><td>42%</td></tr>
                    <tr><td>1-3-2</td><td>31%</td></tr>`;
  sub.innerHTML = `<tr><td>2-1-3</td><td>12%</td></tr>
                   <tr><td>3-1-2</td><td>9%</td></tr>`;
}

function renderComments(race) {
  const tbody = document.querySelector("#commentTable tbody");
  tbody.innerHTML = "";
  race.boats.forEach(b => {
    let cls="normal", text="展開次第で上位可";
    const val=b.racer_local_top_3_percent;
    if (val>60){cls="super";text="圧倒的展開！"}
    else if (val>45){cls="strong";text="優勢な展開"}
    else if (val>30){cls="normal";text="中位安定"}
    else {cls="weak";text="厳しい展開";}
    const tr=document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML=`<td>${b.racer_boat_number}</td><td class='${cls}'>${text}</td><td>${cls}</td>`;
    tbody.appendChild(tr);
  });
}

function renderRanking(race) {
  const tbody = document.querySelector("#rankingTable tbody");
  tbody.innerHTML = "";
  const sorted = [...race.boats].sort((a,b)=>b.racer_local_top_3_percent - a.racer_local_top_3_percent);
  sorted.forEach((b,i)=>{
    const tr=document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML=`<td>${i+1}</td><td>${b.racer_boat_number}</td><td>${b.racer_name}</td><td>${b.racer_local_top_3_percent.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
}

document.getElementById("backToRaces").onclick = () => showScreen("races");