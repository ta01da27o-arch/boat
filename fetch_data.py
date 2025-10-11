# fetch_data.py
import requests
import json
import os
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

# === 設定 ===
DATA_FILE = "data.json"
HISTORY_FILE = "history.json"
PROGRAM_API_TODAY = "https://boatraceopenapi.github.io/programs/v2/today.json"
RESULTS_API_TODAY = "https://boatraceopenapi.github.io/results/v2/today.json"
BASE_URL = "https://www.boatrace.jp/owpc/pc/race/index"

# === 天気情報取得 ===
def fetch_weather(jcd, date):
    url = f"{BASE_URL}?jcd={jcd}&hd={date}"
    print(f"[INFO] 天気情報取得中: {url}")
    weather_data = {}

    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "lxml")

        weather = soup.select_one(".weather1_bodyUnitLabel").get_text(strip=True)
        wind = soup.select_one(".weather1_bodyUnitData").get_text(strip=True)
        wave = soup.select(".weather1_bodyUnitData")[1].get_text(strip=True)

        weather_data = {"weather": weather, "wind": wind, "wave": wave}
    except Exception as e:
        print(f"[WARN] 天気情報取得失敗: {e}")

    return weather_data

# === 出走表取得 ===
def fetch_programs():
    print("[INFO] 出走表データ取得中...")
    resp = requests.get(PROGRAM_API_TODAY, timeout=20)
    resp.raise_for_status()
    data = resp.json()

    # API構造が辞書型なので展開
    programs = []
    if isinstance(data, dict):
        for v in data.values():
            if isinstance(v, list):
                programs.extend(v)
    elif isinstance(data, list):
        programs = data

    print(f"[INFO] 出走表 {len(programs)} 件を取得しました。")
    return programs

# === 結果取得 ===
def fetch_results():
    print("[INFO] 結果データ取得中...")
    resp = requests.get(RESULTS_API_TODAY, timeout=20)
    resp.raise_for_status()
    results = resp.json()
    print(f"[INFO] 結果 {len(results)} 件を取得しました。")
    return results

# === 天気マージ ===
def merge_weather(programs):
    today = datetime.now().strftime("%Y%m%d")
    for race in programs:
        if not isinstance(race, dict):
            continue
        jcd = race.get("jcd")
        if jcd:
            race["weather_info"] = fetch_weather(jcd, today)
    return programs

# === 保存 ===
def save_json(data, file_path):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] 保存完了 → {file_path}")

# === メイン ===
def main(force_program=False):
    now_jst = datetime.utcnow() + timedelta(hours=9)
    hour = now_jst.hour
    print(f"[INFO] 現在の日本時間: {now_jst.strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        if force_program:
            # 手動実行（強制更新）
            print("[INFO] 手動実行モード → 出走表を再生成")
            programs = fetch_programs()
            programs = merge_weather(programs)
            save_json(programs, DATA_FILE)
            return

        # 朝（出走表）
        if 5 <= hour < 10:
            programs = fetch_programs()
            programs = merge_weather(programs)
            save_json(programs, DATA_FILE)

        # 夜（結果）
        elif 22 <= hour or hour < 2:
            results = fetch_results()
            today = datetime.now().strftime("%Y%m%d")

            if os.path.exists(HISTORY_FILE):
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    history = json.load(f)
            else:
                history = {}

            history[today] = {"results": results}
            save_json(history, HISTORY_FILE)

        else:
            print("[INFO] 現在の時間帯では自動更新をスキップします。")

    except Exception as e:
        print(f"[ERROR] データ処理中にエラー発生: {e}")

if __name__ == "__main__":
    import sys
    force_flag = "--force-program" in sys.argv
    main(force_flag)