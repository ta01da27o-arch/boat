function generateComment(race, history) {
  if (!race || !race.entries) return "データ不足";

  const enriched = race.entries.map(e => {
    const past = history.find(h => h.name === e.name);
    return {
      ...e,
      avg_start: past?.avg_start ?? null,
      recent_rate: past?.recent_rate ?? null
    };
  });

  const sorted = enriched.sort((a, b) => (b.win_rate ?? 0) - (a.win_rate ?? 0));
  const top = sorted[0];
  const rival = sorted[1];

  let comment = `${race.race_number}Rの注目は${top.lane}号艇 ${top.name}。勝率${top.win_rate?.toFixed(2)}で安定感十分。`;

  if (rival) {
    comment += `ただし${rival.lane}号艇 ${rival.name}も直近勝率${rival.recent_rate ?? "不明"}で好調。接戦となりそうです。`;
  }

  return comment;
}