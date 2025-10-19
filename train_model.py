import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

FEATURES_FILE = "features.csv"
MODEL_FILE = "model.pkl"

if not os.path.exists(FEATURES_FILE):
    raise FileNotFoundError(f"Error:  {FEATURES_FILE} が存在しません。特徴量生成が行われたか確認してください。")

df = pd.read_csv(FEATURES_FILE)
if df.empty:
    raise ValueError("Error: 特徴量CSVが空です。データ取得処理を確認してください。")

X = df[["racer_start_timing", "racer_boat_number"]].fillna(0)
y = df["racer_place_number"].fillna(0).astype(int)

model = RandomForestClassifier(n_estimators=150, random_state=42)
model.fit(X, y)
joblib.dump(model, MODEL_FILE)

print(f"[INFO] モデル学習完了 ✅ 特徴量数: {X.shape[1]}, 学習データ数: {len(df)}")