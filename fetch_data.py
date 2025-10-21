import requests
from bs4 import BeautifulSoup
import json
import csv
import datetime
import os

# ====== 会場リスト（2025年版）======
VENUES = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
    "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
    "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
    "下関", "若松", "芦屋", "福岡", "唐津", "大村"
]

# ====== スクレイピングURL (例: boatrace.jp) ======
BASE_URL = "https://boatrace.jp/owpc/pc/race/index?jcd={jcd}&rno=1"

def fetch_today_races():
    today = datetime.date.today().strftime("%Y%m%d")
    races = []

    for i, venue in enumerate(VENUES, start=1):
        jcd = str(i).zfill(2)
        url = BASE_URL.format(jcd=jcd)
        print(f"Fetching {venue} ... {url}")

        try:
            res = requests.get(url, timeout=10)
            res.encoding = res.apparent_encoding
            soup = BeautifulSoup(res.text, "html.parser")

            title = soup.select_one("h2.heading1_title")
            if not title:
                print(f"⚠️ {venue}: データなし")
                continue

            race_title = title.text.strip()
            races.append({
                "date": today,
                "venue": venue,
                "race_title": race_title,
                "url": url
            })

        except Exception as e:
            print(f"❌ {venue}: Error {e}")
            continue

    # 保存
    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(races, f, ensure_ascii=False, indent=2)

    print(f"✅ data.json updated ({len(races)} races)")
    return races


def fetch_past_races():
    """外部API or JSONから過去60日分を更新（ダミー構造）"""
    today = datetime.date.today()
    past_data = []

    for d in range(60):
        date = (today - datetime.timedelta(days=d)).strftime("%Y%m%d")
        for venue in VENUES:
            past_data.append({
                "date": date,
                "venue": venue,
                "result": "ダミーデータ"
            })

    with open("history.json", "w", encoding="utf-8") as f:
        json.dump(past_data, f, ensure_ascii=False, indent=2)

    print("✅ history.json updated (60 days)")
    return past_data


def create_features_csv():
    """特徴量データCSV（学習用）"""
    filename = "features.csv"
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "venue", "feature1", "feature2", "feature3"])
        for i in range(100):
            writer.writerow([datetime.date.today(), "桐生", i, i*2, i*3])
    print("✅ features.csv updated")


if __name__ == "__main__":
    os.makedirs(".", exist_ok=True)
    fetch_today_races()
    fetch_past_races()
    create_features_csv()
    print("🎯 Fetch completed.")