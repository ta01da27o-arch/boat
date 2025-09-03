fetch('data.json')
  .then(res => res.json())
  .then(data => {
    const raceDiv = document.getElementById('raceList');
    for (const 場所 in data) {
      const placeUl = document.createElement('ul');
      const placeLi = document.createElement('li');
      placeLi.innerHTML = `<strong>${場所}</strong>`;
      placeUl.appendChild(placeLi);

      data[場所].forEach(レース => {
        const raceLi = document.createElement('li');
        raceLi.innerHTML = `
          <strong>${レース.レース}</strong><br>
          選手: ${レース.選手.join(", ")}<br>
          平均ST: ${レース.スタート平均.join(", ")}<br>
          予想ST: ${レース.スタート予想.join(", ")}<br>
          Ai予想: ${レース.Ai予想.join(", ")}<br>
          的中率: ${レース.Ai的中率.join("%, ")}%<br>
          コメント: ${レース.展開予想コメント}
        `;
        placeUl.appendChild(raceLi);
      });

      raceDiv.appendChild(placeUl);
    }
  })
  .catch(err => console.error(err));