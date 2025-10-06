let data = {};
let currentVenue = null;
let currentRace = null;

document.addEventListener("DOMContentLoaded", () => {
  loadData();
});

async function loadData() {
  try {
    const res = await fetch("data.json");
    data = await res.json();
    showVenues();
  } catch (e) {
    console.error("データ読み込み失敗", e);
  }
}

// ① 24場画面
function showVenues() {
  const screen = document.getElementById("screen-venues");
  screen.innerHTML = "";
  const venues = Object.keys(data);
  venues.forEach(v => {
    const div = document.createElement("div");
    div.className = "venue-btn card";
    div.textContent = v;
    div.onclick = () => {
      currentVenue = v;
      showRaces(v);
    };
    screen.appendChild(div);
  });
  switchScreen("screen-venues");
}

// ② レース番号画面
function showRaces(venue) {
  const screen = document.getElementById("screen-races");
  screen.innerHTML = "";
  const races = Object.keys(data[venue]);
  races.forEach(r => {
    const div = document.createElement("div");
    div.className = "race-btn card";
    div.textContent = `${r}R`;
    div.onclick = () => {
      currentRace = r;
      showRaceDetail(venue, r);
    };
    screen.appendChild(div);
  });

  const back = document.createElement("button");
  back.className = "back-btn";
  back.textContent = "← 戻る";
  back.onclick = () => showVenues();
  screen.appendChild(back);

  switchScreen("screen-races");
}

// ③ 出走表画面
function showRaceDetail(venue, raceNo) {
  const screen = document.getElementById("screen-race");
  screen.innerHTML = "";

  const racers = data[venue][raceNo];

  racers.forEach(r => {
    const div = document.createElement("div");
    div.className = `boat-card waku${r.waku}`;

    const name = document.createElement("div");
    name.innerHTML = `<strong>${r.waku}号艇：${r.name}</strong>`;
    div.appendChild(name);

    const stats = document.createElement("div");
    stats.innerHTML = `
      当地勝率：${r.local_rate}　モーター勝率：${r.motor_rate}　コース勝率：${r.course_rate}　評価：${r.rating}
    `;
    div.appendChild(stats);

    const aiComment = document.createElement("div");
    aiComment.className = "ai-comment";
    aiComment.textContent = `AIコメント：${r.ai_comment}`;
    if (r.comment_strength === "strong") aiComment.classList.add("comment-strong");
    if (r.comment_strength === "normal") aiComment.classList.add("comment-normal");
    if (r.comment_strength === "weak") aiComment.classList.add("comment-weak");
    div.appendChild(aiComment);

    const aiBuy = document.createElement("div");
    aiBuy.className = "ai-predict";
    aiBuy.textContent = `AI買い目：${r.ai_buy}`;
    div.appendChild(aiBuy);

    const aiRank = document.createElement("div");
    aiRank.className = "ai-predict";
    aiRank.textContent = `AI順位予測：${r.ai_rank}`;
    div.appendChild(aiRank);

    screen.appendChild(div);
  });

  const back = document.createElement("button");
  back.className = "back-btn";
  back.textContent = "← 戻る";
  back.onclick = () => showRaces(venue);
  screen.appendChild(back);

  switchScreen("screen-race");
}

// 画面切り替え
function switchScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}