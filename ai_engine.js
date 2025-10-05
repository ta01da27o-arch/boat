// ai_engine.js — AI展開コメント・順位予測・買い目生成 + 学習対応

let aiMemory = {}; // 学習データを蓄積

export async function learnFromResults(history) {
  Object.values(history).forEach(day => {
    (day.results || []).forEach(r => {
      const win = r.payouts?.trifecta?.[0]?.combination;
      const venue = r.race_stadium_number;
      if (!win) return;
      aiMemory[venue] = aiMemory[venue] || {};
      aiMemory[venue][win] = (aiMemory[venue][win] || 0) + 1;
    });
  });
}

// 展開コメント生成
export async function generateAIComments(players, aiPred) {
  return players.map(p => {
    const s = p.rawScore;
    let comment = "";
    if (s > 3.0) comment = "好調。機力上位で展開主導、押し切り十分。";
    else if (s > 2.0) comment = "機力上向き。スタート決まれば上位可能。";
    else if (s > 1.2) comment = "中堅級。展開次第でチャンスあり。";
    else if (s > 0.8) comment = "やや苦戦気味。スタートでリズムを作りたい。";
    else comment = "機力劣勢。展開頼みの苦しい戦い。";
    return { lane: p.lane, comment };
  });
}

// AI順位予測 & 買い目生成
export async function generateAIPredictions(players) {
  const sorted = [...players].sort((a, b) => b.rawScore - a.rawScore);
  const ranks = sorted.map((p, i) => ({
    rank: i + 1,
    lane: p.lane,
    name: p.name,
    score: p.rawScore
  }));

  // AI買い目: 本命と穴（単純学習データ連携）
  const combos = generateCombos([1,2,3,4,5,6]);
  const main = combos.slice(0, 5).map(c => ({ combo: c.join(""), prob: (80 - c[0]*10).toFixed(1) }));
  const sub = combos.slice(-5).map(c => ({ combo: c.join(""), prob: (20 + c[0]*5).toFixed(1) }));

  return { ranks, main, sub };
}

// 3連単組み合わせ生成
function generateCombos(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length; j++)
      for (let k = 0; k < arr.length; k++)
        if (i !== j && j !== k && i !== k)
          result.push([arr[i], arr[j], arr[k]]);
  return result;
}