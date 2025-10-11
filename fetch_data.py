# fetch_data.py
import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
import json
from datetime import datetime
import time
import warnings

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

BASE_URL = "https://www.boatrace.jp"
INDEX_URL = f"{BASE_URL}/owpc/pc/race/index"
OUTPUT_FILE = "data.json"

# タイムアウトとリトライ設定
TIMEOUT = 15
RETRY_COUNT = 3

def fetch_url(url):
    """HTTPリクエスト（リトライ付き）"""
    for i in range(RETRY_COUNT):
        try:
            res = requests.get(url, timeout=TIMEOUT)
            res.raise_for_status()
            return res
        except requests.exceptions.RequestException as e:
            print(f"⏳ retry {i+1}/{RETRY_COUNT}: {e}")
            time.sleep(2)
    return None

def get_today_races():
    """本日の全開催場を取得"""
    print("🏁 本日の開催場一覧を取得中...")
    res = fetch_url(INDEX_URL)
    if not res:
        print("❌ 開催場ページ取得失敗")
        return []

    soup = BeautifulSoup(res.text, "lxml")

    links = soup.select("a[href*='/owpc/pc/race/racelist']")
    venues = []

    for a in links:
        href = a.get("href")
        if href and "/owpc/pc/race/racelist" in href:
            venue_url = BASE_URL + href
            venue_name = a.text.strip()
            venues.append({"name": venue_name, "url": venue_url})

    if not venues:
        print("⚠️ 開催場なし")
    else:
        print(f"✅ {len(venues)}場を検出")

    return venues

def get_race_details(venue):
    """各開催場のレース詳細を取得"""
    res = fetch_url(venue["url"])
    if not res:
        print(f"❌ {venue['name']} データ取得失敗")
        return []

    soup = BeautifulSoup(res.text, "lxml")
    race_links = soup.select("a[href*='/owpc/pc/race/racedata']")
    races = []

    for a in race_links:
        href = a.get("href")
        if href:
            race_url = BASE_URL + href
            race_name = a.text.strip()
            races.append({"race": race_name, "url": race_url})

    print(f"📦 {venue['name']} - {len(races)}レース取得")
    return races

def main():
    print("🚀 本日のレースデータ取得開始")
    today = datetime.now().strftime("%Y/%m/%d")

    venues = get_today_races()
    if not venues:
        print("⚠️ 開催場なし - 空データを保存")
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump({"date": today, "venues": []}, f, ensure_ascii=False, indent=2)
        print(f"✅ {OUTPUT_FILE} を更新しました (0場)")
        return

    all_data = {"date": today, "venues": []}

    for v in venues:
        venue_races = get_race_details(v)
        all_data["venues"].append({
            "name": v["name"],
            "url": v["url"],
            "races": venue_races
        })

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"✅ {OUTPUT_FILE} を更新しました ({len(venues)}場)")
    print("🎯 本日の全レースデータ取得完了！")

if __name__ == "__main__":
    main()