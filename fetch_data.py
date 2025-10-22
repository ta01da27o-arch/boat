# =======================================
# fetch_data.py — 本日分データ取得＋履歴60日管理版
# =======================================
import subprocess
import sys
import os
import json
import datetime
import time
import requests
from bs4 import BeautifulSoup

# ---- 必要ライブラリ自動インストール（GitHub Actions対応） ----
def ensure_package(pkg):
    try:
        __import__(pkg)
    except ImportError:
        print(f"📦 Installing missing package: {pkg} …")
        subprocess.run([sys.executable, "-m", "pip", "install", pkg], check=False)

for pkg in ["requests", "beautifulsoup4", "lxml"]:
    ensure_package(pkg)

# ===== 保存フォルダ／ファイル =====
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DATA_FILE    = os.path.join(DATA_DIR, "data.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")

# ===== 会場コード（JCD）マップ =====
VENUE_LIST = {
    "桐生": "01", "戸田": "02", "江戸川": "03", "平和島": "04", "多摩川": "05", "浜名湖": "06",
    "蒲郡": "07", "常滑": "08", "津": "09", "三国": "10", "琵琶湖": "11", "住之江": "12",
    "尼崎": "13", "鳴門": "14", "丸亀": "15", "児島": "16", "宮島": "17", "徳山": "18",
    "下関": "19", "若松": "20", "芦屋": "21", "福岡": "22", "唐津": "23", "大村": "24"
}

# ===== URL テンプレート =====
BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"

def fetch_venue_races(date_str, venue_name, jcd):
    """指定日・会場の出走表を取得。
       戻り値： { "venue": venue_name, "races": [ { "race_no": i, "boats": [ {...}, ... ] }, ... ] }
    """
    result = {
        "venue": venue_name,
        "races": []
    }
    for race_no in range(1, 13):  # 1〜12レース想定
        params = {
            "hd": date_str,
            "jcd": jcd,
            "rno": race_no
        }
        try:
            resp = requests.get(BASE_URL, params=params, timeout=10)
            resp.encoding = resp.apparent_encoding
            if resp.status_code != 200:
                print(f"⚠️ {venue_name} {race_no}R HTTPエラー：{resp.status_code}")
                continue

            soup = BeautifulSoup(resp.text, "lxml")
            # 出走表テーブルを探す（サイト構造に応じてセレクタ調整が必要）
            table = soup.select_one("table.is-tableFixed__3rdadd")
            if not table:
                print(f"⚠️ {venue_name} {race_no}R：テーブル未検出")
                continue

            boats = []
            for row in table.select("tbody tr"):
                cols = [c.get_text(strip=True) for c in row.select("td")]
                if len(cols) < 6:
                    continue
                # 以下、取得可能な項目を適宜追加
                boats.append({
                    "boat_number": int(cols[0]),
                    "racer_name": cols[1],
                    "racer_class": cols[2],
                    "start_timing": float(cols[5]) if cols[5] != "-" else None,
                    # 以下、初期値／未取得
                    "flying_count": None,
                    "national_win_rate": None,
                    "local_win_rate": None,
                    "motor_win_rate": None,
                    "course_win_rate": None
                })

            result["races"].append({
                "race_no": race_no,
                "boats": boats
            })

            # サイト負荷軽減のため少し待機
            time.sleep(0.2)
        except Exception as e:
            print(f"❌ {venue_name} {race_no}R 取得中エラー：{e}")
    return result

def fetch_today_all(date_str):
    """当日分すべての会場を取得。"""
    all_venues = {}
    for venue_name, jcd in VENUE_LIST.items():
        print(f"⏳ {date_str} {venue_name} 取得開始")
        vdata = fetch_venue_races(date_str, venue_name, jcd)
        all_venues[venue_name] = vdata
    return all_venues

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_history(history):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def prune_history(history, keep_days=60):
    """履歴から keep_days より古いデータを削除"""
    cutoff = (datetime.datetime.now() - datetime.timedelta(days=keep_days)).strftime("%Y%m%d")
    keys = list(history.keys())
    for d in keys:
        if d < cutoff:
            print(f"🗑 {d} を履歴から削除")
            del history[d]
    return history

def main():
    today = datetime.datetime.now().strftime("%Y%m%d")
    print(f"📅 本日キー: {today}")

    # 取得
    all_today = fetch_today_all(today)

    # 保存 本日データ
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({today: all_today}, f, ensure_ascii=False, indent=2)
    print(f"✅ 本日データを保存：{DATA_FILE}")

    # 履歴更新
    history = load_history()
    history[today] = all_today
    history = prune_history(history, keep_days=60)
    save_history(history)
    print(f"✅ 履歴を更新：{HISTORY_FILE} (直近 {60} 日分保持)")

if __name__ == "__main__":
    main()