import os
import json
import datetime
import requests
from bs4 import BeautifulSoup
from time import sleep

# ======================================================
# 基本設定
# ======================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DATA_PATH = os.path.join(DATA_DIR, "data.json")
HISTORY_PATH = os.path.join(DATA_DIR, "history.json")

VENUES = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川",
    "浜名湖", "蒲郡", "常滑", "津", "三国",
    "びわこ", "住之江", "尼崎", "鳴門", "丸亀",
    "児島", "宮島", "徳山", "下関", "若松",
    "芦屋", "福岡", "唐津", "大村"
]

VENUE_CODES = {
    "桐生": "01", "戸田": "02", "江戸川": "03", "平和島": "04", "多摩川": "05",
    "浜名湖": "06", "蒲郡": "07", "常滑": "08", "津": "09", "三国": "10",
    "びわこ": "11", "住之江": "12", "尼崎": "13", "鳴門": "14", "丸亀": "15",
    "児島": "16", "宮島": "17", "徳山": "18", "下関": "19", "若松": "20",
    "芦屋": "21", "福岡": "22", "唐津": "23", "大村": "24"
}

# ======================================================
# 共通関数
# ======================================================
def load_json(path):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def safe_request(url, retries=2, timeout=20):
    """タイムアウト・接続エラーを再試行"""
    for i in range(retries + 1):
        try:
            res = requests.get(url, timeout=timeout)
            if res.status_code == 200:
                return res
        except requests.RequestException as e:
            if i == retries:
                raise e
            sleep(2)
    return None

# ======================================================
# 出走表スクレイピング
# ======================================================
def fetch_today_data():
    print("🚀 出走表スクレイピング開始")
    today = datetime.date.today().strftime("%Y%m%d")
    data = {}

    for venue in VENUES:
        venue_code = VENUE_CODES[venue]
        url = f"https://www.boatrace.jp/owpc/pc/race/racelist?jcd={venue_code}&hd={today}"

        try:
            res = safe_request(url)
            if not res:
                raise Exception("接続エラー")
            res.encoding = res.apparent_encoding
            soup = BeautifulSoup(res.text, "html.parser")

            # 開催判定
            title = soup.select_one(".heading2_title, .hdg__2")
            status = "開催中" if title and any(x in title.text for x in ["開催", "中"]) else "ー"

            races = {}
            race_links = soup.select("a.btn--number, a.table1__raceNumberLink")
            for link in race_links:
                rno = link.text.strip().replace("R", "")
                race_url = f"https://www.boatrace.jp{link.get('href')}"

                race_res = safe_request(race_url)
                if not race_res:
                    continue

                race_soup = BeautifulSoup(race_res.text, "html.parser")
                entries = []
                rows = race_soup.select("table.is-tableFixed__3rdadd tbody tr, table.table1 tbody tr")
                for row in rows:
                    cols = [td.get_text(strip=True) for td in row.select("td")]
                    if len(cols) >= 5:
                        entries.append({
                            "艇番": cols[0],
                            "選手名": cols[1],
                            "支部": cols[2],
                            "級": cols[3],
                            "F": cols[4] if len(cols) > 4 else "",
                        })

                if entries:
                    races[rno] = {"entries": entries}

            data[venue] = {
                "date": today,
                "status": status,
                "races": races
            }

            print(f"✅ {venue} 完了 ({len(races)}R 取得)")
            sleep(1.2)  # アクセス制限回避

        except Exception as e:
            print(f"⚠️ {venue} 取得エラー: {e}")
            data[venue] = {"date": today, "status": "ー", "races": {}}

    save_json(DATA_PATH, data)
    print(f"✅ data.json 更新完了 ({len(data)}場)")

# ======================================================
# 履歴更新
# ======================================================
def update_history():
    history = load_json(HISTORY_PATH)
    today = datetime.date.today().strftime("%Y%m%d")
    data = load_json(DATA_PATH)

    history[today] = {v: {"date": today, "results": d.get("races", {})} for v, d in data.items()}

    cutoff = datetime.date.today() - datetime.timedelta(days=60)
    history = {k: v for k, v in history.items()
               if datetime.date.fromisoformat(k[:4]+"-"+k[4:6]+"-"+k[6:8]) >= cutoff}

    save_json(HISTORY_PATH, history)
    print(f"🧠 history.json 更新完了 ({len(history)}日分保持)")

# ======================================================
# メイン
# ======================================================
if __name__ == "__main__":
    print("🚀 Render 自動更新スクリプト開始")
    fetch_today_data()
    update_history()
    print("🎯 完了:", datetime.date.today())