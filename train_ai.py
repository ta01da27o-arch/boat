import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

FEATURES_FILE = "features.csv"
MODEL_FILE = "model.pkl"

def train():
    df = pd.read_csv(FEATURES_FILE)

    # 特徴量とターゲット
    X = df[["racer_course_number", "racer_start_timing", "race_wind", "race_wave", "race_weather_number"]].fillna(0)
    y = df["racer_place_number"].fillna(0)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    acc = model.score(X_test, y_test)
    print(f"[INFO] モデル精度: {acc:.3f}")

    joblib.dump(model, MODEL_FILE)
    print(f"[INFO] モデルを保存しました -> {MODEL_FILE}")

if __name__ == "__main__":
    train()