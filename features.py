import json
import pandas as pd
from pathlib import Path

def build_features(history):
    """
    history.json のデータを1行ごとの特徴量に変換する
    1レース × 6艇 → 6行
    """
    features = []

    # 日付ごと
    for date, daily in history.items():
        results = daily.get("results", [])
        for race in results:
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
            for boat in boats:
                racer_id = boat.get("racer_number")
                racer_name = boat.get("racer_name")
                boat_no = boat.get("racer_boat_number")
                course_no = boat.get("racer_course_number")
                start_timing = boat.get("racer_start_timing")
                place = boat.get("racer_place_number")

                features.append({
                    # レース情報
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
                    # 選手情報
                    "racer_id": racer_id,
                    "racer_name": racer_name,
                    "racer_boat_number": boat_no,
                    "racer_course_number": course_no,
                    "racer_start_timing": start_timing,
                    "racer_place_number": place
                })

    return pd.DataFrame(features)


def main():
    history_path = Path("history.json")
    features_path = Path("features.csv")

    if not history_path.exists():
        print("[ERROR] history.json が存在しません")
        return

    # JSON読み込み
    with open(history_path, "r", encoding="utf-8") as f:
        history = json.load(f)

    if not isinstance(history, dict):
        print("[ERROR] history.json の形式が想定外です（dictではない）")
        return

    print(f"[INFO] 履歴データ読み込み完了: {len(history)} 日分")

    # 特徴量生成
    df_new = build_features(history)

    if df_new.empty:
        print("[WARNING] 特徴量が生成されませんでした")
        return

    # 既存CSVがあれば追記（重複削除）
    if features_path.exists():
        df_old = pd.read_csv(features_path)
        df_all = pd.concat([df_old, df_new], ignore_index=True)
        df_all.drop_duplicates(
            subset=["race_date", "race_stadium_number", "race_number", "racer_id"],
            keep="last",
            inplace=True
        )
    else:
        df_all = df_new

    # 保存
    df_all.to_csv(features_path, index=False, encoding="utf-8")
    print(f"[INFO] 特徴量を features.csv に保存しました (累計件数: {len(df_all)})")


if __name__ == "__main__":
    main()