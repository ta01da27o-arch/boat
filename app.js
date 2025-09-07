const mainScreen = document.getElementById('main-screen');
const raceScreen = document.getElementById('race-screen');
const entryScreen = document.getElementById('entry-screen');

const venuesGrid = document.getElementById('venues-grid');
const racesGrid = document.getElementById('races-grid');
const entriesTable = document.getElementById('entries-table');

let currentVenue = null;
let currentRace = null;

fetch('data.json')
.then(res => res.json())
.then(data => {
  window.boatData = data;
  renderVenues();
});

function renderVenues() {
  venuesGrid.innerHTML = '';
  boatData.venues.forEach(venue => {
    const card = document.createElement('div');
    card.className = 'venue-card';
    card.innerHTML = `<div>${venue.name}</div><div>${venue.status}</div><div>${venue.rate}</div>`;
    card.onclick = () => {
      currentVenue = venue;
      renderRaces();
      mainScreen.classList.add('hidden');
      raceScreen.classList.remove('hidden');
    };
    venuesGrid.appendChild(card);
  });
}

function renderRaces() {
  racesGrid.innerHTML = '';
  document.getElementById('race-venue-name').innerText = currentVenue.name;
  const races = currentVenue.races.length ? currentVenue.races : Array.from({length:12},(_,i)=>({no:i+1}));
  races.forEach(race => {
    const card = document.createElement('div');
    card.className = 'race-card';
    card.innerText = race.no + 'R';
    card.onclick = () => {
      currentRace = race;
      renderEntries();
      raceScreen.classList.add('hidden');
      entryScreen.classList.remove('hidden');
    };
    racesGrid.appendChild(card);
  });
}

function renderEntries() {
  entriesTable.innerHTML = '';
  document.getElementById('entry-venue-race').innerText = `${currentVenue.name} ${currentRace.no}R 出走表`;

  if (!currentRace.entries) {
    entriesTable.innerHTML = '<p>データなし</p>';
    return;
  }

  let tableHTML = `<table>
    <tr>
      <th>枠</th><th>階級/選手名/ST</th>
      <th>当地勝率</th><th>モーター勝率</th><th>コース勝率</th>
      <th>Ai買い目</th><th>コメント</th>
    </tr>`;

  currentRace.entries.forEach(entry => {
    const rank = entry.waku;
    const symbol = rank === 1 ? '◎' : rank === 2 ? '○' : rank === 3 ? '△' : rank === 4 ? '✕' : 'ー';
    tableHTML += `<tr>
      <td>${entry.waku}</td>
      <td>${entry.class}<br>${entry.name}<br>${entry.st}</td>
      <td>${entry.local.join(',')}</td>
      <td>${entry.motor.join(',')}</td>
      <td>${entry.course.join(',')}</td>
      <td>${currentRace.ai ? 'Main: '+currentRace.ai.main.join(',')+' / Sub: '+currentRace.ai.sub.join(',') : '-'}</td>
      <td>${currentRace.comments ? currentRace.comments.find(c=>c.no===entry.waku)?.text || '-' : '-'}</td>
    </tr>`;
  });

  tableHTML += '</table>';
  entriesTable.innerHTML = tableHTML;
}

// 戻るボタン
document.getElementById('back-to-venues').onclick = () => {
  raceScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
};

document.getElementById('back-to-races').onclick = () => {
  entryScreen.classList.add('hidden');
  raceScreen.classList.remove('hidden');
};

// 更新ボタン
document.getElementById('update-btn').onclick = () => {
  renderVenues();
};

// 日付・総合的中率
document.getElementById('date').innerText = new Date().toLocaleDateString();
document.getElementById('overall-rate').innerText = '総合的中率: 50%';