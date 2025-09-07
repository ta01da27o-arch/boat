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
      <div class="status">${venue.status}</div>
      <div class="rate">${venue.rate}%</div>
    `;
    if (venue.status === '開催中') {
      card.onclick = () => openVenue(venue);
    }
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
  for (let i = 1; i <= 12; i++) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${i}R</h3>`;
    card.onclick = () => openRace(venue, i);
    grid.appendChild(card);
  }
}

// 出走表画面
function openRace(venue, raceNo) {
  document.getElementById('race-screen').classList.add('hidden');
  document.getElementById('race-detail-screen').classList.remove('hidden');
  document.getElementById('race-title').innerText = `${venue.name} ${raceNo}R 出走表`;

  const race = venue.races.find(r => r.no === raceNo) || { entries: [], ai: { main: [], sub: [] }, comments: [] };

  // 出走表
  const tbody = document.querySelector('#race-table tbody');
  tbody.innerHTML = '';
  race.entries.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.waku}</td>
      <td>${e.class}<br>${e.name}<br>ST:${e.st}</td>
      <td>${e.f > 0 ? 'F' + e.f : '-'}</td>
      <td>${e.local || '-'}</td>
      <td>${e.motor || '-'}</td>
      <td>${e.course || '-'}</td>
      <td class="${e.mark === '◎' ? 'red' : ''}">${e.mark || '-'}</td>
    `;
    tbody.appendChild(tr);
  });

  // AI買い目
  const aiBody = document.querySelector('#ai-table tbody');
  aiBody.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${race.ai.main[i] || '-'}</td>
      <td>${race.ai.sub[i] || '-'}</td>
    `;
    aiBody.appendChild(tr);
  }

  // コメント
  const cBody = document.querySelector('#comment-table tbody');
  cBody.innerHTML = '';
  race.comments.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.no}</td><td>${c.text || '-'}</td>`;
    cBody.appendChild(tr);
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