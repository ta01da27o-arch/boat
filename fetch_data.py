import os
import json
import requests
import datetime
from pathlib import Path

# === 設定 ===
DATA_FILE = Path("data.json")
PROGRAMS_API = "https://boatraceopenapi.github.io/api/programs/v3"

# === 1日分の出走表データ取得 ===
def fetch_program_api(date_str):
    url = f"{PROGRAMS_API}/{date_str}.json"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, dict):
                print(f"✅ {date_str} 出走表取得成功")
                return data
            else:
                print(f"⚠️ {date_str} 出走表データ形式不正: {type(data)}")
        else:
            print(f"❌ {date_str} 出走表取得失敗: {r.status_code}")
    except Exception as e:
        print(f"⚠️ {date_str} 取得エラー: {e}")
    return None

# === JSON保存 ===
def save_json(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# === 既存データ読み込み ===
def load_existing():
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ JSON読み込み失敗: {e}")
    return {}

# === メイン処理 ===
def fetch_today_program():
    today = datetime.date.today()
    tomorrow = today + datetime.timedelta(days=1)
    result_data = {}

    for target_date in [today, tomorrow]:
        date_str = target_date.strftime("%Y%m%d")
        print(f"📅 出走表取得中: {date_str}")
        data = fetch_program_api(date_str)
        if data:
            result_data[date_str] = data

    if not result_data:
        print("❌ 出走表データが取得できませんでした。")
    else:
        save_json(result_data)
        print(f"✅ 出走表データ保存完了: {len(result_data)}日分")

# === 実行 ===
if __name__ == "__main__":
    fetch_today_program()