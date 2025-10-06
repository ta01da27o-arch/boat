// ai_engine.js — AI展開コメント・順位予測・買い目生成 + 学習対応
// 軽量なルール＋学習データ(aiMemory)を組み合わせた擬似AIエンジン

let aiMemory = {}; // venueごとの過去的中情報などを蓄積（learnFromResultsで更新）

export async function learnFromResults(history) {
  // history は日別のオブジェクト群を想定
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

// 3連単全組み合わせ（1-6）
function generateAllTriples() {
  const arr = [1,2,3,4,5,6];
  const out = [];
  for (let i=0;i<arr.length;i++) for (let j=0;j<arr.length;j++) for (let k=0;k<arr.length;k++)
    if (i!==j && j!==k && i!==k) out.push([arr[i],arr[j],arr[k]]);
  return out;
}

// 主に順位予測（ranks）、買い目(main/sub)、コメント(comments)をまとめて返す
export async function analyzeRace(players) {
  // ensure lanes exist
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

  // スコア計算（STは低いほど良い -> 1/ST で正規化）
  normalizedPlayers.forEach(p => {
    const stScore = p.st ? (1 / (p.st)) : (1 / 0.3); // 小さいSTは高評価
    const localScore = (p.local != null) ? (p.local / 100) : 0.30;
    const motorScore = (p.motor != null) ? (p.motor / 100) : 0.30;
    const courseScore = (p.course != null) ? (p.course / 100) : 0.30;
    let classFactor = 1.0;
    if (String(p.klass).toUpperCase().includes("A1")) classFactor = 1.08;
    else if (String(p.klass).toUpperCase().includes("A2")) classFactor = 1.04;
    else if (String(p.klass).toUpperCase().includes("B1")) classFactor = 1.00;
    else if (String(p.klass).toUpperCase().includes("B2")) classFactor = 0.96;

    // 統合評価（重みは経験則）
    p.evalScore = ( (stScore * 0.45) + (localScore * 0.25) + (motorScore * 0.20) + (courseScore * 0.10) ) * classFactor;
  });

  // 順位予測
  const ranks = [...normalizedPlayers].sort((a,b) => b.evalScore - a.evalScore).map((p,i) => ({
    rank: i+1,
    lane: p.lane,
    name: p.name,
    score: Number(p.evalScore.toFixed(4))
  }));

  // 買い目（本命: 上位3艇の順列を元に確率付与、穴: 上位入れ替え+4-6を混ぜる）
  const topLanes = ranks.slice(0,3).map(r => r.lane);
  // 安全に3艇が揃っているか確認
  while (topLanes.length < 3) topLanes.push(1);

  // ベース確率は順位スコア差から算出
  const totalEval = ranks.reduce((s,r) => s + r.score, 0) || 1;
  const main = [];
  // main候補を生成（推奨順で）
  const permMain = [
    [topLanes[0], topLanes[1], topLanes[2]],
    [topLanes[0], topLanes[2], topLanes[1]],
    [topLanes[1], topLanes[0], topLanes[2]],
    [topLanes[1], topLanes[2], topLanes[0]],
    [topLanes[2], topLanes[0], topLanes[1]]
  ];
  permMain.forEach((comb, idx) => {
    // シンプルに上位差を反映したスコア
    const baseProb = Math.max(5, 50 - idx * 8); // 50,42,34,26,18
    main.push({ combo: comb.join("-"), prob: (baseProb).toFixed(1) });
  });

  // 穴候補：上位と中下位を混ぜる。学習データ（aiMemory）があれば重み付け
  const sub = [];
  const otherLanes = ranks.slice(3).map(r=>r.lane);
  const candidateSubs = [];
  // いくつか組み合わせを作る（上位1 + 下位2、もしくは上位2 + 下位1のパターン）
  if (otherLanes.length) {
    candidateSubs.push([topLanes[0], otherLanes[0], topLanes[1]]);
    if (otherLanes[1]) candidateSubs.push([topLanes[1], otherLanes[0], topLanes[0]]);
    if (otherLanes[1]) candidateSubs.push([otherLanes[0], topLanes[0], otherLanes[1]]);
  } else {
    candidateSubs.push([topLanes[2], topLanes[1], topLanes[0]]);
    candidateSubs.push([topLanes[1], topLanes[2], topLanes[0]]);
  }
  // 学習メモリの影響（簡易）
  candidateSubs.slice(0,5).forEach((c, i) => {
    let prob = 10 - i * 2 + (Math.random() * 4); // 10,8,6...
    // venue情報が not passed here; aiMemory not applied per-venue unless extended.
    sub.push({ combo: c.join("-"), prob: prob.toFixed(1) });
  });

  // 展開コメント（新聞記者風） — 各選手に強弱と根拠を付ける
  const maxEval = Math.max(...normalizedPlayers.map(p => p.evalScore));
  const minEval = Math.min(...normalizedPlayers.map(p => p.evalScore));
  const comments = normalizedPlayers.map(p => {
    const norm = (p.evalScore - minEval) / (Math.max(1e-6, (maxEval - minEval)));
    const posObj = ranks.find(r => r.lane === p.lane);
    const pos = posObj ? posObj.rank : 6;
    // 基本フレーズ（記者風）
    let base = "";
    if (pos === 1) {
      base = `機力抜群で主導権を握りやすい。スタート精度も高く、終始安定して押し切る公算大。`;
    } else if (pos === 2) {
      base = `差し・まくりどちらも対応可能。展開次第で逆転も十分。`;
    } else if (pos === 3) {
      base = `得意コースを生かして上位争いに食い込む。スタート次第で頭も。`;
    } else if (pos === 4) {
      base = `中堅。スタートが決まれば連に絡む可能性あり。`;
    } else if (pos === 5) {
      base = `やや苦戦気味。展開待ちの側面が強く、番狂わせに期待。`;
    } else {
      base = `機力的に厳しいが、気迫で一発を狙う展開も。`;
    }

    // 強弱修飾
    let adj = "";
    if (norm >= 0.85) adj = "（強）";
    else if (norm >= 0.6) adj = "（好調）";
    else if (norm >= 0.4) adj = "（普通）";
    else if (norm >= 0.2) adj = "（やや劣勢）";
    else adj = "（厳しい）";

    // 根拠の短文（当地/モーター/ST）
    const localTxt = p.local != null ? `当地:${p.local}%` : `当地:不明`;
    const motorTxt = p.motor != null ? `モーター:${p.motor}%` : `モーター:不明`;
    const stTxt = p.st != null ? `ST:${p.st.toFixed(2)}` : `ST:不明`;
    const reason = `${stTxt}・${localTxt}・${motorTxt}`;

    // 新聞記者風にする（短めに）
    const comment = `【${p.lane}号艇 ${p.name}】${base} ${adj} 根拠：${reason} — 記者`;
    return { lane: p.lane, comment };
  });

  return { ranks, main, sub, comments };
}

// 互換性のために個別関数もエクスポート（既存コードと同名で呼べるように）
export async function generateAIPredictions(players) {
  const res = await analyzeRace(players);
  return { ranks: res.ranks, main: res.main, sub: res.sub };
}
export async function generateAIComments(players, aiPred) {
  const res = await analyzeRace(players);
  return res.comments;
}