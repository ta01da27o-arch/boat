import requests
import json
import os
from datetime import datetime
from fetch_weather import fetch_weather

DATA_FILE = "data.json"
HISTORY_FILE = "history.json"
PROGRAM_API_TODAY = "https://boatraceopenapi.github.io/programs/v2/today.json"
RESULTS_API_TODAY = "https://boatraceopenapi.github.io/results/v2/today.json"

def fetch_programs():
    print("[INFO] 出走表データ取得開始...")
    resp = requests.get(PROGRAM_API_TODAY, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    # データが dict なら展開して list に変換
    if isinstance(data, dict):
        programs = []
        for v in data.values():
            if isinstance(v, list):
                programs.extend(v)
        data = programs

    print(f"[INFO] {len(data)} 件の出走表を取得しました")
    return data

def fetch_results():
    print("[INFO] レース結果データ取得開始...")
    resp = requests.get(RESULTS_API_TODAY, timeout=10)
    resp.raise_for_status()
    results = resp.json()
    print(f"[INFO] {len(results)} 件のレース結果を取得しました")
    return results

def merge_weather(programs):
    today = datetime.now().strftime("%Y%m%d")
    for race in programs:
        if not isinstance(race, dict):
            continue
        jcd = race.get("jcd")
        if jcd:
            race["weather"] = fetch_weather(jcd, today)
    return programs

def save_programs(data, out_path=DATA_FILE):
    # ✅ data.json は常に上書き
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] 出走表を保存しました → {out_path}")

def save_results(results, out_path=HISTORY_FILE):
    # ✅ history.json は追記形式
    if os.path.exists(out_path):
        with open(out_path, "r", encoding="utf-8") as f:
            history = json.load(f)
    else:
        history = {}

    today = datetime.now().strftime("%Y%m%d")
    history[today] = {"results": results}

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)
    print(f"[INFO] レース結果を保存しました → {out_path}")

if __name__ == "__main__":
    try:
        programs = fetch_programs()
        programs = merge_weather(programs)
        save_programs(programs, DATA_FILE)

        results = fetch_results()
        save_results(results, HISTORY_FILE)

    except Exception as e:
        print(f"[ERROR] データ処理に失敗しました: {e}")