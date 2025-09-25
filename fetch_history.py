# fetch_history.py
import os
import json
import requests
import datetime
from pathlib import Path

# 保存先ファイル
DATA_FILE = Path("history.json")

# APIベースURL
RESULTS_API = "https://boatraceopenapi.github.io/results/v2"

def fetch_result_api(date_str):
    url = f"{RESULTS_API}/{date_str[:4]}/{date_str}.json"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"取得失敗 {date_str}: {resp.status_code}")
            return None
    except Exception as e:
        print(f"取得エラー {date_str}: {e}")
        return None

def load_existing_data():
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def fetch_past_days(days=60):
    today = datetime.date.today()
    all_data = load_existing_data()
    for i in range(days):
        target_date = today - datetime.timedelta(days=i)
        date_str = target_date.strftime("%Y%m%d")
        if date_str in all_data:
            continue
        print(f"取得中: {date_str}")
        result = fetch_result_api(date_str)
        if result:
            all_data[date_str] = result
    save_data(all_data)
    print(f"✅ 過去{days}日分データを保存完了 → {DATA_FILE}")

def weekly_update():
    today = datetime.date.today()
    all_data = load_existing_data()
    for i in range(7):
        target_date = today - datetime.timedelta(days=i)
        date_str = target_date.strftime("%Y%m%d")
        print(f"更新中: {date_str}")
        result = fetch_result_api(date_str)
        if result:
            all_data[date_str] = result
    save_data(all_data)
    print("✅ 直近1週間分を更新完了")

if __name__ == "__main__":
    if not DATA_FILE.exists():
        fetch_past_days(60)
    else:
        weekly_update()