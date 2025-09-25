# prepare_dataset.py
import json
import csv
from pathlib import Path

HISTORY_FILE = Path("history.json")
OUTPUT_FILE = Path("dataset.csv")

def load_history():
    if not HISTORY_FILE.exists():
        print("❌ history.json が存在しません。先に fetch_history.py を実行してください。")
        return None
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def extract_features(history_data):
    dataset = []
    for date, races in history_data.items():
        for race_id, race_data in races.items():
            try:
                venue = race_data.get("place", "")
                weather = race_data.get("weather", "")
                water_condition = race_data.get("waterCondition", "")
                for entry in race_data.get("entries", []):
                    row = {
                        "date": date,
                        "race_id": race_id,
                        "venue": venue,
                        "weather": weather,
                        "water_condition": water_condition,
                        "player_id": entry.get("id"),
                        "player_name": entry.get("name"),
                        "course": entry.get("course"),
                        "st_time": entry.get("st"),
                        "kimarite": entry.get("kimarite", ""),
                        "rank": entry.get("rank"),
                    }
                    dataset.append(row)
            except Exception as e:
                print(f"⚠️ データ処理中にエラー: {e}")
                continue
    return dataset

def save_dataset(dataset):
    if not dataset:
        print("❌ 保存対象データがありません。")
        return
    fieldnames = list(dataset[0].keys())
    with open(OUTPUT_FILE, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(dataset)
    print(f"✅ 学習用データを保存しました → {OUTPUT_FILE}")

if __name__ == "__main__":
    history = load_history()
    if history:
        dataset = extract_features(history)
        save_dataset(dataset)