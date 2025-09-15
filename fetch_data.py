import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

BASE_URL = "https://www.boatrace.jp/owpc/pc/race"

# 24場の場コード（例：戸田=02, 平和島=04 ...）
VENUES = {
    "戸田": "02",
    "平和島": "04",
    "多摩川": "05",
    "江戸川": "03",
    # ... ここに全24場追加
}

def get_result(jcd, date, rno):
    """ レース結果を取得して1～6着の艇番号を返す """
    url = f"{BASE_URL}/raceresult?rno={rno}&jcd={jcd}&hd={date}"
    res = requests.get(url)
    soup = BeautifulSoup(res.text, "html.parser")

    result_table = soup.select("div.table1.is-p3 tr")
    ranks = []
    for row in result_table:
        cols = row.find_all("td")
        if len(cols) >= 2:
            try:
                ranks.append(int(cols[1].text.strip()))
            except:
                pass
    return ranks if len(ranks) == 6 else []

def main():
    today = datetime.now().strftime("%Y%m%d")
    data = []

    for stadium, jcd in VENUES.items():
        for rno in range(1, 13):  # 各場12R
            result = get_result(jcd, today, rno)
            if not result:
                continue

            entry = {
                "date": today,
                "stadium": stadium,
                "stadium_code": jcd,
                "race_number": rno,
                "boats": [],   # ← 出走表も同時に取る処理を追加予定
                "result": result
            }
            data.append(entry)

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()