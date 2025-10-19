import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# ==============================
# ⚙️ 設定
# ==============================
FEATURES_FILE = "data/features.csv"
MODEL_FILE = "data/model.pkl"

# ==============================
# 🧠 モデル学習処理
# ==============================
if not os.path.exists(FEATURES_FILE):
    print(f"[ERROR] {FEATURES_FILE} が存在しません。特徴量生成が行われたか確認してください。")
    exit(1)

df = pd.read_csv(FEATURES_FILE)
if df.empty:
    print(f"[ERROR] {FEATURES_FILE} が空です。")
    exit(1)

# 使用する特徴量と目的変数
X = df[["racer_start_timing", "racer_boat_number"]].fillna(0)
y = df["racer_place_number"].fillna(0).astype(int)

# モデル構築
model = RandomForestClassifier(
    n_estimators=150,
    max_depth=None,
    random_state=42,
    n_jobs=-1
)

# 学習
model.fit(X, y)

# モデル保存
os.makedirs(os.path.dirname(MODEL_FILE), exist_ok=True)
joblib.dump(model, MODEL_FILE)

print(f"[INFO] モデル学習完了 ✅ 特徴量数: {X.shape[1]}, 学習データ数: {X.shape[0]}")
print(f"[INFO] 保存先: {MODEL_FILE}")