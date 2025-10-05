// ai_engine.js — AI解析エンジン完全版

/* ===========================================================
    データ構造・目的
    -----------------------------------------
    app.js から呼び出されるAIロジック。
    各レースの「選手データ」(players[]) を解析し、
    以下を返す：
     - main：AIメイン買い目
     - sub：AIサブ買い目
     - comments：展開コメント
     - ranks：順位予測
=========================================================== */

/**
 * 基本スコア算出
 * 各選手の総合力を 0〜100 で評価。
 */
function calcBaseScore(p) {
  const local = p.local ?? 0;
  const motor = p.motor ?? 0;
  const course = p.course ?? 0;
  const st = p.st ?? 0.20;
  const klass = (p.klass || "").includes("A1") ? 1.15 :
                 (p.klass || "").includes("A2") ? 1.05 :
                 (p.klass || "").includes("B1") ? 0.95 : 0.90;

  // スタートタイミングは小さいほど高評価
  const stFactor = (0.25 - st) * 200;

  let raw = (local * 0.4 + motor * 0.35 + course * 0.25) * klass + stFactor;
  if (raw < 0) raw = 0;
  return Math.min(Math.round(raw), 100);
}

/**
 * AI展開コメント生成
 */
function makeComments(players) {
  const list = [];
  players.forEach(p => {
    let cmt = "";
    if (p.st < 0.13) cmt = "トップスタートから主導権を握る";
    else if (p.st < 0.17) cmt = "好スタートで展開を作る";
    else if (p.st < 0.20) cmt = "平均的なスタートで中位争い";
    else cmt = "出遅れ気味で展開待ち";

    if (p.motor >= 80) cmt += "／モーター気配◎";
    else if (p.motor >= 70) cmt += "／モーター良好";
    else if (p.motor >= 60) cmt += "／普通";
    else cmt += "／パワー不足";

    if (p.local >= 80) cmt += "／当地実績高い";
    else if (p.local <= 50) cmt += "／当地苦手傾向";

    list.push({ lane: p.lane, comment: cmt });
  });
  return list;
}

/**
 * AI順位予測
 */
function makeRanks(players) {
  const ranked = players
    .map(p => ({ ...p, score: calcBaseScore(p) }))
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      rank: i + 1,
      lane: p.lane,
      name: p.name,
      score: p.score
    }));
  return ranked;
}

/**
 * AI買い目生成
 * 上位スコアから自動的に3連単候補を作成
 */
function makePredictions(ranks) {
  if (ranks.length < 3) return { main: [], sub: [] };
  const main = [];
  const sub = [];

  // 上位5人を対象にコンボ生成
  for (let i = 0; i < Math.min(5, ranks.length); i++) {
    for (let j = 0; j < Math.min(5, ranks.length); j++) {
      for (let k = 0; k < Math.min(5, ranks.length); k++) {
        if (i !== j && i !== k && j !== k) {
          const combo = `${ranks[i].lane}-${ranks[j].lane}-${ranks[k].lane}`;
          const prob = Math.max(10 - (i + j + k), 1) * 5; // 簡易確率
          if (main.length < 5) main.push({ combo, prob });
          else if (sub.length < 5) sub.push({ combo, prob });
        }
      }
    }
  }

  return { main, sub };
}

/**
 * AI解析統合関数（app.jsから呼び出される）
 */
export async function analyzeRace(players) {
  try {
    if (!Array.isArray(players) || !players.length) {
      return { main: [], sub: [], comments: [], ranks: [] };
    }

    const ranks = makeRanks(players);
    const { main, sub } = makePredictions(ranks);
    const comments = makeComments(players);

    return { main, sub, comments, ranks };
  } catch (err) {
    console.error("[AI解析エラー]", err);
    return { main: [], sub: [], comments: [], ranks: [] };
  }
}

/* ===========================================================
    以下は拡張用（学習・履歴反映など）
=========================================================== */

/**
 * 過去データ学習
 * （現在はダミー。将来的にAIモデルを強化する場合に利用）
 */
export async function learnFromResults(historyData) {
  console.log("[AI] 履歴データ学習(簡易)完了", Object.keys(historyData || {}).length);
}

/**
 * レース単体コメント生成（旧互換API）
 */
export function generateAIComments(players) {
  return makeComments(players);
}

/**
 * レース単体買い目生成（旧互換API）
 */
export function generateAIPredictions(players) {
  const ranks = makeRanks(players);
  return makePredictions(ranks);
}