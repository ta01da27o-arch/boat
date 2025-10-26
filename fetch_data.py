import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import os

# -----------------------------
# 24会場リスト
# -----------------------------
VENUES = [
    "桐生","戸田","江戸川","平和島","多摩川",
    "浜名湖","蒲郡","常滑","津","三国",
    "びわこ","住之江","尼崎","鳴門","丸亀",
    "児島","宮島","徳山","下関","若松",
    "芦屋","福岡","唐津","大村"
]

# -----------------------------
# 出走表URLフォーマット
# -----------------------------
URL_TEMPLATE = "https://www.boatrace.jp/owpc/pc/race/racelist?rno={rno}&jcd={jcd}&hd={date}"

# 競艇場コード
VENUE_CODES = {
    "桐生": 1, "戸田": 2, "江戸川": 3, "平和島": 4, "多摩川": 5,
    "浜名湖": 6, "蒲郡": 7, "常滑": 8, "津": 9, "三国": 10,
    "びわこ": 11, "住之江": 12, "尼崎": 13, "鳴門": 14, "丸亀": 15,
    "児島": 16, "宮島": 17, "徳山": 18, "下関": 19, "若松": 20,
    "芦屋": 21, "福岡": 22, "唐津": 23, "大村": 24
}

# -----------------------------
# JSONファイルパス
# -----------------------------
DATA_FILE = "data.json"
HISTORY_FILE = "history.json"

# -----------------------------
# 日付設定
# -----------------------------
today = datetime.now().strftime("%Y%m%d")

# -----------------------------
# JSON初期データ読込
# -----------------------------
def load_json(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

data = load_json(DATA_FILE)
history = load_json(HISTORY_FILE)

# -----------------------------
# 出走表スクレイピング関数
# -----------------------------
def fetch_race_list(venue_name, venue_code):
    races = {}
    for rno in range(1, 13):
        url = URL_TEMPLATE.format(rno=rno, jcd=str(venue_code).zfill(2), date=today)
        res = requests.get(url)
        if res.status_code != 200:
            continue

        soup = BeautifulSoup(res.text, "html.parser")
        title = soup.find("h3", class_="title").text.strip() if soup.find("h3", class_="title") else f"{rno}R"

        racers = []
        rows = soup.select(".table1 tbody tr")
        for row in rows:
            cols = row.find_all("td")
            if len(cols) >= 3:
                lane = cols[0].text.strip()
                name = cols[2].text.strip()
                racers.append({"lane": lane, "name": name})

        if racers:
            races[f"{rno}R"] = {
                "title": title,
                "racers": racers
            }
    return races

# -----------------------------
# 各場のデータ更新
# -----------------------------
for venue in VENUES:
    races_today = fetch_race_list(venue, VENUE_CODES[venue])

    data[venue] = {
        "status": "開催中" if races_today else "ー",
        "hit_rate": data.get(venue, {}).get("hit_rate", 0),
        "races": {
            "date": today,
            "status": "開催中" if races_today else "ー",
            "results": [],
            "entries": races_today
        }
    }

    if today not in history:
        history[today] = {}
    history[today][venue] = {
        "date": today,
        "results": []
    }

# -----------------------------
# 保存
# -----------------------------
with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

with open(HISTORY_FILE, "w", encoding="utf-8") as f:
    json.dump(history, f, ensure_ascii=False, indent=2)

print("✅ 本日の出走表を取得完了しました！")