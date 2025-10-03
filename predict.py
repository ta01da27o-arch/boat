import pandas as pd
import joblib

FEATURES_FILE = "features.csv"
MODEL_FILE = "model.pkl"

def main():
    # モデル読み込み
    model = joblib.load(MODEL_FILE)

    # データ読み込み
    df = pd.read_csv(FEATURES_FILE)

    # 特徴量
    X = df[[
        "racer_course_number",
        "racer_start_timing",
        "race_wind",
        "race_wave",
        "race_temperature",
        "race_water_temperature"
    ]].fillna(0)

    # 予測
    preds = model.predict(X)
    df["predicted_place"] = preds

    # 出力サンプル
    for _, row in df.head(20).iterrows():
        print(f"{row['race_date']} 競艇場:{row['race_stadium_number']} "
              f"R{row['race_number']} {row['racer_name']} "
              f"(艇番:{row['racer_boat_number']}, コース:{row['racer_course_number']}) "
              f"=> 予測順位: {row['predicted_place']} 着")

    # 保存（必要なら JSON で出力も可）
    df.to_csv("predictions.csv", index=False, encoding="utf-8-sig")
    print("[INFO] 予測結果を predictions.csv に保存しました")

if __name__ == "__main__":
    main()