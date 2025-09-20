import requests
import json
import datetime
import os

DATA_FILE = "data.json"
HISTORY_FILE = "history.json"

# ダミーAPI URL（実際は公式・外部データAPIに差し替え）
API_URL = "https://example.com/api/races"

def load_json(filename):
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_json(filename, data):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def fetch_race_data():
    # 本物は requests.get(API_URL).json() を使用
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)

    # ダミーデータ生成（テスト用）
    return {
        str(today): {
            "venue": "住之江",
            "races": [
                {"race_no": 1, "ai_prediction": ["1-2-3"], "ai_hit": True},
                {"race_no": 2, "ai_prediction": ["1-3-2"], "ai_hit": False}
            ]
        },
        str(yesterday): {
            "venue": "住之江",
            "races": [
                {"race_no": 1, "ai_prediction": ["2-1-3"], "ai_hit": True},
                {"race_no": 2, "ai_prediction": ["1-2-3"], "ai_hit": True}
            ]
        }
    }

def calc_ai_hit_results(all_data):
    results = {"global": {"hit": 0, "total": 0}, "venues": {}}

    for date, day_data in all_data.items():
        venue = day_data["venue"]
        if venue not in results["venues"]:
            results["venues"][venue] = {"hit": 0, "total": 0}

        for race in day_data["races"]:
            results["global"]["total"] += 1
            results["venues"][venue]["total"] += 1
            if race.get("ai_hit"):
                results["global"]["hit"] += 1
                results["venues"][venue]["hit"] += 1

    return results

def main():
    new_data = fetch_race_data()

    # 既存データの読み込み
    data = load_json(DATA_FILE)
    history = load_json(HISTORY_FILE)

    # data.json → 「本日」「前日」だけに更新
    today = str(datetime.date.today())
    yesterday = str(datetime.date.today() - datetime.timedelta(days=1))

    filtered_data = {}
    for d in [today, yesterday]:
        if d in new_data:
            filtered_data[d] = new_data[d]

    # 過去データを history.json に追加保存
    for d, content in new_data.items():
        if d not in [today, yesterday]:
            history[d] = content

    # AI的中率を算出
    ai_hit_results = calc_ai_hit_results(filtered_data)
    filtered_data["ai_hit_results"] = ai_hit_results

    # 保存
    save_json(DATA_FILE, filtered_data)
    save_json(HISTORY_FILE, history)

    print("✅ data.json 更新完了")
    print("✅ history.json 蓄積完了")

if __name__ == "__main__":
    main()