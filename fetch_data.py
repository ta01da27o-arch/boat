import os
import json
import datetime
import requests
from bs4 import BeautifulSoup
from time import sleep

# ==============================
# 設定
# ==============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DATA_PATH = os.path.join(DATA_DIR, "data.json")

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
    "Referer": "https://www.boatrace.jp/",
    "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
}

# ==============================
# 共通関数
# ==============================
def safe_get(url, retries=2, timeout=15):
    for i in range(retries + 1):
        try:
            r = requests.get(url, headers=HEADERS, timeout=timeout)
            if r.status_code == 200:
                return r
        except Exception:
            if i == retries:
                return None
            sleep(1.5)
    return None

# ==============================
# 出走表取得
# ==============================
def fetch_today():
    today = datetime.date.today().strftime("%Y%m%d")
    print("🚀 出走表スクレイピング開始")
    data = {}

    for venue, code in VENUES.items():
        url = f"https://www.boatrace.jp/owpc/pc/race/racelist?jcd={code}&hd={today}"
        print(f"📡 {venue} 取得中...")
        try:
            res = safe_get(url)
            if not res:
                raise Exception("接続エラー")

            soup = BeautifulSoup(res.text, "html.parser")
            races = {}

            # R番号リンク（どちらの構造にも対応）
            links = soup.select("a.table1__raceNumberLink, a.btn--number")
            for link in links:
                href = link.get("href")
                if not href or "raceresult" in href:
                    continue
                rno = link.text.strip().replace("R", "")
                race_url = "https://www.boatrace.jp" + href

                race_res = safe_get(race_url)
                if not race_res:
                    continue
                rsoup = BeautifulSoup(race_res.text, "html.parser")

                # 出走表テーブルを抽出（複数の可能性対応）
                rows = rsoup.select("table.is-tableFixed__3rdadd tbody tr, table.table1 tbody tr")
                entries = []
                for row in rows:
                    cols = [td.get_text(strip=True) for td in row.select("td")]
                    if len(cols) >= 5 and cols[0].isdigit():
                        entries.append({
                            "艇番": cols[0],
                            "選手名": cols[1],
                            "支部": cols[2],
                            "級": cols[3],
                            "F": cols[4] if len(cols) > 4 else ""
                        })

                if entries:
                    races[rno] = {"entries": entries}

            status = "開催中" if races else "ー"
            data[venue] = {"date": today, "status": status, "races": races}

            print(f"✅ {venue} 完了 ({len(races)}R 取得)")
            sleep(1)
        except Exception as e:
            print(f"⚠️ {venue} 取得エラー: {e}")
            data[venue] = {"date": today, "status": "ー", "races": {}}

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ data.json 更新完了 ({len(data)}場)")
    print("🎯 完了:", today)

# ==============================
if __name__ == "__main__":
    print("🚀 GitHub Actions 自動更新スクリプト開始")
    fetch_today()