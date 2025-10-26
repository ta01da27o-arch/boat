# fetch_data.py
# ---------------------------------------
# 競艇24場の開催情報を自動取得して data.json に保存
# Render / GitHub Actions 両対応版
# ---------------------------------------

import json
import os
import requests
import datetime
import time

# 保存先
DATA_PATH = os.path.join(os.path.dirname(__file__), "data.json")
HISTORY_PATH = os.path.join(os.path.dirname(__file__), "history.json")

# 全国24場
VENUES = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川",
    "浜名湖", "蒲郡", "常滑", "津", "三国",
    "びわこ", "住之江", "尼崎", "鳴門", "丸亀",
    "児島", "宮島", "徳山", "下関", "若松",
    "芦屋", "福岡", "唐津", "大村"
]

# 開催情報取得URL（例: BOAT RACE オフィシャル）
STATUS_URL = "https://www.boatrace.jp/owpc/pc/RaceRaceList"

# タイムアウトなどの設定
TIMEOUT = 5
RETRY_LIMIT = 3


def fetch_race_status(venue_name):
    """各場の開催判定を取得（開催中 / 非開催）"""
    try:
        for _ in range(RETRY_LIMIT):
            res = requests.get(f"{STATUS_URL}?jcd={VENUES.index(venue_name)+1:02}", timeout=TIMEOUT)
            if res.status_code == 200:
                html = res.text
                # 簡易的な開催判定
                if "レース一覧" in html or "締切" in html or "出走表" in html:
                    return "開催中"
                else:
                    return "ー"
            else:
                time.sleep(1)
        return "ー"
    except requests.RequestException:
        return "ー"


def load_json(file_path):
    """安全にJSONをロード"""
    if not os.path.exists(file_path):
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}


def save_json(file_path, data):
    """JSON保存"""
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    print("🚀 Render 自動更新スクリプト開始")

    today = datetime.date.today().strftime("%Y-%m-%d")

    # 既存データ読込
    data = load_json(DATA_PATH)
    history = load_json(HISTORY_PATH)

    new_data = {}
    new_history = {}

    for venue in VENUES:
        print(f"▶ {venue}：開催状況取得中…", end=" ")

        status = fetch_race_status(venue)

        # デフォルト構造
        new_data[venue] = {
            "status": status,
            "hit_rate": 0,
            "races": {}
        }

        # 過去履歴にも記録
        new_history[venue] = {
            "date": today,
            "status": status
        }

        print(status)

    # 保存
    save_json(DATA_PATH, new_data)
    save_json(HISTORY_PATH, new_history)

    print("✅ 完了:", today)
    print(f"├ data.json: {len(new_data)}場分")
    print(f"└ history.json: {len(new_history)}場分")


if __name__ == "__main__":
    main()