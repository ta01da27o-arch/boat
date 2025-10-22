# =======================================
# train_model.py — AI自動学習スクリプト
# =======================================
import json
import os
import pickle
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

DATA_DIR = "data"
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
MODEL_FILE = os.path.join(DATA_DIR, "model.pkl")

def load_history_as_dataframe():
    """history.jsonをDataFrame化"""
    if not os.path.exists(HISTORY_FILE):
        raise FileNotFoundError("❌ history.json が見つかりません。")

    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        history = json.load(f)

    rows = []
    for date, venues in history.items():
        for venue_name, venue_data in venues.items():
            for race in venue_data.get("races", []):
                for boat in race.get("boats", []):
                    if not boat:
                        continue
                    rows.append({
                        "date": date,
                        "venue": venue_name,
                        "race_no": race["race_no"],
                        "boat_number": boat.get("boat_number"),
                        "start_timing": boat.get("start_timing") or 0.2,
                        "racer_class": 1 if boat.get("racer_class") == "A1" else 0,
                    })

    df = pd.DataFrame(rows)
    return df

def train_and_save_model():
    df = load_history_as_dataframe()
    print(f"📊 データ件数: {len(df)}")

    if len(df) < 100:
        print("⚠️ データ不足のため学習をスキップします。")
        return

    # 特徴量・目的変数
    X = df[["boat_number", "start_timing", "racer_class"]]
    # 仮の目的変数（例: 舟番1が勝つ確率を分類）
    y = (df["boat_number"] == 1).astype(int)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    acc = model.score(X_test, y_test)
    print(f"✅ 学習完了 (精度: {acc:.3f})")

    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model, f)

    print(f"💾 モデル保存完了: {MODEL_FILE}")

if __name__ == "__main__":
    train_and_save_model()