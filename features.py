import pandas as pd
import json
import os

HISTORY_FILE = "history_data.json"
TODAY_FILE = "data.json"
FEATURES_FILE = "features.csv"

def load_json(file_path):
    if not os.path.exists(file_path):
        print(f"[WARN] {file_path} が見つかりません。スキップします。")
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception as e:
        print(f"[ERROR] {file_path} の読み込みに失敗: {e}")
        return []

def make_features():
    # 両方読み込む
    history_data = load_json(HISTORY_FILE)
    today_data = load_json(TODAY_FILE)

    all_data = history_data + today_data
    if not all_data:
        print("[WARN] 履歴・本日データともに空です。")
        all_data = []

    records = []
    for race in all_data:
        for boat in race.get("boats", []):
            records.append({
                "race_date": race.get("race_date"),
                "race_stadium_number": race.get("race_stadium_number"),
                "race_number": race.get("race_number"),
                "racer_boat_number": boat.get("racer_boat_number", 0),
                "racer_start_timing": boat.get("racer_start_timing", 0.0),
                "racer_place_number": boat.get("racer_place_number", 0)
            })

    if not records:
        # ダミーデータ1行（空対策）
        print("[WARN] 有効なレコードがありません。ダミーデータを生成します。")
        records = [{
            "race_date": "0000-00-00",
            "race_stadium_number": 0,
            "race_number": 0,
            "racer_boat_number": 0,
            "racer_start_timing": 0.0,
            "racer_place_number": 0
        }]

    df = pd.DataFrame(records)
    df.to_csv(FEATURES_FILE, index=False, encoding="utf-8-sig")
    print(f"[INFO] 特徴量CSV出力: {len(df)}件 → {FEATURES_FILE}")

if __name__ == "__main__":
    make_features()