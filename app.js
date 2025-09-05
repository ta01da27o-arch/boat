let appData = {};
let currentVenue = null;

async function loadData() {
  try {
    const res = await fetch("data.json");
    if (!res.ok) throw new Error("データ取得失敗");
    appData = await res.json();

    document.getElementById("date").textContent = new Date(appData.date).toLocaleDateString();
    document.getElementById("aiAccuracy").textContent = appData.ai_accuracy;

    const venuesDiv = document.getElementById("venues");
    venuesDiv.innerHTML = "";
    appData.venues.forEach(v => {
      const btn = document.createElement("button");
      btn.textContent = `${v.name}\n${v.hitRate}%`;
      btn.disabled = !v.hasRacesToday;
      btn.onclick = () => showRaces(v);
      venuesDiv.appendChild(btn);
    });
  } catch (e) {
    console.error("データ取得エラー:", e);
    alert("データ取得に失敗しました。");
  }
}

function showRaces(venue) {
  currentVenue = venue;
  document.getElementById("mainScreen").classList.add("hidden");
  document.getElementById("raceScreen").classList.remove("hidden");

  document.getElementById("venueTitle").textContent = venue.name;

  const racesDiv = document.getElementById("raceNumbers");
  racesDiv.innerHTML = "";
  const races = appData.races[venue.id] || [];
  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.disabled = !races.some(r => r.number === i);
    btn.onclick = () => showEntries(races.find(r => r.number === i), i);
    racesDiv.appendChild(btn);
  }
}

function showEntries(race, raceNo) {
  document.getElementById("raceScreen").classList.add("hidden");
  document.getElementById("entryScreen").classList.remove("hidden");
  document.getElementById("raceTitle").textContent = `${currentVenue.name} ${raceNo}R`;

  const tbody = document.querySelector("#entriesTable tbody");
  tbody.innerHTML = "";

  race.entries.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.waku}</td>
      <td>${e.class}</td>
      <td>${e.name}</td>
      <td>${e.st}</td>
      <td>${e.f || "-"}</td>
      <td>${symbolize(e.local[0])}</td>
      <td>${symbolize(e.motor[0])}</td>
      <td>${symbolize(e.course[0])}</td>
    `;
    tbody.appendChild(tr);
  });

  const aiDiv = document.getElementById("aiBets");
  aiDiv.innerHTML = `
    <p class="ai-main">メイン: ${race.ai.main.map(m => `${m.bet}(${m.rate}%)`).join(", ")}</p>
    <p class="ai-sub">穴: ${race.ai.sub.map(s => `${s.bet}(${s.rate}%)`).join(", ")}</p>
  `;

  const commentsUl = document.getElementById("comments");
  commentsUl.innerHTML = "";
  race.comments.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.no}号艇: ${c.text || "-"}`;
    commentsUl.appendChild(li);
  });
}

function symbolize(rate) {
  if (rate >= 50) return `<span class="symbol-top">◎</span> ${rate}%`;
  if (rate >= 40) return `<span class="symbol-normal">○</span> ${rate}%`;
  if (rate >= 30) return `<span class="symbol-normal">△</span> ${rate}%`;
  if (rate >= 20) return `<span class="symbol-normal">✕</span> ${rate}%`;
  return `<span class="symbol-normal">ー</span> ${rate}%`;
}

function goBackToVenues() {
  document.getElementById("raceScreen").classList.add("hidden");
  document.getElementById("mainScreen").classList.remove("hidden");
}

function goBackToRaces() {
  document.getElementById("entryScreen").classList.add("hidden");
  document.getElementById("raceScreen").classList.remove("hidden");
}

window.onload = loadData;