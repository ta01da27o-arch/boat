export async function analyzeRace(players) {
  if (!players || players.length === 0) {
    return { main: [], sub: [], comments: [], ranks: [] };
  }

  // 仮AI：ランダム＋コメント強弱生成
  const main = [];
  const sub = [];
  const comments = [];
  const ranks = [];

  // ランダム買い目（ダミー）
  for (let i = 0; i < 3; i++) {
    const combo = `${rand(1,6)}-${rand(1,6)}-${rand(1,6)}`;
    main.push({ combo, rate: Math.random() });
  }
  for (let i = 0; i < 3; i++) {
    const combo = `${rand(1,6)}-${rand(1,6)}-${rand(1,6)}`;
    sub.push({ combo, rate: Math.random() * 0.8 });
  }

  // コメント強弱付き
  players.forEach(p => {
    const st = p.racer_average_start_timing;
    const speed = 1 - st;
    const strength = Math.min(1, speed);
    const text =
      strength > 0.7 ? "スタート鋭く展開主導！"
      : strength > 0.4 ? "中堅の動き。展開次第"
      : "展開に恵まれれば上位も";
    comments.push({ waku: p.racer_boat_number, text, strength });
  });

  // ランク
  const sorted = [...players].sort((a,b)=>a.racer_average_start_timing - b.racer_average_start_timing);
  sorted.forEach((p,i)=>{
    ranks.push({
      rank: i+1,
      waku: p.racer_boat_number,
      name: p.racer_name,
      score: (1-p.racer_average_start_timing).toFixed(2)
    });
  });

  return { main, sub, comments, ranks };
}

function rand(min, max) {
  return Math.floor(Math.random()*(max-min+1))+min;
}