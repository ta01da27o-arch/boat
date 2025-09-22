import requests
from bs4 import BeautifulSoup
import json
import datetime
import time

# 会場コードと名前
VENUES = {
    "01": "桐生", "02": "戸田", "03": "江戸川", "04": "平和島", "05": "多摩川",
    "06": "浜名湖", "07": "蒲郡", "08": "常滑", "09": "津", "10": "三国",
    "11": "びわこ", "12": "住之江", "13": "尼崎", "14": "鳴門", "15": "丸亀",
    "16": "児島", "17": "宮島", "18": "徳山", "19": "下関", "20": "若松",
    "21": "芦屋", "22": "福岡", "23": "唐津", "24": "大村"
}

# 今日の日付
today = datetime.date.today().strftime("%Y%m%d")

programs = []

for jcd, venue in VENUES.items():
    races = []
    for rno in range(1, 13):
        url = f"https://www.boatrace.jp/owpc/pc/race/racedata?jcd={jcd}&hd={today}&rno={rno}"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code != 200:
                continue

            # 👇 追加：レスポンスの先頭500文字を出力（デバッグ用）
            print(f"DEBUG {venue} {rno}R:", res.text[:500])

            soup = BeautifulSoup(res.text, "html.parser")

            # レースタイトル
            title_tag = soup.select_one("div.title3")
            title = title_tag.get_text(strip=True) if title_tag else f"{rno}R"

            boats = []
            rows = soup.select("table.is-tableFixed tbody tr")
            for row in rows:
                cols = row.find_all("td")
                if len(cols) < 5:
                    continue
                try:
                    lane = int(row.find("th").get_text(strip=True))
                    reg_class_name = cols[0].get_text(strip=True)
                    branch_age_weight = cols[1].get_text(strip=True)
                    nation = cols[2].get_text(strip=True)
                    local = cols[3].get_text(strip=True)
                    motor = cols[4].get_text(strip=True)
                    boat = cols[5].get_text(strip=True)

                    boats.append({
                        "lane": lane,
                        "info": reg_class_name,
                        "details": branch_age_weight,
                        "nation": nation,
                        "local": local,
                        "motor": motor,
                        "boat": boat
                    })
                except:
                    continue

            if boats:
                races.append({
                    "number": rno,
                    "title": title,
                    "boats": boats
                })

            time.sleep(0.5)  # アクセス負荷を下げる
        except Exception as e:
            continue

    programs.append({
        "venue": venue,
        "races": races
    })

data = {
    "date": today,
    "programs": programs,
    "stats": {},
    "history": []
}

with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)