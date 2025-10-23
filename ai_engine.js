// ai_engine.js — AI展開コメント・順位予測・買い目生成 + 学習対応 + コメント強弱連動

let aiMemory = {}; // venueごとの過去的中情報などを蓄積

// ==========================
// 過去データ学習（簡易）
// ==========================
export async function learnFromResults(history) {
  aiMemory = aiMemory || {};
  Object.values(history || {}).forEach(day => {
    (day.results || []).forEach(r => {
      const venue = r.race_stadium_number;
      const trif = r.payouts?.trifecta?.[0]?.combination;
      if (!venue) return;
      aiMemory[venue] = aiMemory[venue] || { hits: {}, total: 0 };
      aiMemory[venue].total = (aiMemory[venue].total || 0) + 1;
      if (trif) aiMemory[venue].hits[trif] = (aiMemory[venue].hits[trif] || 0) + 1;
    });
  });
}

// ==========================
// 全3連単組み合わせ生成
// ==========================
function generateAllTriples() {
  const arr = [1, 2, 3, 4, 5, 6];
  const out = [];
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length; j++)
      for (let k = 0; k < arr.length; k++)
        if (i !== j && j !== k && i !== k) out.push([arr[i], arr[j], arr[k]]);
  return out;
}

// ==========================
// AI分析メイン処理
// ==========================
export async function analyzeRace(players) {
  const normalizedPlayers = players.map(p => ({
    lane: p.lane || 0,
    name: p.name || "-",
    klass: p.klass || "-",
    st: p.st || null,
    local: p.local != null ? p.local : null,
    motor: p.motor != null ? p.motor : null,
    course: p.course != null ? p.course : null,
    rawScore: p.rawScore || 0
  }));

  // スコア計算
  normalizedPlayers.forEach(p => {
    const stScore = p.st ? (1 / p.st) : (1 / 0.3);
    const localScore = (p.local ?? 30) / 100;
    const motorScore = (p.motor ?? 30) / 100;
    const courseScore = (p.course ?? 30) / 100;
    let classFactor = 1.0;

    if (String(p.klass).toUpperCase().includes("A1")) classFactor = 1.08;
    else if (String(p.klass).toUpperCase().includes("A2")) classFactor = 1.04;
    else if (String(p.klass).toUpperCase().includes("B1")) classFactor = 1.00;
    else if (String(p.klass).toUpperCase().includes("B2")) classFactor = 0.96;

    p.evalScore = ((stScore * 0.45) + (localScore * 0.25) + (motorScore * 0.20) + (courseScore * 0.10)) * classFactor;
  });

  // 順位予測
  const ranks = [...normalizedPlayers].sort((a, b) => b.evalScore - a.evalScore).map((p, i) => ({
    rank: i + 1,
    lane: p.lane,
    name: p.name,
    score: Number(p.evalScore.toFixed(4))
  }));

  // 買い目生成
  const topLanes = ranks.slice(0, 3).map(r => r.lane);
  while (topLanes.length < 3) topLanes.push(1);
  const main = [];
  const permMain = [
    [topLanes[0], topLanes[1], topLanes[2]],
    [topLanes[0], topLanes[2], topLanes[1]],
    [topLanes[1], topLanes[0], topLanes[2]],
    [topLanes[1], topLanes[2], topLanes[0]],
    [topLanes[2], topLanes[0], topLanes[1]]
  ];
  permMain.forEach((comb, idx) => {
    const baseProb = Math.max(5, 50 - idx * 8);
    main.push({ combo: comb.join("-"), prob: baseProb.toFixed(1) });
  });

  const sub = [];
  const otherLanes = ranks.slice(3).map(r => r.lane);
  const candidateSubs = [];

  if (otherLanes.length) {
    candidateSubs.push([topLanes[0], otherLanes[0], topLanes[1]]);
    if (otherLanes[1]) candidateSubs.push([topLanes[1], otherLanes[0], topLanes[0]]);
    if (otherLanes[1]) candidateSubs.push([otherLanes[0], topLanes[0], otherLanes[1]]);
  } else {
    candidateSubs.push([topLanes[2], topLanes[1], topLanes[0]]);
    candidateSubs.push([topLanes[1], topLanes[2], topLanes[0]]);
  }
  candidateSubs.slice(0, 5).forEach((c, i) => {
    let prob = 10 - i * 2 + (Math.random() * 4);
    sub.push({ combo: c.join("-"), prob: prob.toFixed(1) });
  });

  // ==========================
  // コメント生成（強弱付与）
  // ==========================
  const maxEval = Math.max(...normalizedPlayers.map(p => p.evalScore));
  const minEval = Math.min(...normalizedPlayers.map(p => p.evalScore));

  const comments = normalizedPlayers.map(p => {
    const norm = (p.evalScore - minEval) / (Math.max(1e-6, (maxEval - minEval)));
    const posObj = ranks.find(r => r.lane === p.lane);
    const pos = posObj ? posObj.rank : 6;

    // 強弱クラス分岐
    let strength = "weak";
    if (norm >= 0.7) strength = "strong";
    else if (norm >= 0.4) strength = "normal";
    else strength = "weak";

    // 基本コメント
    let base = "";
    if (pos === 1) base = "機力抜群で主導権を握りやすい。";
    else if (pos === 2) base = "展開を突けば逆転十分。";
    else if (pos === 3) base = "得意コースで好勝負期待。";
    else if (pos === 4) base = "展開次第で浮上も。";
    else if (pos === 5) base = "流れが向けば一発も。";
    else base = "苦戦気味だが気迫で挑む。";

    // 根拠
    const stTxt = p.st ? `ST:${p.st.toFixed(2)}` : "ST:不明";
    const localTxt = p.local != null ? `当地:${p.local}%` : "当地:不明";
    const motorTxt = p.motor != null ? `モーター:${p.motor}%` : "モーター:不明";
    const reason = `${stTxt}・${localTxt}・${motorTxt}`;

    // コメント文
    const comment = `【${p.lane}号艇 ${p.name}】${base} 根拠：${reason}`;

    return { lane: p.lane, comment, strength };
  });

  return { ranks, main, sub, comments };
}

// ==========================
// 旧関数互換
// ==========================
export async function generateAIPredictions(players) {
  const res = await analyzeRace(players);
  return { ranks: res.ranks, main: res.main, sub: res.sub };
}

export async function generateAIComments(players, aiPred) {
  const res = await analyzeRace(players);
  return res.comments;
}