import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, timezone
import json
import os
import time

JST = timezone(timedelta(hours=9))
BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"
DATA_FILE = "data.json"
HISTORY_FILE = "history.json"
DAYS_TO_KEEP = 30

def get_target_date(mode="today"):
    now = datetime.now(JST)
    if mode == "yesterday":
        now -= timedelta(days=1)
    return now.strftime("%Y%m%d")

def fetch_today_data(date_str):
    print(f"📦 {date_str} のレースデータを取得中...")

    venues = []
    for jcd in range(1, 25):  # 1〜24場
        url = f"{BASE_URL}?jcd={jcd:02d}&hd={date_str}"
        res = requests.get(url)
        if res.status_code != 200:
            continue

        soup = BeautifulSoup(res.text, "html.parser")
        title = soup.find("title")
        if not title or "開催なし" in title.text:
            continue

        races = soup.select(".contentsFrame1Inner .table1")
        if races:
            venues.append({
                "venue": jcd,
                "date": date_str,
                "race_count": len(races)
            })

        time.sleep(0.3)

    print(f"✅ 開催中場 ({date_str}): {[v['venue'] for v in venues]}")
    return venues

def save_data(filename, data):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_json(filename):
    if not os.path.exists(filename):
        return []
    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)

def update_history(new_data, date_str):
    history = load_json(HISTORY_FILE)

    # 古いデータ削除 (30日分保持)
    history = [d for d in history if d["date"] >= (datetime.now(JST) - timedelta(days=DAYS_TO_KEEP)).strftime("%Y%m%d")]

    # 同じ日付の重複削除して追加
    history = [d for d in history if d["date"] != date_str] + new_data

    save_data(HISTORY_FILE, history)
    print(f"📘 history.json 更新完了 ({len(history)}日分保持)")
    return history

def main():
    import sys
    if len(sys.argv) < 2 or sys.argv[1] not in ["today", "yesterday"]:
        print("❌ Usage: python fetch_data.py [today|yesterday]")
        return

    mode = sys.argv[1]
    date_str = get_target_date(mode)
    print(f"📅 {mode} ({date_str}) のデータを取得します")

    data = fetch_today_data(date_str)
    save_data(DATA_FILE, data)
    update_history(data, date_str)

    print(f"✅ data.json 更新完了 ({len(data)}件)")

if __name__ == "__main__":
    main()