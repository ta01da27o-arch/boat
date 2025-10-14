# fetch_data.py
# 競艇 本日・前日対応 自動データ取得 + タイトル補完版

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta
import time
import warnings
from bs4 import XMLParsedAsHTMLWarning

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

BASE_URL = "https://www.boatrace.jp/owpc/pc"
JSON_PATH = "data.json"
HEADERS = {"User-Agent": "Mozilla/5.0"}

STADIUMS = {
    "01": "桐生", "02": "戸田", "03": "江戸川", "04": "平和島", "05": "多摩川",
    "06": "浜名湖", "07": "蒲郡", "08": "常滑", "09": "津", "10": "三国",
    "11": "びわこ", "12": "住之江", "13": "尼崎", "14": "鳴門", "15": "丸亀",
    "16": "児島", "17": "宮島", "18": "徳山", "19": "下関", "20": "若松",
    "21": "芦屋", "22": "福岡", "23": "唐津", "24": "大村"
}

def get_active_stadiums(target_date: str):
    print(f"🌏 開催中レース場を取得中... ({target_date})")
    url = f"{BASE_URL}/race/index?hd={target_date}"
    res = requests.get(url, headers=HEADERS)
    res.encoding = "utf-8"
    soup = BeautifulSoup(res.text, "lxml")

    links = soup.select("a[href*='jcd=']")
    stadium_codes = sorted(list(set([link["href"].split("jcd=")[-1][:2] for link in links])))

    print(f"✅ 開催中場 ({len(stadium_codes)}場): {', '.join(stadium_codes)}")
    return stadium_codes

def extract_title(soup):
    selectors = [
        ".heading1_titleName",
        ".heading1_titleName span",
        ".heading1_titleName02",
        ".heading2_titleName",
        ".heading1_titleName02 span"
    ]
    for sel in selectors:
        tag = soup.select_one(sel)
        if tag and tag.text.strip():
            return tag.text.strip()
    return None

def fetch_programs(stadium_codes, target_date):
    programs = []
    for code in stadium_codes:
        url = f"{BASE_URL}/race/racelist?jcd={code}&hd={target_date}"
        print(f"🔍 出走表取得中: {url}")
        res = requests.get(url, headers=HEADERS)
        if res.status_code != 200:
            print(f"⚠️ {code}: 出走表取得失敗 ({res.status_code})")
            continue

        soup = BeautifulSoup(res.text, "lxml")
        title = extract_title(soup) or f"{STADIUMS.get(code, '不明')}レース"

        programs.append({
            "stadium_code": code,
            "stadium_name": STADIUMS.get(code, "不明"),
            "race_title": title,
            "url": url
        })
        time.sleep(0.3)
    return programs

def fetch_results(stadium_codes, target_date):
    results = []
    for code in stadium_codes:
        url = f"{BASE_URL}/race/raceresultall?jcd={code}&hd={target_date}"
        print(f"🏁 結果取得中: {url}")
        res = requests.get(url, headers=HEADERS)
        if res.status_code != 200:
            print(f"⚠️ {code}: 結果取得失敗 ({res.status_code})")
            continue

        soup = BeautifulSoup(res.text, "lxml")
        title = extract_title(soup) or f"{STADIUMS.get(code, '不明')}レース"

        results.append({
            "stadium_code": code,
            "stadium_name": STADIUMS.get(code, "不明"),
            "result_title": title,
            "url": url
        })
        time.sleep(0.3)
    return results

def save_json(data):
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ data.json 更新完了 ({data['race_date']})")

def main(mode="today"):
    today = datetime.now()
    jst_today = today + timedelta(hours=9)
    if mode == "today":
        target_date = jst_today.strftime("%Y%m%d")
    elif mode == "yesterday":
        target_date = (jst_today - timedelta(days=1)).strftime("%Y%m%d")
    else:
        raise ValueError("modeは 'today' または 'yesterday' を指定してください")

    print(f"\n📦 競艇データ自動取得 ({mode.upper()}) 開始: {target_date}")

    stadiums = get_active_stadiums(target_date)
    if not stadiums:
        print("⚠️ 開催中のレース場が見つかりません。")
        return

    programs = fetch_programs(stadiums, target_date)
    results = fetch_results(stadiums, target_date)

    data = {
        "race_date": target_date,
        "programs": programs,
        "results": results,
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    save_json(data)

if __name__ == "__main__":
    import sys
    mode = "today"
    if len(sys.argv) > 1:
        mode = sys.argv[1]
    main(mode)