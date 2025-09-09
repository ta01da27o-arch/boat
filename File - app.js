document.addEventListener("DOMContentLoaded", () => {
  const todayDate = document.getElementById("today-date");
  const venuesContainer = document.getElementById("venues");
  const racesContainer = document.getElementById("races");
  const entriesContainer = document.getElementById("entries");

  const venuesScreen = document.getElementById("venues-screen");
  const racesScreen = document.getElementById("races-screen");
  const entriesScreen = document.getElementById("entries-screen");

  // 今日の日付
  const today = new Date();
  todayDate.textContent = `${today.getFullYear()}年${today.getMonth()+1}月${today.getDate()}日`;

  // data.json 読み込み
  fetch("data.json")
    .then(res => res.json())
    .then(data => {
      renderVenues(data.venues);
    });

  // 24場カード
  function renderVenues(venues){
    venuesContainer.innerHTML = "";
    venues.forEach(v => {
      const card = document.createElement("div");
      card.className = "venue-card";
      if(v.status === "開催中"){
        card.classList.add("clickable");
      }else{
        card.classList.add("disabled");
      }
      card.innerHTML = `
        <div class="v-name">${v.name}</div>
        <div class="v-status">${v.status === "開催中" ? "開催中" : "ー"}</div>
        <div class="v-rate">${v.rate}%</div>
      `;
      if(v.status === "開催中"){
        card.addEventListener("click", ()=> showRaces(v));
      }
      venuesContainer.appendChild(card);
    });
  }

  // レース番号画面
  function showRaces(venue){
    venuesScreen.classList.remove("active");
    racesScreen.classList.add("active");
    document.getElementById("venue-title").textContent = venue.name;
    racesContainer.innerHTML = "";
    for(let i=1;i<=12;i++){
      const btn = document.createElement("div");
      btn.className = "race-btn";
      btn.textContent = `${i}R`;
      btn.addEventListener("click", ()=> showEntries(venue,i));
      racesContainer.appendChild(btn);
    }
    racesScreen.querySelector(".back-button").onclick = ()=>{
      racesScreen.classList.remove("active");
      venuesScreen.classList.add("active");
    };
  }

  // 出走表画面
  function showEntries(venue,raceNo){
    racesScreen.classList.remove("active");
    entriesScreen.classList.add("active");
    document.getElementById("race-title").textContent = `${venue.name} ${raceNo}R`;

    // サンプル出走表
    entriesContainer.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>枠</th><th>選手</th><th>当地勝率</th><th>モーター勝率</th><th>コース勝率</th><th>評価</th>
          </tr>
        </thead>
        <tbody>
          ${[1,2,3,4,5,6].map(i=>`
            <tr class="row-${i}">
              <td>${i}</td>
              <td class="entry-left">
                <div class="klass">A1</div>
                <div class="name">選手${i}</div>
                <div class="st">ST 0.${10+i}</div>
              </td>
              <td><span class="metric-symbol ${i===1?"top":""}">${i===1?"◎":"○"}</span><div class="metric-small">57%</div><div class="metric-small">78%</div></td>
              <td><span class="metric-symbol">${i===2?"△":"○"}</span><div class="metric-small">44%</div><div class="metric-small">65%</div></td>
              <td><span class="metric-symbol">${i===3?"✕":"○"}</span><div class="metric-small">36%</div><div class="metric-small">58%</div></td>
              <td><span class="eval-mark ${i===1?"red":""}">${i===1?"◎":i===2?"○":i===3?"△":i===4?"✕":"ー"}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    // AI予想（サンプル）
    document.getElementById("ai-main").innerHTML = `
      <tr><td>3-1-5</td><td>52%</td></tr>
      <tr><td>3-1-4</td><td>35%</td></tr>
      <tr><td>3-4-1</td><td>30%</td></tr>
      <tr><td>1-3-5</td><td>22%</td></tr>
      <tr><td>1-3-4</td><td>10%</td></tr>
    `;
    document.getElementById("ai-anomaly").innerHTML = `
      <tr><td>5-3-1</td><td>40%</td></tr>
      <tr><td>6-1-3</td><td>33%</td></tr>
      <tr><td>4-5-6</td><td>25%</td></tr>
      <tr><td>2-6-1</td><td>18%</td></tr>
      <tr><td>6-2-5</td><td>9%</td></tr>
    `;
    document.getElementById("ai-comments").innerHTML = `
      <div>1号艇: スタート安定</div>
      <div>2号艇: 差し有力</div>
      <div>3号艇: 捲り注意</div>
      <div>4号艇: 外枠苦戦</div>
      <div>5号艇: 展開待ち</div>
      <div>6号艇: 一発狙い</div>
    `;

    entriesScreen.querySelector(".back-button").onclick = ()=>{
      entriesScreen.classList.remove("active");
      racesScreen.classList.add("active");
    };
  }
});