fetch('data.json')
  .then(response => response.json())
  .then(data => {
    const container = document.getElementById('race-container');
    data.races.forEach(race => {
      if (!race.today) return; // 本日開催中のみ表示

      const card = document.createElement('div');
      card.className = 'race-card';

      card.innerHTML = `
        <h2>${race.name} レース</h2>
        <p><strong>AI予想:</strong> ${race.ai_predictions.join(', ')}</p>
        <p><strong>平均ST:</strong> ${race.average_st} <strong>予想ST:</strong> ${race.predicted_st}</p>
        <p><strong>AIコメント:</strong> ${race.ai_comment}</p>
        <button class="button" onclick="alert('出走表・買い目・コメント表示')">詳細</button>
      `;

      container.appendChild(card);
    });
  })
  .catch(err => console.error('データ取得エラー:', err));