import os
import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
from lightgbm import LGBMClassifier

# === 1. データの読み込み ===
def load_data(history_file="history.json"):
    if not os.path.exists(history_file):
        print(f"[ERROR] {history_file} が見つかりません。")
        return pd.DataFrame()

    with open(history_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    records = []
    # {日付: {results: [ {boats: [...]} ]}}
    for date, daily in data.items():
        for race in daily.get("results", []):
            race_meta = {
                "race_date": race.get("race_date"),
                "race_stadium_number": race.get("race_stadium_number"),
                "race_number": race.get("race_number"),
            }
            for b in race.get("boats", []):
                rec = race_meta.copy()
                rec.update({
                    "boat_number": b.get("racer_boat_number"),
                    "course": b.get("racer_course_number"),
                    "st": b.get("racer_start_timing"),
                    "result": b.get("racer_place_number"),  # ← ラベル
                    "racer_number": b.get("racer_number"),
                    "racer_name": b.get("racer_name"),
                })
                records.append(rec)

    return pd.DataFrame(records)

# === 2. 前処理 ===
def preprocess(df):
    df = df.dropna()
    # 今回はシンプルにスタートタイミング + コース番号で予測
    features = ["st", "course"]
    target = "result"
    df = df[[*features, target]].copy()
    return df, features, target

# === 3. 学習 ===
def train_model(df, features, target):
    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = LGBMClassifier(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=-1,
        num_leaves=31,
        random_state=42
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"[INFO] 学習完了: 精度 = {acc:.3f}")
    return model, acc

# === 4. モデル保存 ===
def save_model(model, out_path="model/model.pkl"):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(model, out_path)
    print(f"[INFO] モデルを保存しました → {out_path}")

# === 5. サマリー保存 ===
def save_summary(df, model, features, target, acc, out_path="summary.json"):
    summary = {
        "stats": {
            "records": len(df),
            "accuracy": round(acc, 3),
            "features": features
        },
        "samples": []
    }

    preds = model.predict(df[features])
    for i, row in df.head(50).iterrows():
        summary["samples"].append({
            "boat": int(row["boat_number"]),
            "prediction": int(preds[i]) if i < len(preds) else None,
            "result": int(row[target])
        })

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"[INFO] summary.json を保存しました → {out_path}")

# === メイン処理 ===
if __name__ == "__main__":
    print("[INFO] history.json 読み込み開始")
    df = load_data("history.json")

    if df.empty:
        print("[ERROR] history.json に有効なデータがありません。")
        exit(1)

    df, features, target = preprocess(df)
    model, acc = train_model(df, features, target)
    save_model(model, "model/model.pkl")
    save_summary(df, model, features, target, acc, "summary.json")