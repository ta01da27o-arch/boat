import os
import json
import datetime
import requests
from bs4 import BeautifulSoup

# ======================================================
#  基本設定
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
#  共通関数
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
#  出走表スクレイピング
# ======================================================
def scrape_race_entries(jcd, date):
    """指定場の1R〜12R出走表を取得"""
    entries = {}
    base_url = "https://www.boatrace.jp/owpc/pc/race/racelist"
    headers = {"User-Agent": "Mozilla/5.0"}

    for rno in range(1, 13):
        url = f"{base_url}?rno={rno}&jcd={jcd}&hd={date}"
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            continue

        soup = BeautifulSoup(res.text, "html.parser")
        race_title = soup.select_one("h2.heading2_title")
        if not race_title:
            continue  # 開催なし

        racers = []
        for row in soup.select("table.is-tableFixed__3rdadd tbody tr"):
            cells = [c.get_text(strip=True) for c in row.select("td")]
            if len(cells) < 2:
                continue
            racers.append(cells)

        entries[f"{rno}R"] = {
            "title": race_title.get_text(strip=True),
            "racers": racers
        }

    return entries

# ======================================================
#  データ更新処理
# ======================================================
def fetch_today_data():
    today = datetime.date.today().strftime("%Y%m%d")
    data = load_json(DATA_PATH)
    print(f"📅 本日: {today}")

    for vname, jcd in VENUES.items():
        print(f"🔍 {vname} のデータ取得中...")

        try:
            entries = scrape_race_entries(jcd, today)
            status = "開催中" if entries else "ー"
            data[vname] = {
                "status": status,
                "hit_rate": 0,
                "races": {
                    "date": today,
                    "status": status,
                    "results": [],
                    "entries": entries
                }
            }
        except Exception as e:
            print(f"⚠️ {vname} 取得エラー: {e}")
            data[vname] = {
                "status": "ー",
                "hit_rate": 0,
                "races": {"date": today, "status": "ー", "results": [], "entries": {}}
            }

    save_json(DATA_PATH, data)
    print(f"✅ data.json 更新完了 ({len(VENUES)}場)")

def update_history():
    history = load_json(HISTORY_PATH)
    today = datetime.date.today().strftime("%Y%m%d")
    data = load_json(DATA_PATH)

    history[today] = {
        v: {"date": today, "results": []}
        for v in data.keys()
    }

    cutoff = datetime.date.today() - datetime.timedelta(days=60)
    clean_history = {}
    for k, v in history.items():
        try:
            if len(k) >= 8:
                d = datetime.date.fromisoformat(f"{k[:4]}-{k[4:6]}-{k[6:8]}")
                if d >= cutoff:
                    clean_history[k] = v
        except Exception:
            continue

    save_json(HISTORY_PATH, clean_history)
    print(f"🧠 history.json 更新完了 ({len(clean_history)}日分保持)")

# ======================================================
#  メイン実行
# ======================================================
if __name__ == "__main__":
    print("🚀 Render 自動更新スクリプト開始")
    fetch_today_data()
    update_history()
    print("🎯 完了:", datetime.date.today())