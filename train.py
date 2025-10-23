import pandas as pd
import json
import os

FEATURES_FILE = "features.csv"
MODEL_OUTPUT = "data.json"

def main():
    if not os.path.exists(FEATURES_FILE):
        raise FileNotFoundError(f"{FEATURES_FILE} が見つかりません")

    df = pd.read_csv(FEATURES_FILE, encoding="utf-8-sig")

    # デバッグ用: カラム一覧を出力
    print("[DEBUG] CSV カラム:", df.columns.tolist())

    # racer_id は存在しないので、racer_number を選手IDとして利用
    if "racer_number" not in df.columns:
        raise KeyError("features.csv に 'racer_number' カラムが存在しません")

    # 選手ごとの特徴量集計
    grouped = df.groupby("racer_number").agg(
        start_mean=("racer_start_timing", "mean"),
        place_mean=("racer_place_number", "mean"),
        races_count=("racer_number", "count"),
    ).reset_index()

    print(f"[INFO] 集計済み特徴量: {len(grouped)} 選手")

    # モデル用のスコア計算（仮のロジック）
    grouped["score"] = (
        (1 / (grouped["start_mean"].abs() + 0.01)) * 0.5 +
        (1 / (grouped["place_mean"] + 0.01)) * 0.5
    )

    # スコア順にソート
    grouped = grouped.sort_values("score", ascending=False)

    # JSON 出力形式を整形
    output = {
        "racer_stats": grouped.to_dict(orient="records")
    }

    with open(MODEL_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"[INFO] 出力完了 -> {MODEL_OUTPUT}")

if __name__ == "__main__":
    main()