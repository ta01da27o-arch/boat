# fetch_data.py
import requests
import json
import datetime
import time
import warnings
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import sys

# 警告を抑制
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

# 安定接続セッション
session = requests.Session()
retries = Retry(total=3, backoff_factor=2, status_forcelist=[500, 502, 503, 504])
session.mount("https://", HTTPAdapter(max_retries=retries))

BASE_URL = "https://www.boatrace.jp/owpc/pc/race"

def fetch_html(url):
    try:
        res = session.get(url, timeout=30)
        res.raise_for_status()
        return res.text
    except Exception as e:
        print(f"⚠️ 取得失敗: {url} ({e})")
        return None

def get_open_stadiums(target_date):
    """開催中の場コード一覧を取得"""
    ymd = target_date.strftime("%Y%m%d")
    url = f"{BASE_URL}/raceindex?hd={ymd}"
    html = fetch_html(url)
    if not html:
        return []

    soup = BeautifulSoup(html, "lxml")
    stadiums = []
    for a in soup.select(".contentsFrame1 a[href*='jcd=']"):
        if "jcd=" in a["href"]:
            code = a["href"].split("jcd=")[1][:2]
            if code not in stadiums:
                stadiums.append(code)
    print(f"✅ 開催中場 ({ymd}): {stadiums}")
    return stadiums

def fetch_race_data(target_date):
    """指定日の全レースデータを取得"""
    ymd = target_date.strftime("%Y%m%d")
    print(f"📦 {ymd} のレースデータを取得中...")
    jcds = get_open_stadiums(target_date)
    all_races = []

    for jcd in jcds:
        for rno in range(1, 13):
            race_url = f"{BASE_URL}/racelist?rno={rno}&jcd={jcd}&hd={ymd}"
            html = fetch_html(race_url)
            if not html:
                continue
            soup = BeautifulSoup(html, "lxml")
            title_tag = soup.select_one(".heading2_title")
            title = title_tag.get_text(strip=True) if title_tag else "不明レース"
            all_races.append({
                "date": ymd,
                "stadium": jcd,
                "race_no": rno,
                "title": title
            })
            time.sleep(1)
    return all_races

def update_json(filename, data):
    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ {filename} 更新完了 ({len(data)}件)")
    except Exception as e:
        print(f"⚠️ JSON更新失敗: {e}")

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "today"
    today = datetime.date.today()
    if mode == "yesterday":
        target_date = today - datetime.timedelta(days=1)
        print("📅 前日データを取得します")
        races = fetch_race_data(target_date)
        update_json("data.json", races)

    elif mode == "history":
        print("📅 過去30日データ更新開始")
        all_data = []
        for i in range(1, 31):
            target_date = today - datetime.timedelta(days=i)
            daily = fetch_race_data(target_date)
            all_data.extend(daily)
        update_json("history.json", all_data)

    else:
        print("📅 本日データを取得します")
        races = fetch_race_data(today)
        update_json("data.json", races)

if __name__ == "__main__":
    main()