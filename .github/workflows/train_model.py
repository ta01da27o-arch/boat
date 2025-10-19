import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

FEATURES_FILE = "features.csv"
MODEL_FILE = "data/model.pkl"

# ⚠️ 空ファイルチェック
if not os.path.exists(FEATURES_FILE) or os.path.getsize(FEATURES_FILE) == 0:
    print("[WARN] features.csv が存在しないか空のため、学習をスキップします。")
    exit(0)

df = pd.read_csv(FEATURES_FILE)

# ⚠️ 必要カラムがない場合スキップ
required_cols = {"racer_start_timing", "racer_boat_number", "racer_place_number"}
if not required_cols.issubset(df.columns):
    print(f"[WARN] features.csv に必要な列がありません: {required_cols}")
    exit(0)

# === 学習処理 ===
X = df[["racer_start_timing", "racer_boat_number"]].fillna(0)
y = df["racer_place_number"].fillna(0).astype(int)

if len(X) == 0:
    print("[WARN] 特徴量データが空のため、学習をスキップします。")
    exit(0)

model = RandomForestClassifier(n_estimators=150, random_state=42)
model.fit(X, y)

os.makedirs("data", exist_ok=True)
joblib.dump(model, MODEL_FILE)

print(f"[INFO] モデル学習完了 ✅ 特徴量: {X.shape}, 保存先: {MODEL_FILE}")