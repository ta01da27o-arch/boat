import pandas as pd
import json
import os

# ==============================
# ⚙️ 設定
# ==============================
DATA_FILE = "data/history.json"       # 元データの保存先
FEATURES_FILE = "data/features.csv"   # 特徴量出力ファイル

# ==============================
# 🧠 特徴量生成関数
# ==============================
def make_features():
    if not os.path.exists(DATA_FILE):
        print(f"[ERROR] {DATA_FILE} がありません。履歴データが生成されているか確認して下さい。")
        return

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"[ERROR] JSON読み込み失敗: {e}")
        return

    records = []
    for race in data:
        boats = race.get("boats", [])
        for boat in boats:
            records.append({
                "race_date": race.get("race_date"),
                "race_stadium_number": race.get("race_stadium_number"),
                "race_number": race.get("race_number"),
                "racer_boat_number": boat.get("racer_boat_number"),
                "racer_start_timing": boat.get("racer_start_timing"),
                "racer_place_number": boat.get("racer_place_number"),
            })

    if not records:
        print("[WARN] 履歴データに有効なレコードがありません。特徴量ファイルは生成されません。")
        return

    df = pd.DataFrame(records)
    os.makedirs(os.path.dirname(FEATURES_FILE), exist_ok=True)
    df.to_csv(FEATURES_FILE, index=False, encoding="utf-8-sig")
    print(f"[INFO] 特徴量CSV出力: {len(df)}件 ({FEATURES_FILE})")

# ==============================
# 🚀 メイン実行
# ==============================
if __name__ == "__main__":
    make_features()