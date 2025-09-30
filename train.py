# train.py
import pandas as pd
import lightgbm as lgb
import joblib

FEATURES_FILE = "features.csv"
MODEL_FILE = "model.pkl"

def main():
    df = pd.read_csv(FEATURES_FILE)
    if df.empty:
        print("特徴量データがありません。学習をスキップします。")
        return

    X = df[["total_races", "win_rate", "place2_rate", "place3_rate", "avg_rank", "avg_start"]]
    y = df["target"]

    train_data = lgb.Dataset(X, label=y)
    params = {
        "objective": "binary",
        "metric": "auc",
        "learning_rate": 0.05,
        "num_leaves": 31,
        "verbose": -1
    }

    model = lgb.train(params, train_data, num_boost_round=100)
    joblib.dump(model, MODEL_FILE)
    print(f"モデルを保存しました: {MODEL_FILE}")

if __name__ == "__main__":
    main()