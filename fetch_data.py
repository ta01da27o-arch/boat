import os
import json
import datetime
import requests
from bs4 import BeautifulSoup
from time import sleep

# ======================================================
# 設定
# ======================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DATA_PATH = os.path.join(DATA_DIR, "data.json")
HISTORY_PATH = os.path.join(DATA_DIR, "history.json")

VENUES = {
    "桐生": "01", "戸田": "02", "江戸川": "03", "平和島": "04", "多摩川": "05",
    "浜名湖": "06", "蒲郡": "07", "常滑": "08", "津": "09", "三国": "10",
    "びわこ": "11", "住之江": "12", "尼崎": "13", "鳴門": "14", "丸亀": "15",
    "児島": "16", "宮島": "17", "徳山": "18", "下関": "19", "若松": "20",
    "芦屋": "21", "福岡": "22", "唐津": "23", "大村": "24"
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/121.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    "Referer": "https://www.boatrace.jp/",
}

# ======================================================
# 共通関数
# ======================================================
def safe_get(url, retries=2, timeout=15):
    for i in range(retries + 1):
        try:
            res = requests.get(url, headers=HEADERS, timeout=timeout)
            if res.status_code == 200:
                return res
        except requests.RequestException:
            if i == retries:
                raise
            sleep(2)
    return None

# ======================================================
# 出走表スクレイピング
# ======================================================
def fetch_today_data():
    print("🚀 出走表スクレイピング開始")
    today = datetime.date.today().strftime("%Y%m%d")
    data = {}

    for venue, code in VENUES.items():
        url = f"https://www.boatrace.jp/owpc/pc/race/racelist?jcd={code}&hd={today}"
        try:
            res = safe_get(url)
            if not res:
                raise Exception("接続エラー or 拒否応答")

            soup = BeautifulSoup(res.text, "html.parser")

            # 開催中 or 非開催
            title = soup.select_one(".heading2_title, .hdg__2")
            status = "開催中" if title and "開催" in title.text else "ー"

            races = {}
            for link in soup.select("a.btn--number, a.table1__raceNumberLink"):
                rno = link.text.strip().replace("R", "")
                race_url = "https://www.boatrace.jp" + link.get("href")

                race_res = safe_get(race_url)
                if not race_res:
                    continue
                race_soup = BeautifulSoup(race_res.text, "html.parser")

                entries = []
                for row in race_soup.select("table.is-tableFixed__3rdadd tbody tr, table.table1 tbody tr"):
                    cols = [td.get_text(strip=True) for td in row.select("td")]
                    if len(cols) >= 5:
                        entries.append({
                            "艇番": cols[0],
                            "選手名": cols[1],
                            "支部": cols[2],
                            "級": cols[3],
                            "F": cols[4],
                        })

                if entries:
                    races[rno] = {"entries": entries}

            data[venue] = {
                "date": today,
                "status": status,
                "races": races
            }

            print(f"✅ {venue} 完了 ({len(races)}R 取得)")
            sleep(1.0)
        except Exception as e:
            print(f"⚠️ {venue} 取得エラー: {e}")
            data[venue] = {"date": today, "status": "ー", "races": {}}

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ data.json 更新完了 ({len(data)}場)")

# ======================================================
# メイン
# ======================================================
if __name__ == "__main__":
    print("🚀 GitHub Actions 自動更新スクリプト開始")
    fetch_today_data()
    print("🎯 完了:", datetime.date.today())