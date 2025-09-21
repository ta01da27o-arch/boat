import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

VENUES = {
    "01": "桐生", "02": "戸田", "03": "江戸川", "04": "平和島", "05": "多摩川",
    "06": "浜名湖", "07": "蒲郡", "08": "常滑", "09": "津", "10": "三国",
    "11": "びわこ", "12": "住之江", "13": "尼崎", "14": "鳴門", "15": "丸亀",
    "16": "児島", "17": "宮島", "18": "徳山", "19": "下関", "20": "若松",
    "21": "芦屋", "22": "福岡", "23": "唐津", "24": "大村"
}

BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"

def fetch_race_program(jcd, venue, date):
    programs = []
    for rno in range(1, 13):
        url = f"{BASE_URL}?rno={rno}&jcd={jcd}&hd={date}"
        res = requests.get(url)
        res.encoding = res.apparent_encoding
        if res.status_code != 200:
            continue

        soup = BeautifulSoup(res.text, "html.parser")
        rows = soup.select("tr.is-fs12")  # 出走表の行

        entries = []
        for row in rows:
            cols = [c.get_text(strip=True) for c in row.find_all("td")]
            if len(cols) < 7:
                continue

            entry = {
                "艇": cols[0],
                "選手名": cols[2],
                "級別": cols[3],
                "平均ST": cols[4],
                "当地勝率": cols[5],
                "モーター勝率": cols[6]
            }
            entries.append(entry)

        if entries:
            programs.append({
                "venue": venue,
                "race_no": rno,
                "entries": entries
            })

    return programs


def main():
    date = datetime.now().strftime("%Y%m%d")
    all_programs = []

    for jcd, venue in VENUES.items():
        all_programs.extend(fetch_race_program(jcd, venue, date))

    data = {
        "date": date,
        "programs": all_programs,
        "stats": {},
        "history": []
    }

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()