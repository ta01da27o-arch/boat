document.addEventListener("DOMContentLoaded", async () => {
  const todayEl = document.getElementById("today");
  todayEl.textContent = new Date().toLocaleDateString("ja-JP");

  const venuesScreen = document.getElementById("venuesScreen");
  const racesScreen = document.getElementById("racesScreen");
  const entriesScreen = document.getElementById("entriesScreen");

  const venuesGrid = document.getElementById("venuesGrid");
  const racesGrid = document.getElementById("racesGrid");
  const entriesEl = document.getElementById("entries");
  const aiCommentsEl = document.getElementById("ai-comments");

  const venueTitle = document.getElementById("venueTitle");
  const raceTitle = document.getElementById("raceTitle");

  const backToVenues = document.getElementById("backToVenues");
  const backToRaces = document.getElementById("backToRaces");

  // JSONロード
  const res = await fetch("data.json");
  const data = await res.json();

  // 24場表示
  data.venues.forEach(v => {
    const card = document.createElement("div");
    card.className = "venue-card";
    card.innerHTML = `
      <div class="v-name">${v.name}</div>
      <div class="v-status">${v.status}</div>
    `;
    if (v.status === "ー") {
      card.classList.add("disabled");
    } else {
      card.addEventListener("click", () => showRaces(v));
    }
    venuesGrid.appendChild(card);
  });

  function showRaces(venue){
    venuesScreen.classList.remove("active");
    racesScreen.classList.add("active");
    venueTitle.textContent = venue.name;

    racesGrid.innerHTML = "";
    for(let i=1;i<=12;i++){
      const btn=document.createElement("div");
      btn.className="race-btn";
      btn.textContent=`${i}R`;
      btn.addEventListener("click",()=>showEntries(venue,i));
      racesGrid.appendChild(btn);
    }
  }

  function showEntries(venue,raceNo){
    racesScreen.classList.remove("active");
    entriesScreen.classList.add("active");
    raceTitle.textContent=`${venue.name} ${raceNo}R`;

    entriesEl.innerHTML = `
      <div class="card">
        <table class="table">
          <tr><th>枠</th><th>選手</th><th>評価</th></tr>
          <tr class="row-1"><td>1</td><td>選手A</td><td><span class="mark red">◎</span></td></tr>
          <tr class="row-2"><td>2</td><td>選手B</td><td>○</td></tr>
          <tr class="row-3"><td>3</td><td>選手C</td><td>▲</td></tr>
          <tr class="row-4"><td>4</td><td>選手D</td><td>△</td></tr>
          <tr class="row-5"><td>5</td><td>選手E</td><td>-</td></tr>
          <tr class="row-6"><td>6</td><td>選手F</td><td>-</td></tr>
        </table>
      </div>
    `;

    aiCommentsEl.innerHTML = `
      <div>展開予想: 1号艇が逃げ切り。</div>
      <div>AI総合評価: ◎1, ○2, ▲3</div>
    `;
  }

  backToVenues.addEventListener("click",()=>{
    racesScreen.classList.remove("active");
    venuesScreen.classList.add("active");
  });

  backToRaces.addEventListener("click",()=>{
    entriesScreen.classList.remove("active");
    racesScreen.classList.add("active");
  });
});