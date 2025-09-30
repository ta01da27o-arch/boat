import pandas as pd
import lightgbm as lgb
import joblib

FEATURES_FILE = "features.csv"
MODEL_FILE = "model.pkl"

def train():
    df = pd.read_csv(FEATURES_FILE)

    X = df[["course", "st", "recent_win_rate"]]
    y = df["rank"]

    # 欠損処理
    X = X.fillna(0)

    dtrain = lgb.Dataset(X, label=y)
    params = {
        "objective": "binary",
        "metric": "binary_logloss",
        "verbosity": -1,
    }

    model = lgb.train(params, dtrain, num_boost_round=100)
    joblib.dump(model, MODEL_FILE)
    print(f"[INFO] モデルを保存しました → {MODEL_FILE}")

if __name__ == "__main__":
    train()