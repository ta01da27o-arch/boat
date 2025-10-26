import json
import datetime
import os
import requests
from bs4 import BeautifulSoup

DATA_DIR = "data"
DATA_PATH = os.path.join(DATA_DIR, "data.json")
HISTORY_PATH = os.path.join(DATA_DIR, "history.json")

VENUES = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川",
    "浜名湖", "蒲郡", "常滑", "津", "三国", "びわこ",
    "住之江", "尼崎", "鳴門", "丸亀", "児島", "宮島",
    "徳山", "下関", "若松", "芦屋", "福岡", "唐津", "大村"
]

# -------------------------
# 仮スクレイピング関数（後で本実装予定）
# -------------------------
def fetch_today_data():
    today_data = {}
    today = datetime.date.today().isoformat()  # ← "2025-10-27" 形式

    for venue in VENUES:
        try:
            # ★後でスクレイピング実装
            today_data[venue] = {
                "status": "ー",
                "hit_rate": 0,
                "races": {}
            }
        except Exception as e:
            today_data[venue] = {"status": f"error: {e}", "races": {}}
    return today, today_data


# -------------------------
# 履歴更新処理
# -------------------------
def update_history(today, today_data):
    # 既存読み込み
    if os.path.exists(HISTORY_PATH):
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            try:
                history = json.load(f)
            except json.JSONDecodeError:
                history = {}
    else:
        history = {}

    # 🔧 キー統一: "YYYY-MM-DD"
    history[today] = {}
    for venue, info in today_data.items():
        history[today][venue] = {
            "date": today,
            "status": info.get("status", "ー"),
            "hit_rate": info.get("hit_rate", 0),
            "results": info.get("races", {})
        }

    # 🧹 古いデータ削除（60日より前のもの）
    cutoff = datetime.date.today() - datetime.timedelta(days=60)
    valid_history = {}
    for key, val in history.items():
        try:
            date_obj = datetime.date.fromisoformat(key)
            if date_obj >= cutoff:
                valid_history[key] = val
        except ValueError:
            continue

    # 保存
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(valid_history, f, ensure_ascii=False, indent=2)


# -------------------------
# 最新data.json更新
# -------------------------
def update_data():
    today, today_data = fetch_today_data()

    os.makedirs(DATA_DIR, exist_ok=True)

    # data.json 保存
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(today_data, f, ensure_ascii=False, indent=2)

    # history.json 更新
    update_history(today, today_data)

    print(f"✅ 完了: {today}")
    print(f"├ data.json: {len(today_data)}場分")
    print(f"└ history.json: 最新 + 過去60日維持")


# -------------------------
# 実行
# -------------------------
if __name__ == "__main__":
    print("🚀 Render 自動更新スクリプト開始")
    update_data()