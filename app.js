const view = document.getElementById("view");
const refreshBtn = document.getElementById("refreshBtn");

const VENUES = [
  "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
  "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
  "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
  "下関", "若松", "芦屋", "福岡", "唐津", "大村"
];

async function loadData() {
  try {
    const res = await fetch("data.json?cache=" + Date.now());
    if (!res.ok) throw new Error("データ取得に失敗しました。");
    const data = await res.json();
    showVenues(data);
  } catch (e) {
    view.innerHTML = `<p>⚠️ ${e.message}</p>`;
  }
}

function showVenues(data) {
  const container = document.createElement("div");
  container.className = "grid grid-cols-4 gap-2 p-2";

  VENUES.forEach((venue) => {
    const btn = document.createElement("button");
    btn.className =
      "bg-blue-500 text-white text-sm p-2 rounded-xl shadow hover:bg-blue-600";
    btn.textContent = venue;
    btn.onclick = () => showRaces(venue, data);
    container.appendChild(btn);
  });

  view.innerHTML = "";
  view.appendChild(container);
}

function showRaces(venue, data) {
  const list = data.filter((r) => r.venue === venue);
  const back = document.createElement("button");
  back.textContent = "← 戻る";
  back.className = "mb-2 bg-gray-300 p-2 rounded";
  back.onclick = () => showVenues(data);

  const ul = document.createElement("ul");
  ul.className = "space-y-2";
  list.forEach((r) => {
    const li = document.createElement("li");
    li.className = "p-2 border rounded";
    li.textContent = `${r.date} - ${r.race_title}`;
    ul.appendChild(li);
  });

  view.innerHTML = "";
  view.appendChild(back);
  view.appendChild(ul);
}

refreshBtn.onclick = loadData;
window.onload = loadData;