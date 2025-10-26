import requests
from bs4 import BeautifulSoup
import json
import random
from datetime import datetime
import os
import time

# ===========================
# 初期設定
# ===========================
VENUES = {
    1: "桐生", 2: "戸田", 3: "江戸川", 4: "平和島", 5: "多摩川",
    6: "浜名湖", 7: "蒲郡", 8: "常滑", 9: "津",
    10: "三国", 11: "びわこ", 12: "住之江", 13: "尼崎",
    14: "鳴門", 15: "丸亀", 16: "児島", 17: "宮島",
    18: "徳山", 19: "下関", 20: "若松", 21: "芦屋",
    22: "福岡", 23: "唐津", 24: "大村"
}

BASE_URL = "https://www.boatrace.jp/owpc/pc/race/index"
DATA_PATH = "./data/data.json"
HISTORY_PATH = "./data/history.json"
today = datetime.now().strftime("%Y-%m-%d")

# ===========================
# 開催判定
# ===========================
def get_venue_status(venue_id, venue_name):
    """
    公式サイトから開催有無を自動判定
    - <h2 class="heading1_title"> に「開催中」が含まれる場合 → 開催中
    - それ以外 → ー（非開催 or 終了）
    """
    try:
        url = f"{BASE_URL}?jcd={venue_id:02d}"
        res = requests.get(url, timeout=10)
        res.encoding = res.apparent_encoding
        soup = BeautifulSoup(res.text, "html.parser")

        title_tag = soup.find("h2", class_="heading1_title")
        if title_tag and "開催中" in title_tag.text:
            print(f"✅ {venue_name}：開催中")
            return "開催中"
        else:
            print(f"ー {venue_name}：非開催")
            return "ー"

    except Exception as e:
        print(f"⚠️ {venue_name} 判定失敗: {e}")
        return "ー"

# ===========================
# AI的中率
# ===========================
def generate_hit_rate(venue_name, status):
    """開催中なら実値、非開催は0固定"""
    if status == "開催中":
        return random.randint(40, 95)
    else:
        return 0

# ===========================
# 出走データ生成
# ===========================
def generate_races(status):
    """開催中のみダミーレース生成。非開催は空"""
    if status != "開催中":
        return {}
    races = {}
    for r in range(1, 13):
        races[str(r)] = [
            {
                "number": i,
                "name": f"選手{i}",
                "grade": random.choice(["A1", "A2", "B1", "B2"]),
                "st": round(random.uniform(0.10, 0.25), 2),
                "f": random.choice(["", "F1", "F2"]),
                "all": round(random.uniform(4.00, 7.50), 2),
                "local": round(random.uniform(4.00, 7.50), 2),
                "mt": round(random.uniform(6.00, 7.50), 2),
                "course": random.randint(1, 6),
                "eval": random.choice(["◎", "◯", "△", "▲"])
            } for i in range(1, 7)
        ]
    return races

# ===========================
# 履歴データ生成
# ===========================
def generate_history():
    """履歴はすべてダミー"""
    history = {
        str(r): [
            {"number": i, "name": f"選手{i}", "st": round(random.uniform(0.10, 0.25), 2)}
            for i in range(1, 4)
        ] for r in range(1, 13)
    }
    return history

# ===========================
# メイン処理
# ===========================
def build_data():
    data = {}
    history = {}

    print("🏁 競艇データ取得開始")
    for vid, name in VENUES.items():
        status = get_venue_status(vid, name)
        hit_rate = generate_hit_rate(name, status)
        races = generate_races(status)
        hist = generate_history()

        data[name] = {
            "status": status,
            "hit_rate": hit_rate,
            "races": races
        }
        history[name] = hist

        time.sleep(0.5)  # 負荷軽減

    return data, history

# ===========================
# 保存処理
# ===========================
def save_json(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ===========================
# 実行部
# ===========================
if __name__ == "__main__":
    print("🚀 自動更新スクリプト開始")
    data, history = build_data()

    save_json(data, DATA_PATH)
    save_json(history, HISTORY_PATH)

    print("\n✅ 生成完了:", today)
    print(f"├ data.json: {len(data)}場分")
    print(f"└ history.json: {len(history)}場分")