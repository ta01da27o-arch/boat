import os
import json
import joblib
import numpy as np
import pandas as pd
from glob import glob
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

DATA_DIR = "data"
MODEL_DIR = "model"
os.makedirs(MODEL_DIR, exist_ok=True)

# --- データをロード ---
def load_data():
    races = []
    for file in glob(os.path.join(DATA_DIR, "*.json")):
        with open(file, "r", encoding="utf-8") as f:
            try:
                races.extend(json.load(f))
            except:
                continue
    return races

# --- 特徴量を作成 ---
def extract_features(race):
    """
    1レース分の boats, result から特徴量とラベルを作成
    """
    features = []
    labels = []

    boats = race.get("boats", [])
    result = race.get("result", [])

    if not boats or not result:
        return features, labels

    for b in boats:
        # number: 1〜6
        num = b.get("number", 0)

        # --- サンプル特徴量 ---
        # 今は boat 番号だけを使うが、拡張で展示タイム・モーター勝率などを追加可能
        feat = [
            num,                # 枠番
            1 if num == 1 else 0,  # 1号艇フラグ
            1 if num <= 3 else 0   # 内枠フラグ
        ]

        features.append(feat)

        # --- 正解ラベル ---
        try:
            rank = result.index(num) + 1  # 順位
        except ValueError:
            continue
        labels.append(1 if rank == 1 else 0)  # 1着=1, それ以外=0

    return features, labels

# --- メイン処理 ---
def main():
    races = load_data()
    X, y = [], []

    for race in races:
        feats, labels = extract_features(race)
        X.extend(feats)
        y.extend(labels)

    if not X:
        print("❌ 学習データがありません")
        return

    X = np.array(X)
    y = np.array(y)

    # --- 学習 ---
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestClassifier(
        n_estimators=200, max_depth=10, random_state=42
    )
    model.fit(X_train, y_train)

    # --- 評価 ---
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"✅ モデル学習完了 精度: {acc*100:.2f}%")

    # --- 保存 ---
    joblib.dump(model, os.path.join(MODEL_DIR, "model.pkl"))

if __name__ == "__main__":
    main()