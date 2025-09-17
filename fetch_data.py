import requests
import json
from datetime import datetime, timedelta

def fetch_today():
    url = "https://boatrace-open-api.vercel.app/programs"  # OpenAPIサンプル
    res = requests.get(url)
    programs = res.json()

    today = datetime.now().strftime("%Y-%m-%d")
    races = []

    for p in programs:
        if p.get("date") != today:
            continue
        entries = [
            {
                "lane": b.get("lane"),
                "name": b.get("name"),
                "win_rate": b.get("win_rate"),
            }
            for b in p.get("boats", [])
        ]
        races.append({
            "stadium_name": p.get("stadium"),
            "race_number": p.get("race"),
            "entries": entries
        })

    return races

def fetch_history():
    # 実際は艇国データバンクやCSVをスクレイピング／API利用
    # サンプル: ダミーデータ
    history = [
        {"name": "選手1", "avg_start": 0.15, "recent_rate": 7.0},
        {"name": "選手2", "avg_start": 0.18, "recent_rate": 6.5},
    ]
    return history

def main():
    today_data = fetch_today()
    history_data = fetch_history()

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(today_data, f, ensure_ascii=False, indent=2)

    with open("history.json", "w", encoding="utf-8") as f:
        json.dump(history_data, f, ensure_ascii=False, indent=2)

    print("[INFO] data.json, history.json を更新しました")

if __name__ == "__main__":
    main()