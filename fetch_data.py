import os
import json
import datetime
import requests
from bs4 import BeautifulSoup

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

# ======================================================
# 出走表スクレイピング
# ======================================================
def fetch_today_data():
    """ボートレース公式サイトから本日の出走表を取得"""
    print("🚀 出走表スクレイピング開始")
    today = datetime.date.today().strftime("%Y%m%d")

    data = {}
    for venue in VENUES:
        venue_code = VENUE_CODES[venue]
        url = f"https://www.boatrace.jp/owpc/pc/race/racelist?jcd={venue_code}&hd={today}"

        try:
            res = requests.get(url, timeout=10)
            res.encoding = res.apparent_encoding
            soup = BeautifulSoup(res.text, "html.parser")

            # 開催中判定（ヘッダーに「開催中」が含まれる場合）
            title = soup.select_one(".hdg__2")
            status = "開催中" if title and "中" in title.text else "ー"

            races = {}
            race_links = soup.select("a.btn--number")
            if race_links:
                for link in race_links:
                    rno = link.text.strip().replace("R", "")
                    race_url = f"https://www.boatrace.jp{link.get('href')}"
                    race_res = requests.get(race_url, timeout=10)
                    race_soup = BeautifulSoup(race_res.text, "html.parser")

                    entries = []
                    rows = race_soup.select("table.is-tableFixed__3rdadd tbody tr")
                    for row in rows:
                        cols = [td.get_text(strip=True) for td in row.select("td")]
                        if len(cols) >= 6:
                            entries.append({
                                "艇番": cols[0],
                                "選手名": cols[1],
                                "支部": cols[2],
                                "級": cols[3],
                                "F": cols[4],
                                "L": cols[5],
                            })

                    races[rno] = {"entries": entries}

            data[venue] = {
                "date": today,
                "status": status,
                "races": races
            }

            print(f"✅ {venue} 完了 ({len(races)}R 取得)")

        except Exception as e:
            print(f"⚠️ {venue} 取得エラー: {e}")
            data[venue] = {"date": today, "status": "ー", "races": {}}

    save_json(DATA_PATH, data)
    print(f"✅ data.json 更新完了 ({len(data)}場)")

# ======================================================
# 履歴更新処理
# ======================================================
def update_history():
    history = load_json(HISTORY_PATH)
    today = datetime.date.today().strftime("%Y%m%d")
    data = load_json(DATA_PATH)

    history[today] = {
        v: {"date": today, "results": d.get("races", {})}
        for v, d in data.items()
    }

    cutoff = datetime.date.today() - datetime.timedelta(days=60)
    history = {
        k: v for k, v in history.items()
        if datetime.date.fromisoformat(k[:4]+"-"+k[4:6]+"-"+k[6:8]) >= cutoff
    }

    save_json(HISTORY_PATH, history)
    print(f"🧠 history.json 更新完了 ({len(history)}日分保持)")

# ======================================================
# メイン実行
# ======================================================
if __name__ == "__main__":
    print("🚀 Render 自動更新スクリプト開始")
    fetch_today_data()
    update_history()
    print("🎯 完了:", datetime.date.today())