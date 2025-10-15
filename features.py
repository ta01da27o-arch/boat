import pandas as pd
import json
import os

DATA_FILE = "history_data.json"
FEATURES_FILE = "features.csv"

def make_features():
    if not os.path.exists(DATA_FILE):
        print(f"[ERROR] {DATA_FILE} がありません")
        return

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = []
    for race in data:
        for boat in race.get("boats", []):
            records.append({
                "race_date": race.get("race_date"),
                "race_stadium_number": race.get("race_stadium_number"),
                "race_number": race.get("race_number"),
                "racer_boat_number": boat.get("racer_boat_number"),
                "racer_start_timing": boat.get("racer_start_timing"),
                "racer_place_number": boat.get("racer_place_number"),
            })

    df = pd.DataFrame(records)
    df.to_csv(FEATURES_FILE, index=False, encoding="utf-8-sig")
    print(f"[INFO] 特徴量CSV出力: {len(df)}件")

if __name__ == "__main__":
    make_features()