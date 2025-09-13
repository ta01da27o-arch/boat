// ===============================
// 要素取得
// ===============================
const screenVenues = document.getElementById("screen-venues"); // 場一覧
const screenRaces = document.getElementById("screen-races");   // レース一覧
const screenDetail = document.getElementById("screen-detail"); // 出走表

const todayBtn = document.getElementById("todayBtn");
const yesterdayBtn = document.getElementById("yesterdayBtn");
const backBtnRace = document.getElementById("backBtnRace");
const backBtnDetail = document.getElementById("backBtnDetail");

const venueList = document.getElementById("venueList");
const raceList = document.getElementById("raceList");
const venueTitle = document.getElementById("venueTitle");
const raceTitle = document.getElementById("raceTitle");
const entryTableBody = document.querySelector("#entryTable tbody");
const aiCommentDiv = document.getElementById("aiComment");

// ===============================
// データ保持
// ===============================
let raceData = [];
let selectedDate = "";
let selectedVenue = "";

// ===============================
// データロード
// ===============================
async function loadRaceData() {
  try {
    const res = await fetch("https://ta01da27o-arch.github.io/boat/data.json?nocache=" + Date.now());
    const json = await res.json();

    // 現在の JSON に合わせる
    if (json && json.races && Array.isArray(json.races.programs)) {
      // programs 配列を raceData に格納
      raceData = json.races.programs.map(p => {
        return {
          date: p.race_date.replace(/-/g, ""),          // YYYYMMDD に変換
          place: `場${p.race_stadium_number}`,          // 場番号を文字列に
          race_no: p.race_number,
          race_title: p.race_title,
          race_subtitle: p.race_subtitle,
          race_distance: p.race_distance,
          start_time: p.race_closed_at ? p.race_closed_at.split(" ")[1] : "-",
          entries: Array.isArray(p.boats) ? p.boats.map(b => ({
            lane: b.racer_boat_number,
            name: b.racer_name,
            win_rate: b.racer_national_top_1_percent ?? null,
            start_avg: b.racer_average_start_timing ?? null
          })) : []
        };
      });
    } else {
      raceData = [];
    }

    // 初期は当日
    selectedDate = getToday();
    todayBtn.classList.add("active");
    yesterdayBtn.classList.remove("active");

    showVenueList();
  } catch (e) {
    venueList.innerHTML = `<li>データ取得失敗: ${e}</li>`;
    console.error("データ読み込み失敗:", e);
  }
}

// ===============================
// 場リストを表示
// ===============================
function showVenueList() {
  screenDetail.classList.add("hidden");
  screenRaces.classList.add("hidden");
  screenVenues.classList.remove("hidden");

  venueList.innerHTML = "";

  const filtered = raceData.filter(r => r.date === selectedDate && r.place);
  const venues = [...new Set(filtered.map(r => r.place))];

  if (venues.length === 0) {
    venueList.innerHTML = "<li>データがありません</li>";
    return;
  }

  venues.forEach(venue => {
    const li = document.createElement("li");
    li.textContent = venue;
    li.addEventListener("click", () => {
      selectedVenue = venue;
      showRaceList();
    });
    venueList.appendChild(li);
  });
}

// ===============================
// レースリストを表示
// ===============================
function showRaceList() {
  screenVenues.classList.add("hidden");
  screenDetail.classList.add("hidden");
  screenRaces.classList.remove("hidden");

  venueTitle.textContent = selectedVenue;
  raceList.innerHTML = "";

  const filtered = raceData.filter(r => r.date === selectedDate && r.place === selectedVenue);

  if (filtered.length === 0) {
    raceList.innerHTML = "<li>レースデータがありません</li>";
    return;
  }

  filtered.forEach(race => {
    const li = document.createElement("li");
    li.textContent = `${race.race_no ?? "-"}R (${race.start_time ?? "-"})`;
    li.addEventListener("click", () => showRaceDetail(race));
    raceList.appendChild(li);
  });
}

// ===============================
// レース詳細（出走表）表示
// ===============================
function showRaceDetail(race) {
  screenRaces.classList.add("hidden");
  screenDetail.classList.remove("hidden");

  raceTitle.textContent = `${race.place ?? "-"} ${race.race_no ?? "-"}R 出走表`;

  entryTableBody.innerHTML = "";

  const entries = Array.isArray(race.entries) ? race.entries : [];

  if (entries.length === 0) {
    entryTableBody.innerHTML = "<tr><td colspan='4'>出走データなし</td></tr>";
  } else {
    entries.forEach(e => {
      const tr = document.createElement("tr");
      tr.classList.add(`lane-${e.lane ?? 0}`);
      tr.innerHTML = `
        <td>${e.lane ?? "-"}</td>
        <td>${e.name ?? "-"}</td>
        <td>${e.win_rate != null ? e.win_rate.toFixed(2) : "-"}</td>
        <td>${e.start_avg ?? "-"}</td>
      `;
      entryTableBody.appendChild(tr);
    });
  }

  aiCommentDiv.innerHTML = `<p>${generateComment(race)}</p>`;
}

// ===============================
// 戻るボタン
// ===============================
backBtnRace.addEventListener("click", () => {
  screenRaces.classList.add("hidden");
  screenVenues.classList.remove("hidden");
});

backBtnDetail.addEventListener("click", () => {
  screenDetail.classList.add("hidden");
  screenRaces.classList.remove("hidden");
});

// ===============================
// 日付切替
// ===============================
todayBtn.addEventListener("click", () => {
  todayBtn.classList.add("active");
  yesterdayBtn.classList.remove("active");
  selectedDate = getToday();
  showVenueList();
});

yesterdayBtn.addEventListener("click", () => {
  yesterdayBtn.classList.add("active");
  todayBtn.classList.remove("active");
  selectedDate = getYesterday();
  showVenueList();
});

// ===============================
// 日付ヘルパー
// ===============================
function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}
function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// ===============================
// AIコメント生成（仮）
// ===============================
function generateComment(race) {
  const entries = Array.isArray(race.entries) ? race.entries : [];
  if (entries.length === 0) return "データなし";

  const fav = entries.reduce((a, b) => (a.win_rate > b.win_rate ? a : b));
  return `${fav.lane}号艇 ${fav.name} が有力候補と見られます。`;
}

// ===============================
// 初期化
// ===============================
loadRaceData();