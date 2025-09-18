function generateComment(race) {
  if (!race || !race.entries) return "データ不足";

  const sorted = [...race.entries].sort((a, b) => b.win_rate - a.win_rate);
  const top = sorted[0];
  const rival = sorted[1];

  return `${race.race_no}Rの注目は${top.lane}号艇 ${top.name}。勝率${top.win_rate?.toFixed(2)}で安定感十分。
ただし${rival.lane}号艇 ${rival.name}も好調で、接戦になる可能性があります。`;
}