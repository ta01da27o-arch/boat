import pandas as pd
import json
import os

DATA_FILE = "data.json"
FEATURES_FILE = "features.csv"

def load_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict) and "results" in data:
        data = data["results"]

    return data

def make_features():
    data = load_data()
    records = []

    for race in data:
        race_date = race.get("race_date")
        stadium = race.get("race_stadium_number")
        number = race.get("race_number")

        for boat in race.get("boats", []):
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

    df = pd.DataFrame(records)
    df.to_csv(FEATURES_FILE, index=False, encoding="utf-8-sig")
    print(f"[INFO] 特徴量CSVを保存しました: {len(df)} 行 -> {FEATURES_FILE}")
    return df

if __name__ == "__main__":
    make_features()