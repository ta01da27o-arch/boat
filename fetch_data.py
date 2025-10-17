import json, os, requests
from datetime import datetime, timedelta, timezone

JST = timezone(timedelta(hours=9))
DATA_PATH = "data/data.json"
HISTORY_PATH = "data/history.json"
DAYS_TO_KEEP = 7  # 保持日数

# ダミーAPI例（後で実際のオープンAPIに変更可能）
API_URL = "https://api.odds-api.example/boatrace/today"

def load_json(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def fetch_today():
    # 仮データ（後で実API置換）
    return [{"race": i, "venue": "桐生", "wind": 2.0, "wave": 1.0} for i in range(1, 13)]

def update_history(new_data, date_str):
    history = load_json(HISTORY_PATH)
    if isinstance(history, dict):
        history = list(history.values())

    # 古いデータ削除
    cutoff = (datetime.now(JST) - timedelta(days=DAYS_TO_KEEP)).strftime("%Y%m%d")
    history = [d for d in history if d.get("date", "") >= cutoff]

    # 新しいデータ追加
    for d in new_data:
        d["date"] = date_str
    history.extend(new_data)

    save_json(HISTORY_PATH, history)

def main():
    today = datetime.now(JST).strftime("%Y%m%d")
    print(f"📅 Fetching data for {today} ...")

    data = fetch_today()
    save_json(DATA_PATH, data)
    update_history(data, today)
    print(f"✅ Updated {len(data)} races.")

if __name__ == "__main__":
    main()