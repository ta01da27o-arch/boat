import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

FEATURES_FILE = "features.csv"
MODEL_FILE = "model.pkl"

def main():
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

    # 目的変数: 順位 (1, 2, 3, 4, 5, 6)
    y = df["racer_place_number"].fillna(0).astype(int)

    # データ分割
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ランダムフォレスト (多クラス分類)
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    # 精度を表示
    acc = model.score(X_test, y_test)
    print(f"[INFO] モデル精度: {acc:.3f}")

    # 保存
    joblib.dump(model, MODEL_FILE)
    print(f"[INFO] モデルを保存しました → {MODEL_FILE}")

if __name__ == "__main__":
    main()