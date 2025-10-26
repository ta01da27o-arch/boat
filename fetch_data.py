import os
import json
import datetime
import requests
from pathlib import Path

# ====== ファイル設定 ======
DATA_FILE = Path("data/data.json")
HISTORY_FILE = Path("data/history.json")

# ====== 全国24場リスト ======
VENUES = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
    "蒲郡", "常滑", "津", "三国", "びわこ", "住之江", "尼崎",
    "鳴門", "丸亀", "児島", "宮島", "徳山", "下関", "若松",
    "芦屋", "福岡", "唐津", "大村"
]

# ====== 仮スクレイピング関数 ======
def fetch_today_data():
    """
    本日の全レースデータを取得（仮実装）
    実際は公式サイトからスクレイピングして返す構造に変更予定
    """
    today_str = datetime.date.today().strftime("%Y%m%d")
    today_data = {}

    for venue in VENUES:
        today_data[venue] = {
            "date": today_str,
            "status": "開催中",
            "results": [],
        }
    return today_data


# ====== JSON読み書き ======
def load_json(path):
    if not path.exists():
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"⚠️ JSON 読み込みエラー: {path}")
        return {}


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ====== メイン更新処理 ======
def update_data():
    print("🚀 Render 自動更新スクリプト開始")

    data = load_json(DATA_FILE)
    history = load_json(HISTORY_FILE)

    today = datetime.date.today()
    today_str = today.strftime("%Y%m%d")
    cutoff = today - datetime.timedelta(days=60)

    # ==============================
    # ① 今日の全レースデータ取得
    # ==============================
    today_races = fetch_today_data()
    print(f"📅 本日データ: {today_str} ({len(today_races)}場)")

    # ==============================
    # ② history.json に追加 or 更新
    # ==============================
    if today_str not in history:
        history[today_str] = today_races
        print(f"🧩 {today_str} のデータを追加しました")
    else:
        print(f"🔁 {today_str} は既に存在 → 更新スキップ")

    # ==============================
    # ③ 古い日付データ削除（60日保持）
    # ==============================
    for key in list(history.keys()):
        # 日付形式以外（例: "桐生"）を除外
        if not key.isdigit():
            continue
        try:
            key_date = datetime.datetime.strptime(key, "%Y%m%d").date()
        except ValueError:
            continue
        if key_date < cutoff:
            del history[key]
            print(f"🧹 古いデータ削除: {key}")

    # ==============================
    # ④ data.json 更新（最新状態）
    # ==============================
    for venue in VENUES:
        if venue not in data:
            data[venue] = {"status": "ー", "hit_rate": 0, "races": {}}

        if venue in today_races:
            data[venue]["status"] = today_races[venue]["status"]
            data[venue]["races"] = today_races[venue]
        else:
            data[venue]["status"] = "ー"
            data[venue]["races"] = {}

    # 保存
    save_json(DATA_FILE, data)
    save_json(HISTORY_FILE, history)

    print("✅ 自動更新完了")
    print(f"🧠 現在保持中: {len(history.keys())}日分")
    print(f"📦 data.json: {len(data.keys())}場")


if __name__ == "__main__":
    update_data()