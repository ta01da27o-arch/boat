import os
import json
import requests
import datetime
from pathlib import Path

DATA_FILE = Path("history.json")
AI_FILE = Path("data.json")  # ← AI予想を保存しているファイル
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

def load_json(file):
    if file.exists():
        with open(file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_json(file, data):
    with open(file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def mark_ai_hits(history, ai_data):
    for date, races in history.items():
        for r in races:
            race_id = str(r.get("race_number", ""))  # 例: "12"
            stadium = str(r.get("race_stadium_number", ""))
            result = r.get("race_result", "").strip()
            ai_pred = None

            # AI予想をdata.jsonから照合
            for d in ai_data.get("races", []):
                if str(d.get("stadium")) == stadium and str(d.get("race_no")) == race_id:
                    ai_pred = d.get("ai_prediction")
                    break

            # 的中フラグ判定
            if ai_pred and result and ai_pred == result:
                r["ai_hit"] = True
            else:
                r["ai_hit"] = False
    return history

def fetch_and_update(days=60):
    today = datetime.date.today()
    all_history = load_json(DATA_FILE)
    ai_data = load_json(AI_FILE)

    for i in range(days):
        date = today - datetime.timedelta(days=i)
        date_str = date.strftime("%Y%m%d")
        print(f"処理中: {date_str}")
        result = fetch_result_api(date_str)
        if result:
            all_history[date_str] = result

    # 的中判定追加
    all_history = mark_ai_hits(all_history, ai_data)
    save_json(DATA_FILE, all_history)
    print(f"✅ {days}日分の結果データ + AI的中フラグを保存完了 → {DATA_FILE}")

if __name__ == "__main__":
    fetch_and_update(60)