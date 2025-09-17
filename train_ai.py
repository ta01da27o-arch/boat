import os
import glob
import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# === 1. データの読み込み ===
def load_data(data_dir="data"):
    files = glob.glob(os.path.join(data_dir, "*.json"))
    records = []
    for f in files:
        try:
            with open(f, "r", encoding="utf-8") as fp:
                d = json.load(fp)
                if isinstance(d, list):
                    records.extend(d)
        except Exception as e:
            print(f"[WARN] {f} の読み込みに失敗: {e}")
    return pd.DataFrame(records)

# === 2. 前処理 (例: 数値化と欠損除去) ===
def preprocess(df):
    df = df.dropna()
    # 必要に応じて特徴量を選択（あなたのデータに合わせて修正してOK）
    features = ["st", "weight", "course", "ranking"]  # 仮のカラム名
    target = "result"  # 予測したいラベル（例: 1着艇）
    df = df[[*features, target]].copy()
    return df, features, target

# === 3. 学習 ===
def train_model(df, features, target):
    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        random_state=42
    )
    model.fit(X_train, y_train)

    acc = model.score(X_test, y_test)
    print(f"[INFO] 学習完了: 精度 = {acc:.3f}")
    return model, acc

# === 4. モデル保存 ===
def save_model(model, out_path="model/model.pkl"):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(model, out_path)
    print(f"[INFO] モデルを保存しました → {out_path}")

# === 5. サマリー保存 ===
def save_summary(df, model, features, target, acc, out_path="summary.json"):
    # 全体統計
    summary = {
        "stats": {
            "races": len(df),
            "accuracy": round(acc, 3),
            "features": features
        },
        # レースごとの一部データ（例: 最新50件）
        "races": []
    }

    preds = model.predict(df[features])
    for i, row in df.head(50).iterrows():
        summary["races"].append({
            "index": int(i),
            "prediction": int(preds[i]) if i < len(preds) else None,
            "result": int(row[target])
        })

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"[INFO] summary.json を保存しました → {out_path}")

# === メイン処理 ===
if __name__ == "__main__":
    print("[INFO] データ読み込み開始")
    df = load_data("data")

    if df.empty:
        print("[ERROR] データがありません。data/ 以下にJSONを置いてください。")
        exit(1)

    df, features, target = preprocess(df)
    model, acc = train_model(df, features, target)
    save_model(model, "model/model.pkl")
    save_summary(df, model, features, target, acc, "summary.json")