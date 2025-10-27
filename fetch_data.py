import os
import json
import datetime
from bs4 import BeautifulSoup
import requests

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
#  データ更新処理
# ======================================================
def fetch_today_data():
    """本日の開催情報（仮:スクレイピング or 代替）"""
    today = datetime.date.today().strftime("%Y%m%d")
    data = load_json(DATA_PATH)

    for v in VENUES:
        # 仮の開催ステータス（本来はスクレイピングで判定）
        status = "開催中" if hash(v + today) % 3 == 0 else "ー"

        data[v] = {
            "status": status,
            "hit_rate": 0,
            "races": {
                "date": today,
                "status": status,
                "results": [],
                "entries": {}
            }
        }

    save_json(DATA_PATH, data)
    print(f"✅ data.json 更新完了 ({len(VENUES)}場)")

def update_history():
    """過去60日分の履歴管理"""
    history = load_json(HISTORY_PATH)
    today = datetime.date.today().strftime("%Y%m%d")
    data = load_json(DATA_PATH)

    history[today] = {
        v: {"date": today, "results": []}
        for v in data.keys()
    }

    # 古いデータ削除（60日保持）
    cutoff = datetime.date.today() - datetime.timedelta(days=60)
    history = {
        k: v for k, v in history.items()
        if datetime.date.fromisoformat(k[:4]+"-"+k[4:6]+"-"+k[6:8]) >= cutoff
    }

    save_json(HISTORY_PATH, history)
    print(f"🧠 history.json 更新完了 ({len(history)}日分保持)")

# ======================================================
#  メイン実行
# ======================================================
if __name__ == "__main__":
    print("🚀 Render 自動更新スクリプト開始")
    fetch_today_data()
    update_history()
    print("🎯 完了:", datetime.date.today())