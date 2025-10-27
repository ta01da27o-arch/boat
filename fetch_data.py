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
#  スクレイピング
# ======================================================
def fetch_today_venues():
    url = "https://www.boatrace.jp/owpc/pc/race/index"
    res = requests.get(url, timeout=10)
    res.encoding = res.apparent_encoding
    soup = BeautifulSoup(res.text, "html.parser")

    today_venues = []
    for area in soup.select("div.table1 div.is-holding span"):
        name = area.get_text(strip=True)
        if name:
            today_venues.append(name)
    return today_venues


def fetch_race_table(venue_code, date):
    """1開催場分の出走表を取得"""
    all_races = {}

    for rno in range(1, 13):
        url = f"https://www.boatrace.jp/owpc/pc/race/racelist?rno={rno}&jcd={venue_code}&hd={date}"
        try:
            res = requests.get(url, timeout=10)
            res.encoding = res.apparent_encoding
            soup = BeautifulSoup(res.text, "html.parser")

            rows = []
            for tr in soup.select("table.is-tableFixed__3rdadd tbody tr"):
                tds = tr.find_all("td")
                if len(tds) < 4:
                    continue
                try:
                    waku = int(tds[0].get_text(strip=True))
                except:
                    continue
                name = tds[1].get_text(strip=True)
                shibu = tds[2].get_text(strip=True)
                kubetsu = tds[3].get_text(strip=True)
                rows.append({
                    "枠": waku,
                    "選手": name,
                    "支部": shibu,
                    "級別": kubetsu
                })
            if rows:
                all_races[f"{rno}R"] = rows
        except Exception as e:
            print(f"⚠️ {venue_code} {rno}R 取得失敗:", e)
            continue

    return all_races

# ======================================================
#  メイン更新
# ======================================================
def fetch_today_data():
    today = datetime.date.today().strftime("%Y%m%d")
    data = {}

    print("📡 本日の開催場を取得中...")
    try:
        holding_list = fetch_today_venues()
    except Exception as e:
        print("⚠️ スクレイピング失敗:", e)
        holding_list = []

    for v in VENUES:
        code = VENUE_CODES[v]
        status = "開催中" if v in holding_list else "ー"
        races = {}

        if status == "開催中":
            print(f"🚤 {v} の出走表を取得中...")
            races = fetch_race_table(code, today)

        data[v] = {
            "date": today,
            "status": status,
            "races": races
        }

    save_json(DATA_PATH, data)
    print(f"✅ data.json 更新完了 ({len(VENUES)}場)")
    return data

# ======================================================
#  履歴管理
# ======================================================
def update_history():
    history = load_json(HISTORY_PATH)
    today = datetime.date.today().strftime("%Y%m%d")
    data = load_json(DATA_PATH)

    history[today] = {v: {"date": today, "results": []} for v in data.keys()}

    cutoff = datetime.date.today() - datetime.timedelta(days=60)
    new_history = {}
    for k, v in history.items():
        try:
            dt = datetime.date.fromisoformat(f"{k[:4]}-{k[4:6]}-{k[6:8]}")
            if dt >= cutoff:
                new_history[k] = v
        except ValueError:
            continue

    save_json(HISTORY_PATH, new_history)
    print(f"🧠 history.json 更新完了 ({len(new_history)}日分保持)")

# ======================================================
#  実行
# ======================================================
if __name__ == "__main__":
    print("🚀 出走表スクレイピング開始")
    fetch_today_data()
    update_history()
    print("🎯 完了:", datetime.date.today())