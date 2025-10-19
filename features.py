import json
import pandas as pd
import os

HISTORY_PATH = "data/history.json"
DATA_PATH = "data/data.json"
FEATURES_PATH = "data/features.csv"

def load_json(path):
    if not os.path.exists(path):
        print(f"[WARN] {path} が見つかりません。スキップします。")
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] {path} の読み込みに失敗: {e}")
        return []

def main():
    print("🧩 Generating features...")

    # データ読み込み
    history = load_json(HISTORY_PATH)
    today = load_json(DATA_PATH)

    # 両方空の場合
    if not history and not today:
        print("[WARN] 履歴・本日データともに空です。")
        dummy = [{"race": 1, "venue": "桐生", "wind": 2.0, "wave": 1.0, "date": "20250101"}]
        df = pd.DataFrame(dummy)
        df.to_csv(FEATURES_PATH, index=False)
        print(f"[INFO] 特徴量CSV出力: {len(df)}件 → {FEATURES_PATH}")
        return

    # 結合
    combined = history + today
    df = pd.DataFrame(combined)

    # 余分な列の除外・特徴量生成（例）
    if "date" in df.columns:
        df["date"] = df["date"].astype(str)
    df["wind_wave_ratio"] = df["wind"] / (df["wave"] + 0.1)

    # CSV保存
    df.to_csv(FEATURES_PATH, index=False)
    print(f"[INFO] 特徴量CSV出力: {len(df)}件 → {FEATURES_PATH}")

if __name__ == "__main__":
    main()