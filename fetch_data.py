import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
from datetime import datetime
import pytz
import json
import warnings
import time
import sys
import os

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

# === 日本時間で今日の日付を取得 ===
JST = pytz.timezone("Asia/Tokyo")
today_jst = datetime.now(JST)
today_str = today_jst.strftime("%Y%m%d")

DATA_FILE = "data.json"

def fetch_program(date_str):
    """出走表データを取得"""
    url = f"https://www.boatrace.jp/owpc/pc/race/raceindex?hd={date_str}"
    print(f"🔍 出走表取得: {url}")
    res = requests.get(url)
    res.encoding = res.apparent_encoding
    soup = BeautifulSoup(res.text, "lxml")

    stadiums = []
    for link in soup.select("div.raceIndex__info a"):
        href = link.get("href")
        if not href or "race/raceindex" not in href:
            continue
        name = link.text.strip()
        stadiums.append({
            "stadium_name": name,
            "stadium_url": "https://www.boatrace.jp" + href
        })
    return stadiums


def fetch_results(date_str):
    """レース結果データを取得"""
    url = f"https://www.boatrace.jp/owpc/pc/race/raceresultall?hd={date_str}"
    print(f"🏁 結果取得: {url}")
    res = requests.get(url)
    res.encoding = res.apparent_encoding
    soup = BeautifulSoup(res.text, "lxml")

    results = []
    for item in soup.select(".table1 .is-fs11"):
        txt = item.text.strip()
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

    # データの型がリストだった場合（旧→新変換時エラー防止）
    if isinstance(data, list):
        data = {}

    if force_program:
        print("📦 出走表を更新中...")
        program_data = fetch_program(today_str)
        if program_data:
            data["programs"] = program_data
        else:
            print("⚠️ 出走表の取得に失敗しました。")

    if force_result:
        print("📦 結果を更新中...")
        result_data = fetch_results(today_str)
        if result_data:
            data["results"] = result_data
        else:
            print("⚠️ 結果の取得に失敗しました。")

    # タイムスタンプ更新（app.js の参照互換）
    data["last_update"] = today_jst.strftime("%Y-%m-%d %H:%M:%S")

    save_json(data)


if __name__ == "__main__":
    main()