import requests
from bs4 import BeautifulSoup
from datetime import datetime
import pytz
import json
import os
import sys

# === 日本時間設定 ===
JST = pytz.timezone("Asia/Tokyo")
today_jst = datetime.now(JST)
today_str = today_jst.strftime("%Y%m%d")

DATA_FILE = "data.json"

def fetch_program(date_str):
    """本日の24場出走表を公式ページから取得"""
    url = "https://www.boatrace.jp/owpc/pc/race/index"
    print(f"🔍 出走表取得（24場）: {url}")
    res = requests.get(url)
    res.encoding = res.apparent_encoding
    soup = BeautifulSoup(res.text, "lxml")

    stadiums = []
    for item in soup.select(".contentsFrame1Inner table a"):
        href = item.get("href")
        name = item.text.strip()
        if "raceindex" in href:
            stadiums.append({
                "stadium_name": name,
                "stadium_url": "https://www.boatrace.jp" + href
            })

    if not stadiums:
        print("⚠️ 出走表が見つかりません（休開催または構造変更の可能性）")

    return stadiums


def fetch_results(date_str):
    """当日の全結果を取得"""
    url = f"https://www.boatrace.jp/owpc/pc/race/raceresultall?hd={date_str}"
    print(f"🏁 結果取得: {url}")
    res = requests.get(url)
    res.encoding = res.apparent_encoding
    soup = BeautifulSoup(res.text, "lxml")

    results = []
    for race in soup.select(".table1 .is-fs11"):
        txt = race.text.strip()
        if txt:
            results.append(txt)
    return results


def load_json():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}


def save_json(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ data.json 更新完了 ({today_str})")


def main():
    force_program = "--force-program" in sys.argv
    force_result = "--force-result" in sys.argv

    data = load_json()

    if isinstance(data, list):
        data = {}

    if force_program:
        print("📦 出走表を更新中...")
        programs = fetch_program(today_str)
        if programs:
            data["programs"] = programs
        else:
            print("⚠️ 出走表取得失敗")

    if force_result:
        print("📦 結果を更新中...")
        results = fetch_results(today_str)
        if results:
            data["results"] = results
        else:
            print("⚠️ 結果取得失敗")

    data["last_update"] = today_jst.strftime("%Y-%m-%d %H:%M:%S")
    save_json(data)


if __name__ == "__main__":
    main()