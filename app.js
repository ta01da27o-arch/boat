fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const venuesDiv = document.getElementById('venues');
    data.venues.forEach(v => {
      const div = document.createElement('div');
      div.textContent = `${v.name} (${v.hasRacesToday ? '開催中' : '未開催'})`;
      venuesDiv.appendChild(div);
    });

    const racesDiv = document.getElementById('races');
    data.races.kiryu.forEach(race => {
      const div = document.createElement('div');
      div.innerHTML = `<strong>レース${race.number} ${race.startTime}</strong>`;
      race.entries.forEach(e => {
        const entry = document.createElement('div');
        entry.textContent = `${e.waku}号艇: ${e.name} (${e.class})`;
        div.appendChild(entry);
      });
      racesDiv.appendChild(div);
    });
  });