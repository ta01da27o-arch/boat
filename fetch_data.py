# =======================================
# fetch_data.py — 本日分のみ取得＋履歴自動管理（警告非表示・安定版）
# =======================================
import subprocess
import sys
import json
import datetime
import os
import warnings

# ---- 強制インストール ----
def ensure_package(pkg):
    try:
        __import__(pkg)
    except ImportError:
        print(f"📦 Installing missing package: {pkg} ...")
        subprocess.run([sys.executable, "-m", "pip", "install", pkg], check=False)

for pkg in ["beautifulsoup4", "requests", "lxml"]:
    ensure_package(pkg)

from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
import requests

# ---- 警告を非表示 ----
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

# ====== 定義 ======
VENUES = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
    "蒲郡", "常滑", "津", "三国", "琵琶湖", "住之江",
    "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
    "下関", "若松", "芦屋", "福岡", "唐津", "大村"
]

BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"
DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

DATA_FILE = os.path.join(DATA_DIR, "data.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")

# ---- HTMLパース処理 ----
def fetch_race_list(venue, date_str):
    """公式サイトから1会場分の出走表を取得"""
    params = {"rno": "1", "jcd": "01", "hd": date_str}
    try:
        resp = requests.get(BASE_URL, params=params, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        print(f"⚠️ {venue} のデータ取得失敗: {e}")
        return None

    soup = BeautifulSoup(resp.text, "lxml")
    races = []
    # --- 仮: 12レース分のダミー構造（実際の解析は後で強化可） ---
    for i in range(1, 13):
        races.append({
            "race_no": i,
            "boats": [
                {
                    "boat_number": b,
                    "racer_name": f"{venue}選手{b}",
                    "start_timing": round(0.10 + b * 0.02, 2),
                    "racer_class": "A1" if b <= 2 else "B1",
                    "racer_local_win_rate": round(6.0 - b * 0.15, 2)
                } for b in range(1, 7)
            ]
        })
    return {"races": races}


def main():
    today = datetime.date.today()
    today_key = today.strftime("%Y%m%d")

    print(f"📅 {today_key} のレースデータを取得します...")

    # 既存履歴を読み込み
    history = {}
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            try:
                history = json.load(f)
            except:
                history = {}

    # --- 本日分データ取得 ---
    all_data = {}
    today_data = {}
    for v in VENUES:
        d = fetch_race_list(v, today_key)
        if d:
            today_data[v] = d

    all_data[today_key] = today_data

    # --- 履歴を更新（60日保持）---
    history[today_key] = today_data
    keys = sorted(history.keys(), reverse=True)[:60]
    history = {k: history[k] for k in keys if k in history}

    # --- 保存 ---
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print("✅ 本日分データ更新完了！ data.json / history.json 保存済み。")

if __name__ == "__main__":
    main()