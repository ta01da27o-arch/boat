import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import os
import time

VENUES = {
    1: "桐生", 2: "戸田", 3: "江戸川", 4: "平和島", 5: "多摩川",
    6: "浜名湖", 7: "蒲郡", 8: "常滑", 9: "津", 10: "三国",
    11: "びわこ", 12: "住之江", 13: "尼崎", 14: "鳴門", 15: "丸亀",
    16: "児島", 17: "宮島", 18: "徳山", 19: "下関", 20: "若松",
    21: "芦屋", 22: "福岡", 23: "唐津", 24: "大村"
}

DATA_PATH = "./data/data.json"
HISTORY_PATH = "./data/history.json"

BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"

def get_venue_data(venue_id, venue_name):
    params = {"jcd": f"{venue_id:02d}"}
    try:
        res = requests.get(BASE_URL, params=params, timeout=10)
        res.encoding = res.apparent_encoding
        soup = BeautifulSoup(res.text, "html.parser")
        status = "ー"
        h2 = soup.find("h2", class_="heading1_title")
        if h2 and "開催中" in h2.text:
            status = "開催中"

        races = {}
        # 各レース表を取得（例：テーブル .table1）― 必要に応じてセレクタ調整
        tables = soup.select(".table1")
        for idx, table in enumerate(tables[:12], start=1):
            race_no = str(idx)
            racers = []
            for tr in table.select("tbody tr"):
                tds = tr.find_all("td")
                if len(tds) < 8:
                    continue
                try:
                    number = idx  # or derive from cell
                    name = tds[2].text.strip()
                    grade = tds[3].text.strip()
                    st = float(tds[4].text.strip())
                    f_flag = tds[5].text.strip()
                    all_val = float(tds[6].text.strip())
                    local_val = float(tds[7].text.strip())
                    mt = round((all_val + local_val) / 2, 2)
                    course = int(tds[1].text.strip()) if tds[1].text.strip().isdigit() else idx
                    eval_mark = "◎"  # 簡易評価（必要ならロジックを追加）
                    racers.append({
                        "number": len(racers) + 1,
                        "name": name,
                        "grade": grade,
                        "st": st,
                        "f": f_flag,
                        "all": all_val,
                        "local": local_val,
                        "mt": mt,
                        "course": course,
                        "eval": eval_mark
                    })
                except Exception:
                    continue
            if racers:
                races[race_no] = racers

        hit_rate = round(random.uniform(40, 90), 0)  # or replace with real logic
        return {
            "status": status,
            "hit_rate": hit_rate,
            "races": races
        }
    except Exception as e:
        print(f"Error retrieving {venue_name}: {e}")
        return {
            "status": "ー",
            "hit_rate": 0,
            "races": {}
        }

def save_json(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    print("🏁 データ取得開始", datetime.now())
    all_data = {}
    history = {}
    for vid, name in VENUES.items():
        print(f"→ {name}")
        all_data[name] = get_venue_data(vid, name)
        # 履歴簡易版
        history[name] = {"last_update": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        time.sleep(1)  # サーバー負荷軽減
    save_json(all_data, DATA_PATH)
    save_json(history, HISTORY_PATH)
    print("✅ 保存完了", datetime.now())