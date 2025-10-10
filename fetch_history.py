import os
import json
import requests
import datetime
from pathlib import Path

DATA_FILE = Path("history.json")
RESULTS_API = "https://boatraceopenapi.github.io/results/v2"

def fetch_result_api(date_str):
    url = f"{RESULTS_API}/{date_str[:4]}/{date_str}.json"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, dict):
                return data
            else:
                print(f"⚠️ データ形式が想定外（{date_str}）: {type(data)}")
                return None
        else:
            print(f"❌ 取得失敗 {date_str}: {resp.status_code}")
            return None
    except Exception as e:
        print(f"❌ 取得エラー {date_str}: {e}")
        return None

def load_existing_data():
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ JSON読み込みエラー: {e}")
            return {}
    return {}

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def mark_ai_hits(history, ai_data=None):
    for date, day_data in history.items():
        if not isinstance(day_data, dict):
            continue
        for venue, races in day_data.items():
            if not isinstance(races, list):
                continue
            for i, r in enumerate(races):
                if not isinstance(r, dict):
                    continue
                race_num = str(r.get("race_number", ""))
                if ai_data and race_num in ai_data.get(venue, {}):
                    r["ai_hit"] = ai_data[venue][race_num].get("hit", False)
    return history

def fetch_and_update(days=30):
    today = datetime.date.today()
    all_history = load_existing_data()
    new_data = {}

    # 古いデータを30日分に制限
    for i in range(days):
        date_str = (today - datetime.timedelta(days=i)).strftime("%Y%m%d")
        if date_str in all_history:
            new_data[date_str] = all_history[date_str]
        else:
            print(f"🆕 新規取得: {date_str}")
            result = fetch_result_api(date_str)
            if result:
                new_data[date_str] = result

    # AI結果マーク（任意）
    new_data = mark_ai_hits(new_data)

    save_data(new_data)
    print(f"✅ 過去{days}日分の履歴データを更新しました ({len(new_data)}日分保持)")

if __name__ == "__main__":
    fetch_and_update(30)