import requests
from bs4 import BeautifulSoup
import datetime
import json
from pathlib import Path
import time

BASE_URL = "https://www.boatrace.jp"
DATA_FILE = Path("data.json")

VENUES = {
    "01": "桐生", "02": "戸田", "03": "江戸川", "04": "平和島", "05": "多摩川", "06": "浜名湖",
    "07": "蒲郡", "08": "常滑", "09": "津", "10": "三国", "11": "びわこ", "12": "住之江",
    "13": "尼崎", "14": "鳴門", "15": "丸亀", "16": "児島", "17": "宮島", "18": "徳山",
    "19": "下関", "20": "若松", "21": "芦屋", "22": "福岡", "23": "唐津", "24": "大村"
}

today = datetime.date.today()
date_str = today.strftime("%Y%m%d")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

def safe_get(url, retries=3, wait=3):
    """失敗時にリトライ"""
    for i in range(retries):
        try:
            res = requests.get(url, headers=HEADERS, timeout=20)
            if res.status_code == 200 and "html" in res.headers.get("Content-Type", ""):
                return res
        except Exception as e:
            print(f"⚠️ retry {i+1}/{retries}: {e}")
            time.sleep(wait)
    return None

def get_today_venues():
    url = f"{BASE_URL}/owpc/pc/race/index"
    res = safe_get(url)
    if not res:
        print("❌ 開催情報ページ取得失敗")
        return list(VENUES.keys())  # ← fallbackで全24場処理

    soup = BeautifulSoup(res.text, "lxml")
    links = soup.select("li.is-holding a")
    venue_codes = []
    for link in links:
        href = link.get("href", "")
        if "jcd=" in href:
            code = href.split("jcd=")[1].split("&")[0]
            if code in VENUES:
                venue_codes.append(code)

    if not venue_codes:
        print("⚠️ 開催場が見つからなかったため、全24場を対象にします")
        venue_codes = list(VENUES.keys())

    print(f"✅ 対象場: {', '.join([VENUES[v] for v in venue_codes])}")
    return venue_codes

def fetch_race_program(venue_code):
    program = {"title": VENUES[venue_code], "races": []}
    for rno in range(1, 13):
        url = f"{BASE_URL}/owpc/pc/race/racelist?rno={rno}&jcd={venue_code}&hd={date_str}"
        res = safe_get(url)
        if not res:
            continue
        soup = BeautifulSoup(res.text, "lxml")

        title = soup.select_one(".heading2_title")
        race_name = title.text.strip() if title else f"{rno}R"
        boats = [b.text.strip() for b in soup.select(".table1_boatImage1 .is-fs18")]
        players = [p.text.strip() for p in soup.select(".table1_name")]

        if not boats or len(boats) < 6:
            continue

        race_info = {
            "no": rno,
            "name": race_name,
            "boats": boats,
            "players": players,
        }
        program["races"].append(race_info)
        time.sleep(1)  # 負荷軽減

    return program

def main():
    all_data = {"date": date_str, "program": {}, "results": {}}
    venues = get_today_venues()

    for v in venues:
        program = fetch_race_program(v)
        all_data["program"][v] = program

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"✅ data.json を更新しました ({len(venues)}場)")

if __name__ == "__main__":
    main()