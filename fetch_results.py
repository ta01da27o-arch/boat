import requests
import json
import os
from datetime import datetime

HISTORY_FILE = "history.json"
RESULT_API_TODAY = "https://boatraceopenapi.github.io/results/v2/today.json"

def fetch_results():
    print("[INFO] レース結果データ取得開始...")
    resp = requests.get(RESULT_API_TODAY, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    print(f"[INFO] {len(data)} 件のレース結果を取得しました")
    return data

def load_history(path=HISTORY_FILE):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_results(new_data, out_path=HISTORY_FILE):
    today_key = datetime.now().strftime("%Y%m%d")
    history = load_history(out_path)
    history[today_key] = {"results": new_data}

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)
    print(f"[INFO] レース結果を保存しました → {out_path}")

if __name__ == "__main__":
    try:
        results = fetch_results()
        save_results(results, HISTORY_FILE)
    except Exception as e:
        print(f"[ERROR] レース結果取得に失敗しました: {e}")