// ======== 競艇AI予想アプリ：完全統合版 ========

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

// 初期ロード処理
document.addEventListener("DOMContentLoaded", () => {
  loadVenues();
  document.getElementById("aiStatus").innerText = "AI初期化完了";
});

// ======== 会場一覧 ========

async function loadVenues() {
  const grid = document.getElementById("venuesGrid");
  grid.innerHTML = "";

  try {
    const res = await fetch("data.json");
    const data = await res.json();

    // 全24場データを抽出（最新の当日分 or 蓄積データ対応）
    const venues = [
      "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
      "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
      "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
    ];

    venues.forEach((v, i) => {
      const venueData = data.find(d => d.race_stadium_number === i + 1);
      const btn = document.createElement("button");

      const status = venueData
        ? venueData.race_status || "開催中"
        : "－";
      const hitRate = venueData
        ? `${venueData.ai_hit_rate || 0}%`
        : "0%";

      btn.innerHTML = `
        <div class="venue-name">${v}</div>
        <div class="venue-status">${status}</div>
        <div class="venue-rate">的中率 ${hitRate}</div>
      `;
      btn.onclick = () => loadRaces(v, i + 1);
      grid.appendChild(btn);
    });
  } catch (e) {
    console.error("会場データ読み込み失敗:", e);
    grid.innerHTML = "<p>データ読み込みエラー</p>";
  }
}

// ======== レース一覧 ========

function loadRaces(venueName, venueNo) {
  showScreen("races");
  document.getElementById("venueTitle").innerText = `${venueName}`;
  const grid = document.getElementById("racesGrid");
  grid.innerHTML = "";

  for (let i = 1; i <= 12; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}R`;
    btn.onclick = () => loadDetail(venueName, venueNo, i);
    grid.appendChild(btn);
  }

  document.getElementById("backToVenues").onclick = () => showScreen("venues");
}

// ======== 出走表詳細 ========

async function loadDetail(venueName, venueNo, raceNo) {
  showScreen("detail");
  document.getElementById("raceTitle").innerText = `${venueName} 第${raceNo}R`;

  try {
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

  } catch (e) {
    console.error("レース詳細エラー:", e);
  }
}

// ======== 出走表レンダリング ========

function renderEntryTable(race) {
  const tbody = document.querySelector("#entryTable tbody");
  tbody.innerHTML = "";

  race.boats.forEach(b => {
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);

    // F回数表示
    const fCount = b.racer_start_exhibition_count_f || 0;
    const fDisplay = fCount === 0 ? "－" : `F${fCount}`;

    // 勝率→整数化
    const localRate = Math.round(b.racer_local_top_3_percent);
    const nationalRate = Math.round(b.racer_national_top_3_percent);

    // ST表示
    const avgST = b.racer_average_start_timing?.toFixed(2) || "-";

    tr.innerHTML = `
      <td>${b.racer_boat_number}</td>
      <td>
        <div>${["A1","A2","B1","B2"][b.racer_class_number - 1] || "-"}</div>
        <div>${b.racer_name}</div>
        <div>ST:${avgST}</div>
      </td>
      <td>${fDisplay}</td>
      <td>${localRate}%</td>
      <td>${b.racer_assigned_motor_number}</td>
      <td>${b.racer_course_number}</td>
      <td>${aiEval(b)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ======== AI評価ロジック ========

function aiEval(b) {
  const s = b.racer_local_top_3_percent + b.racer_assigned_motor_top_3_percent;
  if (s > 100) return "◎";
  if (s > 80) return "○";
  if (s > 60) return "△";
  return "―";
}

// ======== AI買い目 ========

function renderAIBuy(race) {
  const main = document.querySelector("#aiMain tbody");
  const sub = document.querySelector("#aiSub tbody");

  const boats = [...race.boats]
    .sort((a, b) => (b.racer_local_top_3_percent + b.racer_assigned_motor_top_3_percent) -
                     (a.racer_local_top_3_percent + a.racer_assigned_motor_top_3_percent))
    .slice(0, 4);

  // 仮AI確率算出
  main.innerHTML = "";
  sub.innerHTML = "";
  boats.forEach((b, i) => {
    const pct = (60 - i * 10);
    main.innerHTML += `<tr><td>${b.racer_boat_number}-1-3</td><td>${pct}%</td></tr>`;
    sub.innerHTML += `<tr><td>${b.racer_boat_number}-3-1</td><td>${pct / 2}%</td></tr>`;
  });
}

// ======== コメント生成 ========

function renderComments(race) {
  const tbody = document.querySelector("#commentTable tbody");
  tbody.innerHTML = "";

  race.boats.forEach(b => {
    let cls = "normal";
    let text = "展開次第で上位可";

    const val = b.racer_local_top_3_percent;
    if (val > 65) { cls = "super"; text = "圧倒的展開で抜け出す！"; }
    else if (val > 50) { cls = "strong"; text = "安定して好走可能"; }
    else if (val > 35) { cls = "normal"; text = "中位キープの走り"; }
    else { cls = "weak"; text = "展開厳しい展開"; }

    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML = `<td>${b.racer_boat_number}</td><td class='${cls}'>${text}</td>`;
    tbody.appendChild(tr);
  });
}

// ======== AI順位予測 ========

function renderRanking(race) {
  const tbody = document.querySelector("#rankingTable tbody");
  tbody.innerHTML = "";

  const sorted = [...race.boats].sort(
    (a, b) => b.racer_local_top_3_percent - a.racer_local_top_3_percent
  );

  sorted.forEach((b, i) => {
    const tr = document.createElement("tr");
    tr.classList.add(`waku${b.racer_boat_number}`);
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${b.racer_boat_number}</td>
      <td>${b.racer_name}</td>
      <td>${b.racer_local_top_3_percent.toFixed(2)}%</td>
    `;
    tbody.appendChild(tr);
  });
}

// ======== 戻るボタン ========
document.getElementById("backToRaces").onclick = () => showScreen("races");