import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

def main():
    # 特徴量データ読み込み
    df = pd.read_csv("features.csv")

    # --- 集計処理 ---
    grouped = df.groupby("racer_id").agg(
        avg_rank=("racer_place_number", "mean"),
        best_rank=("racer_place_number", "min"),
        worst_rank=("racer_place_number", "max"),
        race_count=("racer_place_number", "count")
    ).reset_index()

    # --- 学習用データセット作成 ---
    X = grouped[["avg_rank", "best_rank", "worst_rank", "race_count"]].fillna(0)
    y = (grouped["avg_rank"] <= 3).astype(int)  # 平均着順3位以内を「強い選手=1」と定義

    # データ分割
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # モデル学習
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # 精度表示
    acc = model.score(X_test, y_test)
    print(f"[INFO] モデル精度: {acc:.3f}")

    # モデル保存
    joblib.dump(model, "model.pkl")
    print("[INFO] モデルを model.pkl に保存しました")

if __name__ == "__main__":
    main()