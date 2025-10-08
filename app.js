const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.querySelector("#entryTable tbody");

let currentType = "today";

todayBtn.addEventListener("click", () => {
  currentType = "today";
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  loadRaceData();
});

yesterdayBtn.addEventListener("click", () => {
  currentType = "yesterday";
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  loadRaceData();
});

async function loadRaceData() {
  try {
    const res = await fetch("data.json");
    const json = await res.json();
    const data = json[currentType];
    if (!data) throw new Error("データなし");

    renderEntryTable(data.entries);
    raceTitle.textContent = data.title;

  } catch (err) {
    console.error("データ読み込み失敗:", err);
    raceTitle.textContent = "データ読み込みエラー";
  }
}

function renderEntryTable(entries) {
  let html = "";
  entries.forEach(p => {
    html += `
      <tr class="row-${p.waku}">
        <td>${p.waku}</td>
        <td>
          <div class="entry-left">
            <div class="klass">${p.class}</div>
            <div class="name">${p.name}</div>
            <div class="st">ST: ${p.st}</div>
          </div>
        </td>
        <td>${p.f}</td>
        <td>${p.national}%</td>
        <td>${p.local}%</td>
        <td>${p.motor}</td>
        <td>${p.course}</td>
        <td class="eval-mark">${p.eval}</td>
      </tr>`;
  });
  entryTableBody.innerHTML = html;
}

// 初回ロード
loadRaceData();