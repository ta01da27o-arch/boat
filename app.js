let data;
let currentVenue = null;
let currentRace = null;

async function loadData() {
  const res = await fetch("data.json");
  data = await res.json();
  document.getElementById("date").textContent = `日付: ${data.date}`;
  document.getElementById("accuracy").textContent = `総合的中率: ${data.ai_accuracy}%`;
  showVenues();
}

function showVenues() {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  const list = document.getElementById("venue-list");
  list.innerHTML = "";
  data.venues.forEach(v => {
    const btn = document.createElement("button");
    btn.textContent = `${v.name}\n${v.hitRate}%`;
    btn.disabled = !v.hasRacesToday;
    if (!btn.disabled) btn.onclick = () => showRaces(v.id);
    list.appendChild(btn);
  });
  list.parentElement.classList.remove("hidden");
}

function showRaces(venueId) {
  if (venueId) currentVenue = venueId;
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById("venue-title").textContent =
    data.venues.find(v => v.id === currentVenue).name;
  const box = document.getElementById("race-buttons");
  box.innerHTML = "";
  const races = data.races[currentVenue] || [];
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.disabled = !races.find(r => r.number === i);
    if (!btn.disabled) btn.onclick = () => showRaceDetail(i);
    box.appendChild(btn);
  }
  document.getElementById("race-list").classList.remove("hidden");
}

function showRaceDetail(raceNo) {
  currentRace = raceNo;
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  const race = data.races[currentVenue].find(r => r.number === raceNo);
  document.getElementById("race-title").textContent =
    `${data.venues.find(v => v.id === currentVenue).name} ${raceNo}R`;

  // 出走表
  const table = document.getElementById("entry-table");
  table.innerHTML = `
    <tr>
      <th>枠番</th><th>選手</th><th>当地勝率</th><th>モーター</th><th>コース</th>
    </tr>`;
  race.entries.forEach(e => {
    table.innerHTML += `
      <tr>
        <td class="waku">
          <div class="class">${e.class}</div>
          <div class="name">${e.name}</div>
          <div class="st">ST:${e.st} ${e.f}</div>
        </td>
        <td>${markRate(e.local)}</td>
        <td>${markRate(e.motor)}</td>
        <td>${markRate(e.course)}</td>
      </tr>`;
  });

  // AI予想
  const aiDiv = document.getElementById("ai-section");
  aiDiv.innerHTML = `<h3>AI予想</h3>`;
  aiDiv.innerHTML += `<strong>メイン</strong><br>${race.ai.main.map(b => `${b.bet}(${b.rate}%)`).join(" / ")}`;
  aiDiv.innerHTML += `<br><strong>穴</strong><br>${race.ai.sub.map(b => `${b.bet}(${b.rate}%)`).join(" / ")}`;

  // コメント
  const comDiv = document.getElementById("comment-section");
  comDiv.innerHTML = `<h3>選手コメント</h3>`;
  race.comments.forEach(c => {
    comDiv.innerHTML += `<div>${c.no}号艇: ${c.text || "-"}</div>`;
  });

  document.getElementById("race-detail").classList.remove("hidden");
}

function markRate(arr) {
  const sorted = [...arr].map((v, i) => ({v, i})).sort((a,b)=>b.v-a.v);
  const marks = ["◎","○","△","✕","ー"];
  const rank = sorted.map(s => s.i);
  return arr.map((v,i)=>{
    const r = rank.indexOf(i);
    const mark = r===0 ? `<span class="rate-mark red">◎</span>` :
                r<6 ? `<span class="rate-mark black">${marks[r]}</span>` :
                `<span class="rate-mark black">-</span>`;
    return `${v}%${mark}`;
  }).join("<br>");
}

document.getElementById("reload").onclick = loadData;
window.onload = loadData;