import pandas as pd
import joblib

df = pd.read_csv("features.csv")
model = joblib.load("model.pkl")

X = df[["racer_start_timing", "racer_boat_number"]].fillna(0)
df["predicted_place"] = model.predict(X)

df.to_csv("predictions.csv", index=False, encoding="utf-8-sig")
print("[INFO] 予測結果を保存しました: predictions.csv")