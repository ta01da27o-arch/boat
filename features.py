# features.py（修正版）
import json
import pandas as pd
from collections import defaultdict
from datetime import datetime

HISTORY_FILE = "history.json"
FEATURES_FILE = "features.csv"

def load_history():
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def build_features(history, recent_n=20):
    """
    選手ごとに直近N走の特徴量を生成
    """
    races_by_racer = defaultdict(list)

    for date_key, content in history.items():
        for race in content.get("results", []):
            race_date = datetime.strptime(race["race_date"], "%Y-%m-%d")
            for boat in race.get("boats", []):
                place = boat.get("racer_place_number", 0)
                if place > 0:  # 順位データあり
                    races_by_racer[boat["racer_number"]].append({
                        "date": race_date,
                        "rank": place,
                        "start": boat.get("racer_start_timing", 0.2)
                    })

    feature_rows = []
    for racer_id, results in races_by_racer.items():
        results = sorted(results, key=lambda x: x["date"], reverse=True)[:recent_n]
        if not results:
            continue

        total = len(results)
        firsts = sum(1 for r in results if r["rank"] == 1)
        seconds = sum(1 for r in results if r["rank"] == 2)
        thirds = sum(1 for r in results if r["rank"] == 3)
        avg_rank = sum(r["rank"] for r in results) / total
        avg_start = sum(r["start"] for r in results) / total

        feature_rows.append({
            "racer_number": racer_id,
            "total_races": total,
            "win_rate": firsts / total,
            "place2_rate": (firsts + seconds) / total,
            "place3_rate": (firsts + seconds + thirds) / total,
            "avg_rank": avg_rank,
            "avg_start": avg_start,
            "target": 1 if firsts > 0 else 0
        })

    return pd.DataFrame(feature_rows)

def main():
    history = load_history()
    df = build_features(history, recent_n=20)
    df.to_csv(FEATURES_FILE, index=False)
    print(f"特徴量を {FEATURES_FILE} に保存しました。 {len(df)} 選手分")

if __name__ == "__main__":
    main()