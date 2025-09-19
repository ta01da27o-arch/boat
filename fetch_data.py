import json
import datetime
import os

DATA_FILE = "data.json"

# -----------------------------
# 仮データ取得関数（本番ではAPIなどで置き換え）
# -----------------------------
def fetch_race_data():
    # ここで実際には外部サイト/APIからデータを取得する
    # 今はサンプルとして固定値
    today = datetime.date.today().strftime("%Y-%m-%d")
    return [
        {
            "race_date": today,
            "race_stadium_number": 1,
            "race_number": 1,
            "ai_prediction": [1, 3],
            "result": [1, 3, 5]
        },
        {
            "race_date": today,
            "race_stadium_number": 2,
            "race_number": 2,
            "ai_prediction": [2, 4],
            "result": [3, 4, 5]
        }
    ]

# -----------------------------
# 的中率を計算
# -----------------------------
def calc_hit_rate(today_data, yesterday_data):
    all_races = today_data + yesterday_data
    if not all_races:
        return 0.0

    hit_count = 0
    for race in all_races:
        if any(pred in race.get("result", []) for pred in race.get("ai_prediction", [])):
            hit_count += 1
    return round((hit_count / len(all_races)) * 100, 1)

# -----------------------------
# メイン処理
# -----------------------------
def main():
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    yesterday_str = (datetime.date.today() - datetime.timedelta(days=1)).strftime("%Y-%m-%d")

    # 既存データを読み込み
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = {}
    else:
        data = {}

    today_data = []
    yesterday_data = []

    # 既存データを振り分け
    for key in ["today", "yesterday"]:
        if key in data:
            for race in data[key]:
                if race["race_date"] == today_str:
                    today_data.append(race)
                elif race["race_date"] == yesterday_str:
                    yesterday_data.append(race)

    # 今日のデータを取得
    fetched_today = fetch_race_data()
    today_data = fetched_today

    # 古いデータは自動削除（today と yesterday のみ残す）
    new_data = {
        "today": today_data,
        "yesterday": yesterday_data,
        "stats": {
            "hit_rate": calc_hit_rate(today_data, yesterday_data)
        }
    }

    # 保存
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()