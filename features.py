import json
import pandas as pd
from pathlib import Path


def build_features(history, recent_n=20):
    """
    選手ごとの過去レース結果から特徴量を生成
    recent_n: 直近何走分を対象にするか
    """
    rows = []
    for h in history:
        places = h.get("places", [])
        features = {}
        valid_places = []

        # 直近 recent_n レース分を対象
        for place in places[-recent_n:]:
            # None や空文字はスキップ
            if place is None:
                continue
            if isinstance(place, str):
                # "失格" "欠場" など数字以外は無視
                if not place.isdigit():
                    continue
                place = int(place)

            try:
                p = int(place)
            except Exception:
                continue

            if p > 0:  # 1着以上なら有効
                valid_places.append(p)

        # 特徴量を計算
        if valid_places:
            features["avg_rank"] = sum(valid_places) / len(valid_places)
            features["best_rank"] = min(valid_places)
            features["worst_rank"] = max(valid_places)
            features["race_count"] = len(valid_places)
        else:
            # データなし → ダミー値
            features["avg_rank"] = None
            features["best_rank"] = None
            features["worst_rank"] = None
            features["race_count"] = 0

        # 選手IDなど基本情報を保持
        features["racer_id"] = h.get("racer_id")
        features["racer_name"] = h.get("racer_name")

        rows.append(features)

    return pd.DataFrame(rows)


def main():
    # history.json を読み込み
    history_path = Path("history.json")
    if not history_path.exists():
        print("[ERROR] history.json が存在しません")
        return

    with open(history_path, "r", encoding="utf-8") as f:
        history = json.load(f)

    print(f"[INFO] 履歴データ読み込み完了: {len(history)} 件")

    # 特徴量生成
    df = build_features(history, recent_n=20)

    # CSV 出力
    df.to_csv("features.csv", index=False, encoding="utf-8")
    print(f"[INFO] 特徴量を features.csv に保存しました (件数: {len(df)})")


if __name__ == "__main__":
    main()