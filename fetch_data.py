import json
from datetime import datetime, timedelta, timezone

JST = timezone(timedelta(hours=9))

def fetch_boat_data():
    # ★デモ：ダミーデータを返す（後でAPIに差し替え可能）
    today = datetime.now(JST).strftime("%Y%m%d")
    return {
        "date": today,
        "races": [
            {"stadium": "桐生", "race_no": 1, "comment": "逃げ有利"},
            {"stadium": "戸田", "race_no": 2, "comment": "差し展開"},
        ]
    }

def save_json(data, filename):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ {filename} を保存しました")

def update_history(data):
    history_file = "history.json"
    history = []

    if os.path.exists(history_file):
        with open(history_file, "r", encoding="utf-8") as f:
            try:
                history = json.load(f)
            except json.JSONDecodeError:
                history = []

    history.append(data)
    # 30日分だけ保持
    history = sorted(history, key=lambda x: x["date"])[-30:]
    save_json(history, history_file)

if __name__ == "__main__":
    data = fetch_boat_data()
    save_json(data, "data.json")
    update_history(data)