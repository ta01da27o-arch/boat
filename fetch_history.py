import os
import json
import requests
import datetime
from pathlib import Path

# === 基本設定 ===
DATA_FILE = Path("history.json")
RESULTS_API = "https://boatraceopenapi.github.io/results/v2"

# === 1日分の結果データ取得 ===
def fetch_result_api(date_str):
    url = f"{RESULTS_API}/{date_str[:4]}/{date_str}.json"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, dict):
                print(f"✅ {date_str} データ取得成功")
                return data
            else:
                print(f"⚠️ {date_str} データ形式が不正: {type(data)}")
        else:
            print(f"❌ {date_str} 取得失敗: {r.status_code}")
    except Exception as e:
        print(f"⚠️ {date_str} エラー: {e}")
    return None

# === 既存データ読み込み ===
def load_existing():
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ JSON読み込み失敗: {e}")
    return {}

# === JSON保存 ===
def save_json(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# === AI的中フラグ（仮） ===
def mark_ai_hits(history):
    for date, items in history.items():
        if not isinstance(items, dict):
            continue
        for venue, races in items.items():
            if not isinstance(races, list):
                continue
            for r in races:
                if isinstance(r, dict) and "ai_hit" not in r:
                    r["ai_hit"] = False  # 初期値として付与
    return history

# === メイン処理 ===
def fetch_and_update(days=30):
    today = datetime.date.today()
    history = {}

    for i in range(days):
        date_str = (today - datetime.timedelta(days=i)).strftime("%Y%m%d")
        print(f"📅 処理中: {date_str}")
        result = fetch_result_api(date_str)
        if result:
            history[date_str] = result

    history = mark_ai_hits(history)
    save_json(history)
    print(f"✅ 過去{days}日分の履歴データを保存完了 ({len(history)}件)")

# === 実行 ===
if __name__ == "__main__":
    fetch_and_update(30)