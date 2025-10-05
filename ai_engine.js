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

export async function analyzeRace(players) {
  const ranks = await generateAIPredictions(players);
  const comments = await generateAIComments(players, ranks);
  return { ...ranks, comments };
}

// === 展開コメント生成 ===
export async function generateAIComments(players, aiPred) {
  return players.map(p => {
    const s = p.rawScore || 0;
    let comment = "";
    if (s > 3.5) comment = "機力上位。出足・伸びともに申し分なし。主導権を握る展開。";
    else if (s > 2.5) comment = "仕上がり良好。スタート決まれば頭も十分。";
    else if (s > 1.8) comment = "中堅級でバランス型。展開を突く足はある。";
    else if (s > 1.0) comment = "足はやや見劣る。道中での粘りに期待。";
    else comment = "苦戦気味。展開頼みの厳しい戦いになりそう。";
    return { lane: p.lane, comment };
  });
}

// === AI順位予測 & 買い目生成 ===
export async function generateAIPredictions(players) {
  const sorted = [...players].sort((a, b) => b.rawScore - a.rawScore);
  const ranks = sorted.map((p, i) => ({
    rank: i + 1,
    lane: p.lane,
    name: p.name,
    score: p.rawScore
  }));

  const combos = generateCombos([1, 2, 3, 4, 5, 6]);
  const main = combos.slice(0, 5).map(c => ({ combo: c.join("-"), prob: (85 - c[0] * 8).toFixed(1) }));
  const sub = combos.slice(-5).map(c => ({ combo: c.join("-"), prob: (15 + c[0] * 4).toFixed(1) }));

  return { ranks, main, sub };
}

// === 3連単組み合わせ ===
function generateCombos(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++)
    for (let j = 0; j < arr.length; j++)
      for (let k = 0; k < arr.length; k++)
        if (i !== j && j !== k && i !== k)
          result.push([arr[i], arr[j], arr[k]]);
  return result;
}