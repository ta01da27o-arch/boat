import json
import datetime
import random
from pathlib import Path

# 読み込み／書き出しファイル
HISTORY_FILE = Path("history.json")
PREDICTION_FILE = Path("prediction.json")

def load_history():
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def simple_score(b):
    """選手艇データ b に対して簡易スコアをつける関数"""
    # スタートタイミングが小さい方が良 → 逆数
    st = b.get("racer_start_timing")
    st_score = 1.0 / (st + 0.01) if st is not None else 1.0
    # モーター性能、当地実績を加味
    mot = b.get("racer_assigned_motor_top_2_percent") or 0
    local = b.get("racer_local_top_1_percent") or 0
    score = st_score * (1 + mot / 100) * (1 + local / 100)
    return score

def generate_predictions_for_race(race):
    # boats 配列がある想定
    boats = race.get("boats", [])
    scored = []
    for b in boats:
        scored.append((b, simple_score(b)))
    scored.sort(key=lambda x: x[1], reverse=True)
    ranked = [b for (b, _) in scored]

    # 主予想（トライフェクタ 5点）: 上位3艇組み替え
    trif_preds = []
    used = set()
    top3 = ranked[:3]
    for a in top3:
        for b in top3:
            for c in top3:
                if a == b or b == c or a == c:
                    continue
                key = f"{a['racer_boat_number']}-{b['racer_boat_number']}-{c['racer_boat_number']}"
                if key not in used:
                    trif_preds.append(key)
                    used.add(key)
                if len(trif_preds) >= 5:
                    break
            if len(trif_preds) >= 5:
                break
        if len(trif_preds) >= 5:
            break

    # 二連単予想 3点
    exacta_preds = []
    used2 = set()
    for a in ranked[:2]:
        for b in ranked[:3]:
            if a == b:
                continue
            key2 = f"{a['racer_boat_number']}-{b['racer_boat_number']}"
            if key2 not in used2:
                exacta_preds.append(key2)
                used2.add(key2)
            if len(exacta_preds) >= 3:
                break
        if len(exacta_preds) >= 3:
            break

    # コメント生成（新聞風）— 簡易例
    comments = {}
    for b in boats:
        lane = b.get("racer_boat_number")
        comm = []
        st = b.get("racer_start_timing")
        mot = b.get("racer_assigned_motor_top_2_percent")
        local = b.get("racer_local_top_1_percent")
        # 条件文例
        if st is not None and st < 0.13:
            comm.append("鋭いスタート持ち")
        if mot is not None and mot > 50:
            comm.append("モーター良好")
        if local is not None and local > 5:
            comm.append("当地実績あり")
        # ランダム補強
        extras = ["展開次第で浮上", "捲り一手に注意", "安定感ある走り", "展開を活かしたい"]
        comm.append(random.choice(extras))
        comments[str(lane)] = "、".join(comm) + "。"

    return {
        "predictions": {
            "trifecta": trif_preds,
            "exacta": exacta_preds
        },
        "comments": comments
    }

def compute_accuracy(history, predictions):
    """的中率を過去データに対して計算（簡易）"""
    venue_stats = {}  # venueId -> {hit, total}
    # 過去のレース：history は日付 -> { results: [...] }
    for datekey, d in history.items():
        results = d.get("results", [])
        for race in results:
            vid = race.get("race_stadium_number")
            if vid is None:
                continue
            venue_stats.setdefault(vid, {"hit":0, "total":0})

            # 実際の上位3艇
            boats = race.get("boats", [])
            # sort by racer_place_number (着順)
            boats_sorted = sorted(boats, key=lambda b: b.get("racer_place_number", 999))
            top3 = [b.get("racer_boat_number") for b in boats_sorted[:3]]

            # 予想側（predictions JSON では直前の prediction が入る）  
            # ただし、過去用予想がないならスキップ
            pred_info = predictions.get(str(vid))
            if not pred_info:
                continue
            pred_list = pred_info.get("predictions", {}).get("trifecta", [])
            # 当たっているか「予想リストの中に top3 の組み合わせがあるか」
            for comb in pred_list:
                # comb 例: "1-3-2"
                arr = comb.split("-").map(x => parseInt(x))
                if arr.every((v,i) => v === top3[i]) {
                    venue_stats[vid]["hit"] += 1
                    break
            venue_stats[vid]["total"] += 1

    # 変換 to accuracy%（整数）
    accuracy = {}
    for vid, st in venue_stats.items():
        if st["total"] > 0:
            accuracy[vid] = round(st["hit"] / st["total"] * 100)
        else:
            accuracy[vid] = 0
    return accuracy

def main():
    history = load_history()

    # 空の predictions container
    result = {
        "updated": datetime.datetime.utcnow().isoformat() + "Z",
        "venues": {}
    }

    # 各場に対して予測 + コメント生成
    # using the latest date's races from history
    # pick the latest date key
    date_keys = sorted(history.keys())
    latest = history.get(date_keys[-1])
    if latest:
        for race in latest.get("results", []):
            vid = str(race.get("race_stadium_number"))
            pr = generate_predictions_for_race(race)
            result["venues"][vid] = {
                "predictions": pr["predictions"],
                "comments": pr["comments"]
            }

    # 的中率は累計として算出
    accuracy = compute_accuracy(history, result["venues"])
    for vid, acc in accuracy.items():
        if vid in result["venues"]:
            result["venues"][vid]["accuracy"] = acc
        else:
            result["venues"][vid] = {"accuracy": acc, "predictions": {}, "comments": {}}

    # 書き込み
    with open(PREDICTION_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print("Generated", PREDICTION_FILE)

if __name__ == "__main__":
    main()