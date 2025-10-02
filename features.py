import pandas as pd
import json
import os

DATA_FILE = "data.json"
FEATURES_FILE = "features.csv"

def load_data():
    if not os.path.exists(DATA_FILE):
        print(f"[ERROR] {DATA_FILE} が存在しません")
        return []

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # data.json の形式に合わせて変換
    if isinstance(data, dict):
        if "results" in data:
            data = data["results"]
        elif "data" in data:
            data = data["data"]

    if not isinstance(data, list):
        print("[ERROR] data.json の形式が不正です")
        return []

    return data

def make_features():
    data = load_data()
    if not data:
        print("[ERROR] データが空のためCSV生成できません")
        return None

    records = []
    for race in data:
        race_date = race.get("race_date")
        stadium = race.get("race_stadium_number")
        number = race.get("race_number")

        boats = race.get("boats", [])
        if not boats:
            continue

        for boat in boats:
            record = {
                "race_date": race_date,
                "race_stadium_number": stadium,
                "race_number": number,
                "race_wind": race.get("race_wind"),
                "race_wind_direction_number": race.get("race_wind_direction_number"),
                "race_wave": race.get("race_wave"),
                "race_weather_number": race.get("race_weather_number"),
                "race_temperature": race.get("race_temperature"),
                "race_water_temperature": race.get("race_water_temperature"),
                "race_technique_number": race.get("race_technique_number"),
                "racer_boat_number": boat.get("racer_boat_number"),
                "racer_course_number": boat.get("racer_course_number"),
                "racer_start_timing": boat.get("racer_start_timing"),
                "racer_place_number": boat.get("racer_place_number"),
                "racer_number": boat.get("racer_number"),
                "racer_name": boat.get("racer_name"),
            }
            records.append(record)

    if not records:
        print("[ERROR] 変換できるデータがありません")
        return None

    df = pd.DataFrame(records)
    df.to_csv(FEATURES_FILE, index=False, encoding="utf-8-sig")
    print(f"[INFO] 特徴量CSVを保存しました: {len(df)} 行 -> {FEATURES_FILE}")
    print(f"[DEBUG] CSV カラム: {list(df.columns)}")
    return df

if __name__ == "__main__":
    make_features()