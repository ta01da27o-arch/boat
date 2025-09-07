let data;

// JSON読み込み
fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    renderVenues();
  });

// 競艇場一覧表示
function renderVenues() {
  const grid = document.getElementById('venue-grid');
  grid.innerHTML = '';
  data.venues.forEach(venue => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${venue.name}</h3>
      <div class="rate">${venue.rate}%</div>
      <div class="status">${venue.status}</div>
    `;
    card.onclick = () => openVenue(venue);
    grid.appendChild(card);
  });
}

// レース番号画面
function openVenue(venue) {
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('race-screen').classList.remove('hidden');
  document.getElementById('venue-title').innerText = venue.name;

  const grid = document.getElementById('race-grid');
  grid.innerHTML = '';
  venue.races.forEach(race => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${race.id}R</h3>`;
    card.onclick = () => openRace(venue, race);
    grid.appendChild(card);
  });
}

// 出走表画面
function openRace(venue, race) {
  document.getElementById('race-screen').classList.add('hidden');
  document.getElementById('race-detail-screen').classList.remove('hidden');
  document.getElementById('race-title').innerText = `${venue.name} ${race.id}R`;

  const tbody = document.querySelector('#race-table tbody');
  tbody.innerHTML = '';
  race.entries.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.枠}</td>
      <td>${e.選手名}</td>
      <td>${e.勝率}</td>
      <td>${e.ST}</td>
      <td>${e.F}</td>
      <td class="${e.AI予想 === '◎' ? 'red' : ''}">${e.AI予想}</td>
      <td>${e.コメント}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 戻るボタン
document.querySelectorAll('.back-btn').forEach(btn => {
  btn.onclick = () => {
    const target = btn.dataset.target;
    document.querySelectorAll('main, section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(target).classList.remove('hidden');
  };
});

// 更新ボタン
document.getElementById('update-btn').onclick = () => {
  renderVenues();
};

// 日付と総合的中率
document.getElementById('date').innerText = new Date().toLocaleDateString();
document.getElementById('overall-rate').innerText = '総合的中率: 50%';