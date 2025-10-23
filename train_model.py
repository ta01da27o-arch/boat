# =========================================
# train_model.py
# 競艇AI予測モデル 自動再学習スクリプト
# =========================================
import os
import json
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

DATA_DIR = "data"
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
MODEL_FILE = os.path.join(DATA_DIR, "model.json")

# ---------------------------------------------------------
# データ読み込み
# ---------------------------------------------------------
def load_history():
    if not os.path.exists(HISTORY_FILE):
        print("⚠️ history.json が存在しません。")
        return None

    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        history = json.load(f)
    return history


# ---------------------------------------------------------
# 特徴量作成
# ---------------------------------------------------------
def build_dataset(history):
    X, y = [], []
    label_encoder = LabelEncoder()

    for date_str, venues in history.items():
        for venue, info in venues.items():
            for race in info.get("results", []):
                decision = race.get("決まり手", "").strip()
                if decision == "":
                    continue

                # 仮の特徴量生成（例: レース番号・場コードなど）
                race_no = race.get("race_no", 0)
                venue_code = hash(venue) % 100  # 簡易数値化

                first = int(race.get("1着", "0") or 0)
                second = int(race.get("2着", "0") or 0)
                third = int(race.get("3着", "0") or 0)

                features = [venue_code, race_no, first, second, third]
                X.append(features)
                y.append(decision)

    if not X:
        print("⚠️ 有効な履歴データが存在しません。")
        return None, None, None

    y_encoded = label_encoder.fit_transform(y)
    print(f"📊 データ件数: {len(X)}件 / 決まり手ラベル数: {len(label_encoder.classes_)}")

    return np.array(X), np.array(y_encoded), label_encoder


# ---------------------------------------------------------
# モデル学習
# ---------------------------------------------------------
def train_model(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print(f"✅ モデル学習完了: 精度 = {acc:.3f}")
    return model, acc


# ---------------------------------------------------------
# モデル保存
# ---------------------------------------------------------
def save_model(model, label_encoder, acc):
    model_data = {
        "accuracy": acc,
        "classes": label_encoder.classes_.tolist(),
        "trees": [tree.get_params() for tree in model.estimators_[:3]]  # 簡易保存
    }
    with open(MODEL_FILE, "w", encoding="utf-8") as f:
        json.dump(model_data, f, ensure_ascii=False, indent=2)
    print(f"💾 モデルを保存しました: {MODEL_FILE}")


# ---------------------------------------------------------
# メイン処理
# ---------------------------------------------------------
def main():
    print("🚀 AIモデル再学習を開始します...")
    history = load_history()
    if not history:
        return

    X, y, label_encoder = build_dataset(history)
    if X is None:
        return

    model, acc = train_model(X, y)
    save_model(model, label_encoder, acc)
    print("🎉 再学習プロセス完了！")


if __name__ == "__main__":
    main()