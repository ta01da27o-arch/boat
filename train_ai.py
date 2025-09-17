import os
import glob
import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
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
    # 必要に応じて特徴量を選択
    features = ["st", "weight", "course", "ranking"]  # 仮のカラム名
    target = "result"  # 勝ち負けなどのラベル
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
    return model

# === 4. 保存 ===
def save_model(model, out_path="model/model.pkl"):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    joblib.dump(model, out_path)
    print(f"[INFO] モデルを保存しました → {out_path}")

# === メイン処理 ===
if __name__ == "__main__":
    print("[INFO] データ読み込み開始")
    df = load_data("data")

    if df.empty:
        print("[ERROR] データがありません。data/ 以下にJSONを置いてください。")
        exit(1)

    df, features, target = preprocess(df)
    model = train_model(df, features, target)
    save_model(model, "model/model.pkl")