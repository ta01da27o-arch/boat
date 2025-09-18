function generateComment(race) {
  if (!race || !race.boats || race.boats.length === 0) return "データ不足";

  const sorted = [...race.boats].sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0));
  const top = sorted[0];
  const rival = sorted[1];

  if (!top) return "出走データ未取得";

  let comment = `${race.race_number}Rの注目は ${top.lane}号艇 ${top.player}`;
  if (top.win_rate) comment += `（勝率 ${top.win_rate.toFixed(2)}）`;

  if (rival) {
    comment += `。ただし ${rival.lane}号艇 ${rival.player} も好調で接戦の可能性あり。`;
  }

  return comment;
}