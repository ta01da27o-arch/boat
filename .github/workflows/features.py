import pandas as pd
import json
import os

# 📁 ファイルパス
DATA_FILE = "data/history.json"  # ← 実際の構成に合わせて修正
FEATURES_FILE = "features.csv"

def make_features():
    if not os.path.exists(DATA_FILE):
        print(f"[ERROR] {DATA_FILE} がありません")
        return

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f"[ERROR] JSON読み込み失敗: {e}")
            return

    if not data or len(data) == 0:
        print("[WARN] 履歴データが空のため、特徴量を生成できません。")
        return

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

    if not records:
        print("[WARN] 有効なボートデータが見つかりません。")
        return

    df = pd.DataFrame(records)
    df.to_csv(FEATURES_FILE, index=False, encoding="utf-8-sig")
    print(f"[INFO] 特徴量CSV出力: {len(df)}件")

if __name__ == "__main__":
    make_features()