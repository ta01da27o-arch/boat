import requests
import json
import os
from datetime import datetime
from bs4 import BeautifulSoup

DATA_FILE = "data.json"
HISTORY_FILE = "history.json"

PROGRAM_API_TODAY = "https://boatraceopenapi.github.io/programs/v2/today.json"
RESULTS_API_TODAY = "https://boatraceopenapi.github.io/results/v2/today.json"
BASE_URL = "https://www.boatrace.jp/owpc/pc/race/index"


def fetch_weather(jcd, date):
    """
    場コード jcd (01:桐生, 02:戸田, ...)
    date: "YYYYMMDD"
    """
    url = f"{BASE_URL}?jcd={jcd}&hd={date}"
    print(f"[INFO] 気象データ取得: {url}")

    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    weather_data = {}
    try:
        weather = soup.select_one(".weather1_bodyUnitLabel").get_text(strip=True)
        wind = soup.select_one(".weather1_bodyUnitData").get_text(strip=True)
        wave = soup.select(".weather1_bodyUnitData")[1].get_text(strip=True)

        weather_data = {
            "weather": weather,
            "wind": wind,
            "wave": wave,
        }
    except Exception as e:
        print(f"[WARN] 気象情報の取得に失敗: {e}")
        weather_data = {}

    return weather_data


def flatten_data(data):
    if isinstance(data, dict):
        flat = []
        for v in data.values():
            if isinstance(v, list):
                flat.extend(v)
        return flat
    return data


def fetch_programs():
    print("[INFO] 出走表データ取得開始...")
    resp = requests.get(PROGRAM_API_TODAY, timeout=15)
    resp.raise_for_status()
    data = flatten_data(resp.json())
    print(f"[INFO] {len(data)}件の出走表を取得しました")
    return data


def fetch_results():
    print("[INFO] レース結果データ取得開始...")
    resp = requests.get(RESULTS_API_TODAY, timeout=15)
    resp.raise_for_status()
    results = flatten_data(resp.json())
    print(f"[INFO] {len(results)}件のレース結果を取得しました")
    return results


def merge_weather(programs):
    today = datetime.now().strftime("%Y%m%d")
    weather_cache = {}

    for race in programs:
        if isinstance(race, dict):
            jcd = race.get("jcd")
            if jcd:
                if jcd not in weather_cache:
                    weather_cache[jcd] = fetch_weather(jcd, today)
                # ✅ アプリ画面には表示しないが data.json に保存して AI 予想で使う
                race["weather_info"] = weather_cache[jcd]

    return programs


def save_programs(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] 出走表を保存しました → {DATA_FILE}")


def save_results(results):
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)
    else:
        history = {}

    today = datetime.now().strftime("%Y%m%d")
    if today in history:
        history[today]["results"].extend(results)
    else:
        history[today] = {"results": results}

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)
    print(f"[INFO] レース結果を保存しました → {HISTORY_FILE}")


if __name__ == "__main__":
    try:
        # 実行時間によって処理を分ける
        hour = datetime.now().hour

        if hour < 12:  # 日本時間 朝 (例: 8時実行)
            print("[INFO] 出走表処理モード")
            programs = fetch_programs()
            programs = merge_weather(programs)
            save_programs(programs)

        else:  # 日本時間 夜 (例: 23時実行)
            print("[INFO] レース結果処理モード")
            results = fetch_results()
            save_results(results)

    except Exception as e:
        print(f"[ERROR] データ処理に失敗しました: {e}")