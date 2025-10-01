import json
import pandas as pd
from pathlib import Path

def build_features(history, recent_n=20):
    """
    履歴データから特徴量を生成する
    history: list of dict
    """
    features = []
    for h in history:
        if not isinstance(h, dict):
            continue  # dict 以外は無視

        places = h.get("places", [])
        racer_ids = h.get("racer_ids", [])
        racer_names = h.get("racer_names", [])

        for i, (rid, name) in enumerate(zip(racer_ids, racer_names)):
            recent_places = places[:recent_n] if places else []
            if not recent_places or all(p is None for p in recent_places):
                continue

            valid_places = [p for p in recent_places if p is not None]
            if not valid_places:
                continue

            avg_rank = sum(valid_places) / len(valid_places)
            best_rank = min(valid_places)
            worst_rank = max(valid_places)

            features.append({
                "racer_id": rid,
                "racer_name": name,
                "avg_rank": avg_rank,
                "best_rank": best_rank,
                "worst_rank": worst_rank,
                "race_count": len(valid_places),
            })

    return pd.DataFrame(features)


def main():
    history_path = Path("history.json")
    features_path = Path("features.csv")

    if not history_path.exists():
        print("[ERROR] history.json が存在しません")
        return

    with open(history_path, "r", encoding="utf-8") as f:
        history = json.load(f)

    # 🔧 list[str] の場合は必ず dict に変換
    if history and isinstance(history[0], str):
        print("[INFO] history.json 内のデータを再パースします (list[str] → list[dict])")
        try:
            history = [json.loads(h) for h in history]
        except Exception as e:
            print(f"[ERROR] history.json の再パースに失敗しました: {e}")
            return

    print(f"[INFO] 履歴データ読み込み完了: {len(history)} 件 (dict型に変換済み)")

    df_new = build_features(history, recent_n=20)

    if df_new.empty:
        print("[WARNING] 特徴量が作成できませんでした → 追記せず終了します")
        return

    # 既存の features.csv を読み込んで追記
    if features_path.exists():
        df_old = pd.read_csv(features_path)
        df_all = pd.concat([df_old, df_new], ignore_index=True)
        df_all = df_all.drop_duplicates(subset=["racer_id", "race_count"], keep="last")
    else:
        df_all = df_new

    df_all.to_csv(features_path, index=False, encoding="utf-8")
    print(f"[INFO] 特徴量を features.csv に保存しました (累計件数: {len(df_all)})")


if __name__ == "__main__":
    main()