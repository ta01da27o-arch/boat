import json
import datetime
import os
from collections import defaultdict

DATA_FILE = "data.json"

# -----------------------------
# 仮の外部データ取得（本番ではAPI置換）
# -----------------------------
def fetch_race_data():
    today = datetime.date.today().strftime("%Y-%m-%d")
    return [
        {
            "race_date": today,
            "race_stadium_number": 1,  # 桐生
            "race_number": 1,
            "race_title": "第1R 予選",
            "ai_prediction": [1, 3, 4],
            "result": [1, 3, 5],
            "boats": [
                {"racer_boat_number": i, "racer_name": f"選手{i}", "racer_class": "A1"}
                for i in range(1, 7)
            ]
        },
        {
            "race_date": today,
            "race_stadium_number": 2,  # 戸田
            "race_number": 2,
            "race_title": "第2R 予選",
            "ai_prediction": [2, 4, 6],
            "result": [3, 4, 5],
            "boats": [
                {"racer_boat_number": i, "racer_name": f"選手{i+6}", "racer_class": "B1"}
                for i in range(1, 7)
            ]
        }
    ]

# -----------------------------
# 会場別的中率算出
# -----------------------------
def calc_hit_rate_by_venue(history):
    venue_hits = defaultdict(lambda: {"hit": 0, "total": 0})
    for r in history:
        preds = r.get("ai_prediction", [])
        result = r.get("result", [])
        venue = str(r.get("race_stadium_number"))
        if preds and result:
            venue_hits[venue]["total"] += 1
            if any(p in result for p in preds):
                venue_hits[venue]["hit"] += 1
    # パーセンテージ化
    return {
        v: round((counts["hit"] / counts["total"]) * 100, 1)
        for v, counts in venue_hits.items() if counts["total"] > 0
    }

# -----------------------------
# メイン処理
# -----------------------------
def main():
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    yesterday_str = (datetime.date.today() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    # 既存データ読み込み
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = {}
    else:
        data = {}

    old_programs = data.get("programs", [])
    history = data.get("history", [])

    # 「本日」「前日」を残す
    programs = [r for r in old_programs if r.get("race_date") in [today_str, yesterday_str]]

    # 本日の新規データを取得
    fetched_today = fetch_race_data()

    # 本日分を上書き
    programs = [r for r in programs if r["race_date"] != today_str] + fetched_today

    # 履歴は蓄積
    history_dict = { (r["race_date"], r["race_stadium_number"], r["race_number"]): r for r in history }
    for r in fetched_today:
        key = (r["race_date"], r["race_stadium_number"], r["race_number"])
        history_dict[key] = r
    history = list(history_dict.values())

    # 会場別的中率
    stats = calc_hit_rate_by_venue(history)

    new_data = {
        "programs": programs,
        "stats": stats,   # 各24場別
        "history": history
    }

    # 保存
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

    print(f"保存完了: {len(programs)}件(本日+前日), 履歴={len(history)}件, 会場数={len(stats)}")

if __name__ == "__main__":
    main()