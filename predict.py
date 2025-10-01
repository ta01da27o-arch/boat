import pandas as pd
import joblib

FEATURES_FILE = "features.csv"
MODEL_FILE = "model.pkl"

def load_features():
    df = pd.read_csv(FEATURES_FILE)
    if "racer_number" not in df.columns:
        raise ValueError("features.csv に 'racer_number' が存在しません。features.py を修正してください。")
    return df.set_index("racer_number")

def main():
    df = load_features()
    model = joblib.load(MODEL_FILE)

    # 直近のレースを予測対象にする（例：最後のレコード6艇分）
    target = df.tail(6)
    X = target[["racer_course_number", "racer_start_timing", "race_wind", "race_wave", "race_weather_number"]].fillna(0)
    preds = model.predict(X)

    for (racer_id, row), pred in zip(target.iterrows(), preds):
        print(f"選手番号: {racer_id} ({row['racer_name']}) -> 予測着順: {pred}")

if __name__ == "__main__":
    main()