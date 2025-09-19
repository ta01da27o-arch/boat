import json
import datetime
import os

DATA_FILE = "data.json"

# -----------------------------
# 仮の外部データ取得（本番ではAPI置換）
# -----------------------------
def fetch_race_data():
    today = datetime.date.today().strftime("%Y-%m-%d")
    return [
        {
            "race_date": today,
            "race_stadium_number": 1,
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
            "race_stadium_number": 2,
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
# 的中率算出
# -----------------------------
def calc_hit_rate(races):
    if not races:
        return 0.0
    hit_count = 0
    for r in races:
        preds = r.get("ai_prediction", [])
        result = r.get("result", [])
        if preds and result and any(p in result for p in preds):
            hit_count += 1
    return round(hit_count / len(races) * 100, 1)

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

    old_programs = []
    if isinstance(data, dict) and "programs" in data:
        old_programs = data["programs"]

    # 既存データを仕分け
    today_data = [r for r in old_programs if r.get("race_date") == today_str]
    yesterday_data = [r for r in old_programs if r.get("race_date") == yesterday_str]

    # 今日の新規データを取得
    fetched_today = fetch_race_data()
    today_data = fetched_today  # 最新を上書き

    # 保存対象は today + yesterday のみ
    programs = today_data + yesterday_data

    # stats 算出
    stats = {
        "hit_rate": calc_hit_rate(programs)
    }

    new_data = {
        "programs": programs,
        "stats": stats
    }

    # 保存
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

    print(f"保存完了: {len(programs)} 件, 的中率={stats['hit_rate']}%")

if __name__ == "__main__":
    main()