import json
import pandas as pd
from datetime import datetime

HISTORY_FILE = "history.json"
FEATURES_FILE = "features.csv"

def load_history():
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def build_features(history, max_races=20):
    rows = []
    for date_str, rec in history.items():
        for race in rec.get("results", []):
            for entry in race.get("entries", []):
                pid = entry.get("player_id")
                if not pid:
                    continue

                # 直近成績（最大20走）
                past = entry.get("recent", [])[-max_races:]
                ranks = [p.get("rank") for p in past if isinstance(p, dict)]
                wins = sum(1 for r in ranks if r == 1)
                races = len(ranks)

                rows.append({
                    "date": date_str,
                    "player_id": pid,
                    "course": entry.get("course"),
                    "st": float(entry.get("st")) if entry.get("st") else None,
                    "rank": 1 if entry.get("rank") == 1 else 0,  # 目的変数
                    "races": races,
                    "wins": wins,
                    "recent_win_rate": wins / races if races else 0.0,
                })

    return pd.DataFrame(rows)

if __name__ == "__main__":
    history = load_history()
    df = build_features(history, max_races=20)
    df.to_csv(FEATURES_FILE, index=False, encoding="utf-8")
    print(f"[INFO] 特徴量を保存しました → {FEATURES_FILE}")