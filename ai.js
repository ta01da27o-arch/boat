// ai.js

// 判定ベースのコメント生成
function generateDataBasedComment(player) {
  const comments = [];

  // ST（平均スタートタイミング）
  if (player.st <= 0.15) {
    comments.push("直近ST好調");
  } else if (player.st >= 0.20) {
    comments.push("スタート遅れ気味");
  }

  // モーター勝率
  if (player.motor >= 50) {
    comments.push("モーター気配上向き");
  } else if (player.motor < 30) {
    comments.push("パワー不足感あり");
  }

  // 当地勝率
  if (player.local >= 6.0) {
    comments.push("当地巧者");
  } else if (player.local < 4.0) {
    comments.push("当地では苦戦続き");
  }

  // コース勝率
  if (player.course >= 40) {
    comments.push("得意コースからの一戦");
  }

  // 評価記号
  if (player.eval === "◎") {
    comments.push("本命視される実力");
  } else if (player.eval === "△" || player.eval === "×") {
    comments.push("一発狙いの穴候補");
  }

  return comments;
}

// ランダム補強フレーズ
const extraPhrases = [
  "自在戦光る",
  "差し切りチャンス",
  "展開待ち",
  "まくり一撃期待",
  "安定感ある走り",
  "ここ一番で強さ発揮"
];

// 総合コメント生成
export function generateComment(player) {
  const base = generateDataBasedComment(player);
  const extra = extraPhrases[Math.floor(Math.random() * extraPhrases.length)];

  // 判定コメント2つ＋ランダム1つを選択
  const selected = [];
  if (base.length > 0) {
    selected.push(...base.sort(() => 0.5 - Math.random()).slice(0, 2));
  }
  selected.push(extra);

  return selected.join("、") + "。";
}

// 出走データを player 形式に変換
export function buildPlayerData(boat, evalMark) {
  return {
    st: typeof boat.racer_average_start_timing === "number"
      ? boat.racer_average_start_timing
      : (boat.racer_average_start_timing ? Number(boat.racer_average_start_timing) : 0.20),
    motor: boat.racer_assigned_motor_top_2_percent ?? boat.racer_motor_win_rate ?? 0,
    local: boat.racer_local_top_1_percent ?? boat.racer_local_win_rate ?? 0,
    course: boat.racer_assigned_boat_top_2_percent ?? boat.racer_course_win_rate ?? 0,
    eval: evalMark || "ー"
  };
}