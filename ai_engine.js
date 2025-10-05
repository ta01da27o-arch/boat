// ai_engine.js — 競艇AI学習・予測・コメント生成エンジン
// import対象: app.js（AI展開・順位・買い目を生成）

/* === 汎用ユーティリティ === */
function normalize(v, min, max) {
  if (v == null || isNaN(v)) return 0;
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
}
function randPick(arr, n = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/* === AIコメント生成 === */
export async function generateAIComments(players, aiPred) {
  const templates = {
    start: [
      "スリットで先行できそう",
      "平均STが安定しており、トップスタートの可能性",
      "立ち遅れ注意だが、ダッシュ一撃あり",
      "行き足が良く、仕掛け次第で展開を作る",
      "ターン巧者、差し有力",
      "調整合えば一発狙いも"
    ],
    motor: [
      "モーター気配上々",
      "モーター出足良好",
      "伸びが甘く調整課題あり",
      "機力平凡だが操縦でカバー",
      "パワー上位"
    ],
    local: [
      "当地実績抜群",
      "当地苦戦傾向",
      "得意水面で安定走り",
      "地元で意地を見せるか",
      "外枠でも展開一つで"
    ]
  };

  return players.map(p => {
    const c1 = randPick(templates.start)[0];
    const c2 = randPick(templates.motor)[0];
    const c3 = randPick(templates.local)[0];
    return {
      lane: p.lane,
      comment: `${c1}・${c2}・${c3}`
    };
  });
}

/* === AI買い目生成 === */
export async function generateAIPredictions(players) {
  // スコア正規化
  const scores = players.map(p => p.rawScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  const ranked = players.map(p => ({
    ...p,
    score: normalize(p.rawScore, min, max)
  })).sort((a, b) => b.score - a.score);

  // 順位予測
  const ranks = ranked.map((p, i) => ({
    rank: i + 1,
    lane: p.lane,
    name: p.name,
    score: p.score
  }));

  // 本命買い目（上位3艇）
  const mainCombos = [];
  if (ranked.length >= 3) {
    const [a, b, c] = ranked;
    mainCombos.push({
      combo: `${a.lane}-${b.lane}-${c.lane}`,
      prob: Math.round((a.score + b.score + c.score) / 3 * 100)
    });
  }
  // 穴買い目（4～6位組み合わせ）
  const subCombos = [];
  ranked.slice(3, 6).forEach((p, idx) => {
    subCombos.push({
      combo: `${p.lane}-全-全`,
      prob: Math.round(p.score * 100)
    });
  });

  return {
    main: mainCombos,
    sub: subCombos,
    ranks
  };
}

/* === AI学習（結果フィードバック） === */
export async function learnFromResults(history) {
  if (!history || typeof history !== "object") return;
  // 簡易版: 学習結果をコンソール出力のみ
  let count = 0;
  for (const d in history) {
    const res = history[d];
    if (!res.results) continue;
    res.results.forEach(r => {
      const trif = r.payouts?.trifecta?.[0]?.combination;
      if (trif) count++;
    });
  }
  console.log(`[AI_ENGINE] 学習済みデータ数: ${count}`);
}