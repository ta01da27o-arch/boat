import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

FEATURES_FILE = "features.csv"
MODEL_FILE = "model.pkl"

def main():
    # データ読み込み
    df = pd.read_csv(FEATURES_FILE)

    # 着順がラベル
    y = df["racer_place_number"]

    # 特徴量に使うカラム
    X = df[[
        "racer_course_number",
        "racer_start_timing",
        "race_wind",
        "race_wave",
        "race_temperature",
        "race_water_temperature"
    ]].fillna(0)

    # 学習データとテストデータに分割
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # ランダムフォレストで学習
    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42
    )
    model.fit(X_train, y_train)

    # テスト精度を表示
    acc = model.score(X_test, y_test)
    print(f"[INFO] テスト精度: {acc:.3f}")

    # モデルを保存
    joblib.dump(model, MODEL_FILE)
    print(f"[INFO] モデル保存完了 -> {MODEL_FILE}")

if __name__ == "__main__":
    main()