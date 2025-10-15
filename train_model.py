import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

df = pd.read_csv("features.csv")
X = df[["racer_start_timing", "racer_boat_number"]].fillna(0)
y = df["racer_place_number"].fillna(0).astype(int)

model = RandomForestClassifier(n_estimators=150, random_state=42)
model.fit(X, y)
joblib.dump(model, "model.pkl")

print(f"[INFO] モデル学習完了、特徴量: {X.shape}, 精度未評価")