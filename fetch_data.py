import json
import pandas as pd
from datetime import datetime

def fetch_data():
    """
    本来は外部APIやスクレイピングで取得。
    ここではダミーデータを作成。
    """
    today = datetime.now().strftime("%Y-%m-%d")
    data = []
    for race_no in range(1, 13):  # 1日最大12レースを想定
        race = {
            "race_date": today,
            "race_stadium_number": 1,
            "race_number": race_no,
            "boats": [
                {"lane": i, "player": f"選手{i}", "odds": None}
                for i in range(1, 7)
            ],
            "ai_prediction": [],
            "result": []
        }
        data.append(race)
    return data

def save_data(data, out_path="data.json"):
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] data.json を保存しました → {out_path}")

def save_summary(df, out_path="summary.json"):
    """
    データ全体の要約を保存する関数
    """
    summary = {
        "races": len(df),
        "columns": list(df[0].keys()) if len(df) > 0 else []
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"[INFO] summary.json を保存しました → {out_path}")

def main():
    data = fetch_data()
    save_data(data, "data.json")
    save_summary(data, "summary.json")

if __name__ == "__main__":
    main()