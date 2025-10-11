import requests
from bs4 import BeautifulSoup
import datetime
import json
from pathlib import Path

# === 定数設定 ===
BASE_URL = "https://www.boatrace.jp"
DATA_FILE = Path("data.json")

# === 24場コード ===
VENUES = {
    "01": "桐生", "02": "戸田", "03": "江戸川", "04": "平和島", "05": "多摩川", "06": "浜名湖",
    "07": "蒲郡", "08": "常滑", "09": "津", "10": "三国", "11": "びわこ", "12": "住之江",
    "13": "尼崎", "14": "鳴門", "15": "丸亀", "16": "児島", "17": "宮島", "18": "徳山",
    "19": "下関", "20": "若松", "21": "芦屋", "22": "福岡", "23": "唐津", "24": "大村"
}

# === 今日の日付 ===
today = datetime.date.today()
date_str = today.strftime("%Y%m%d")

# === 本日開催場を取得 ===
def get_today_venues():
    url = f"{BASE_URL}/owpc/pc/race/index"
    res = requests.get(url, timeout=10)
    soup = BeautifulSoup(res.text, "lxml")
    links = soup.select("li.is-holding a")
    venue_codes = []
    for link in links:
        href = link.get("href", "")
        if "jcd=" in href:
            code = href.split("jcd=")[1].split("&")[0]
            if code in VENUES:
                venue_codes.append(code)
    print(f"✅ 開催場: {', '.join([VENUES[v] for v in venue_codes])}")
    return venue_codes

# === 各場のレース一覧を取得 ===
def fetch_race_program(venue_code):
    program = {"title": VENUES[venue_code], "races": []}
    for rno in range(1, 13):
        url = f"{BASE_URL}/owpc/pc/race/racelist?rno={rno}&jcd={venue_code}&hd={date_str}"
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, "lxml")

        title = soup.select_one(".heading2_title")
        race_name = title.text.strip() if title else f"{rno}R"
        boats = [b.text.strip() for b in soup.select(".table1_boatImage1 .is-fs18")]
        players = [p.text.strip() for p in soup.select(".table1_name")]

        if not boats:
            continue  # レース未開催または取得不可

        race_info = {
            "no": rno,
            "name": race_name,
            "boats": boats,
            "players": players,
        }
        program["races"].append(race_info)

    return program

# === メイン ===
def main():
    all_data = {"date": date_str, "program": {}, "results": {}}

    venues = get_today_venues()
    for v in venues:
        program = fetch_race_program(v)
        all_data["program"][v] = program

    # JSON保存
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"✅ data.json を更新しました ({len(venues)}場)")

# === 実行 ===
if __name__ == "__main__":
    main()