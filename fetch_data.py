import requests
from bs4 import BeautifulSoup
import json
import random
from datetime import datetime
import os

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

DATA_PATH = "./data/data.json"
HISTORY_PATH = "./data/history.json"
BASE_URL = "https://www.boatrace.jp/owpc/pc/race/index"

today = datetime.now().strftime("%Y-%m-%d")

# ===========================
# 開催判定 & AI的中率
# ===========================
def get_venue_status(venue_id):
    """各場の開催有無を公式から判定"""
    try:
        url = f"{BASE_URL}?jcd={venue_id:02d}"
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        h2 = soup.find("h2", class_="heading1_title")
        if h2 and "開催中" in h2.text:
            return "開催中"
        else:
            return "ー"
    except Exception:
        return "ー"

def generate_hit_rate(venue_name):
    """AI的中率をランダムで生成"""
    return random.randint(40, 95)

# ===========================
# データ生成
# ===========================
def build_data():
    data = {}
    history = {}

    for vid, name in VENUES.items():
        status = get_venue_status(vid)
        hit_rate = generate_hit_rate(name)

        # 出走表データ（キーを文字列に変換）
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

        data[name] = {
            "status": status,
            "hit_rate": hit_rate,
            "races": races
        }

        # 履歴用ダミーデータ
        history[name] = {
            str(r): [
                {"number": i, "name": f"選手{i}", "st": round(random.uniform(0.10, 0.25), 2)}
                for i in range(1, 4)
            ] for r in range(1, 13)
        }

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
    print("🏁 競艇データ自動生成 開始")
    data, history = build_data()

    save_json(data, DATA_PATH)
    save_json(history, HISTORY_PATH)

    print(f"✅ 生成完了 {today}")
    print(f"├ data.json: {len(data)}場分")
    print(f"└ history.json: {len(history)}場分")