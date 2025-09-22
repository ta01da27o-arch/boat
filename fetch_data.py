import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

# 出走表のベースURL
BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"

# 全国24会場（場コードと名称の対応）
VENUES = {
    1: "桐生", 2: "戸田", 3: "江戸川", 4: "平和島", 5: "多摩川", 6: "浜名湖",
    7: "蒲郡", 8: "常滑", 9: "津", 10: "三国", 11: "びわこ", 12: "住之江",
    13: "尼崎", 14: "鳴門", 15: "丸亀", 16: "児島", 17: "宮島", 18: "徳山",
    19: "下関", 20: "若松", 21: "芦屋", 22: "福岡", 23: "唐津", 24: "大村"
}

def fetch_race_data():
    today = datetime.now().strftime("%Y%m%d")
    programs = []

    for jcd, name in VENUES.items():
        url = f"{BASE_URL}?jcd={jcd:02d}&hd={today}"
        try:
            r = requests.get(url, timeout=10)
            r.raise_for_status()
        except Exception as e:
            print(f"❌ {name} の取得失敗: {e}")
            continue

        soup = BeautifulSoup(r.text, "html.parser")
        race_tables = soup.select(".is-lineH2")  # レースごとのテーブル見出し
        races = []

        for idx, race in enumerate(race_tables, start=1):
            title = race.get_text(strip=True)

            # 各レースの出走表テーブルを取得
            table = race.find_next("table")
            boats = []
            if table:
                rows = table.select("tbody tr")
                for row in rows:
                    cols = row.find_all("td")
                    if len(cols) < 5:
                        continue
                    try:
                        lane = int(cols[0].get_text(strip=True))
                        racer = cols[1].get_text(strip=True)
                        age = int(cols[2].get_text(strip=True))
                        branch = cols[3].get_text(strip=True)
                        rank = cols[4].get_text(strip=True)
                    except:
                        continue

                    boats.append({
                        "lane": lane,
                        "racer": racer,
                        "age": age,
                        "branch": branch,
                        "rank": rank
                    })

            races.append({
                "number": idx,
                "title": title,
                "boats": boats
            })

        programs.append({
            "venue": name,
            "races": races
        })

    # JSON形式にまとめる
    data = {
        "date": today,
        "programs": programs,
        "stats": {},
        "history": []
    }

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("✅ data.json を更新しました")

if __name__ == "__main__":
    fetch_race_data()