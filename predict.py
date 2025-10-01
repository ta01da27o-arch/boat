import pandas as pd
import pickle

FEATURES_FILE = "features.csv"
MODEL_FILE = "model.pkl"

def load_features():
    # 特徴量CSV読み込み
    df = pd.read_csv(FEATURES_FILE)

    # ✅ 修正: 'racer_id' → 'racer_number'
    grouped = df.groupby("racer_number").agg(
        avg_rank=("racer_place_number", "mean"),
        best_rank=("racer_place_number", "min"),
        worst_rank=("racer_place_number", "max"),
        race_count=("racer_place_number", "count")
    ).reset_index()

    X = grouped[["avg_rank", "best_rank", "worst_rank", "race_count"]].fillna(0)
    return grouped, X

def main():
    # 特徴量データ
    grouped, X = load_features()

    # モデル読み込み
    with open(MODEL_FILE, "rb") as f:
        model = pickle.load(f)

    # 予測
    preds = model.predict_proba(X)[:, 1]  # 「強い選手」の確率

    # 出力用データフレーム
    result_df = grouped[["racer_number"]].copy()
    result_df["avg_rank"] = grouped["avg_rank"]
    result_df["strength_prob"] = preds

    # ソートして上位を表示
    result_df = result_df.sort_values("strength_prob", ascending=False)

    print("[INFO] 予測結果 (上位10人)")
    print(result_df.head(10).to_string(index=False))

if __name__ == "__main__":
    main()