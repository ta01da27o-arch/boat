import json
import pandas as pd

def build_features(history):
    features = []

    for date, daily in history.items():
        if not isinstance(daily, dict):
            print(f"[WARN] daily が dict ではありません: {type(daily)} -> {daily}")
            continue

        results = daily.get("results", [])
        if not isinstance(results, list):
            print(f"[WARN] results が list ではありません: {type(results)} -> {results}")
            continue

        for race in results:
            if not isinstance(race, dict):
                print(f"[WARN] race が dict ではありません: {type(race)} -> {race}")
                continue

            # レース情報
            race_date = race.get("race_date")
            stadium = race.get("race_stadium_number")
            race_no = race.get("race_number")
            wind = race.get("race_wind")
            wind_dir = race.get("race_wind_direction_number")
            wave = race.get("race_wave")
            weather = race.get("race_weather_number")
            temp = race.get("race_temperature")
            water_temp = race.get("race_water_temperature")
            technique = race.get("race_technique_number")

            boats = race.get("boats", [])
            if not isinstance(boats, list):
                print(f"[WARN] boats が list ではありません: {type(boats)} -> {boats}")
                continue

            for boat in boats:
                if not isinstance(boat, dict):
                    print(f"[WARN] boat が dict ではありません: {type(boat)} -> {boat}")
                    continue

                racer_id = boat.get("racer_number")
                racer_name = boat.get("racer_name")
                boat_no = boat.get("racer_boat_number")
                course_no = boat.get("racer_course_number")
                start_timing = boat.get("racer_start_timing")
                place = boat.get("racer_place_number")

                features.append({
                    "race_date": race_date,
                    "race_stadium_number": stadium,
                    "race_number": race_no,
                    "race_wind": wind,
                    "race_wind_direction_number": wind_dir,
                    "race_wave": wave,
                    "race_weather_number": weather,
                    "race_temperature": temp,
                    "race_water_temperature": water_temp,
                    "race_technique_number": technique,
                    "racer_id": racer_id,
                    "racer_name": racer_name,
                    "racer_boat_number": boat_no,
                    "racer_course_number": course_no,
                    "racer_start_timing": start_timing,
                    "racer_place_number": place
                })

    return pd.DataFrame(features)


def main():
    with open("history.json", "r", encoding="utf-8") as f:
        history = json.load(f)
    print(f"[INFO] 履歴データ読み込み完了: {len(history)} 日分")

    df_new = build_features(history)
    print(f"[INFO] 新規データ: {len(df_new)} 行")

    # CSVに保存
    try:
        df_old = pd.read_csv("features.csv")
        df_all = pd.concat([df_old, df_new]).drop_duplicates()
    except FileNotFoundError:
        df_all = df_new

    df_all.to_csv("features.csv", index=False, encoding="utf-8-sig")
    print(f"[INFO] 特徴量CSVを保存しました: {len(df_all)} 行")


if __name__ == "__main__":
    main()