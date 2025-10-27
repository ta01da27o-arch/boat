import os
import json
import datetime
import requests
from bs4 import BeautifulSoup

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

# ======================================================
# ユーティリティ
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

# ======================================================
# 出走表スクレイピング
# ======================================================
def scrape_races(venue_name, venue_id):
    """公式サイトから出走表を取得"""
    today = datetime.date.today().strftime("%Y%m%d")
    url = f"https://www.boatrace.jp/owpc/pc/race/racelist?rno=1&jcd={venue_id}&hd={today}"

    try:
        res = requests.get(url, timeout=10)
        res.encoding = "utf-8"
        if res.status_code != 200:
            return {"status": "ー", "races": {}}

        soup = BeautifulSoup(res.text, "html.parser")
        title = soup.select_one(".heading1_title")
        status = "開催中" if title else "ー"

        races = {}
        race_links = soup.select(".table1_boatImage1 tbody tr td a")
        race_numbers = sorted(list(set([a.get("href").split("rno=")[1].split("&")[0] for a in race_links])))

        for rno in race_numbers:
            race_url = f"https://www.boatrace.jp/owpc/pc/race/racelist?rno={rno}&jcd={venue_id}&hd={today}"
            rres = requests.get(race_url)
            rres.encoding = "utf-8"
            rsoup = BeautifulSoup(rres.text, "html.parser")

            rows = []
            table = rsoup.select_one(".table1_boatImage1 tbody")
            if not table:
                continue

            for tr in table.select("tr"):
                cols = [c.get_text(strip=True) for c in tr.select("td")]
                if len(cols) < 4:
                    continue
                rows.append({
                    "枠": cols[0],
                    "選手": cols[2],
                    "支部": cols[3],
                    "級別": cols[4] if len(cols) > 4 else ""
                })

            races[f"{rno}R"] = rows

        return {
            "date": today,
            "status": status,
            "races": races
        }

    except Exception as e:
        print(f"⚠️ {venue_name} 取得失敗: {e}")
        return {"status": "ー", "races": {}}

# ======================================================
# データ更新
# ======================================================
def update_data():
    print("🚀 出走表スクレイピング開始")
    today = datetime.date.today().strftime("%Y%m%d")
    data = {}

    for venue, vid in VENUES.items():
        print(f"📡 {venue} 取得中...")
        race_data = scrape_races(venue, vid)
        data[venue] = race_data

    save_json(DATA_PATH, data)
    print(f"✅ data.json 更新完了 ({len(VENUES)}場)")

def update_history():
    print("🧠 履歴更新中...")
    history = load_json(HISTORY_PATH)
    data = load_json(DATA_PATH)
    today = datetime.date.today().strftime("%Y%m%d")

    history[today] = {
        v: {"date": today, "results": []} for v in data.keys()
    }

    cutoff = datetime.date.today() - datetime.timedelta(days=60)
    history = {
        k: v for k, v in history.items()
        if datetime.date.fromisoformat(k[:4]+"-"+k[4:6]+"-"+k[6:8]) >= cutoff
    }

    save_json(HISTORY_PATH, history)
    print(f"🧠 history.json 更新完了 ({len(history)}日分保持)")

# ======================================================
# メイン
# ======================================================
if __name__ == "__main__":
    update_data()
    update_history()
    print("🎯 完了:", datetime.date.today())