import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

BASE_URL = "https://www.boatrace.jp/owpc/pc/race"

# 全24場の場コード一覧
VENUES = {
    "桐生": "01",
    "戸田": "02",
    "江戸川": "03",
    "平和島": "04",
    "多摩川": "05",
    "浜名湖": "06",
    "蒲郡": "07",
    "常滑": "08",
    "津": "09",
    "三国": "10",
    "びわこ": "11",
    "住之江": "12",
    "尼崎": "13",
    "鳴門": "14",
    "丸亀": "15",
    "児島": "16",
    "宮島": "17",
    "徳山": "18",
    "下関": "19",
    "若松": "20",
    "芦屋": "21",
    "福岡": "22",
    "唐津": "23",
    "大村": "24"
}

def get_racelist(jcd, date):
    """
    出走表を取得して返す
    """
    url = f"{BASE_URL}/racelist?jcd={jcd}&hd={date}"
    res = requests.get(url)
    res.encoding = res.apparent_encoding
    soup = BeautifulSoup(res.text, "html.parser")

    races = []
    race_tables = soup.select("div.race_table_01")  # 各Rのテーブル
    for rno, table in enumerate(race_tables, start=1):
        boats = []
        rows = table.select("tbody tr")
        for row in rows:
            cols = row.find_all("td")
            if len(cols) >= 2:
                try:
                    number = int(cols[0].text.strip())
                    name = cols[1].text.strip()
                    boats.append({"number": number, "name": name})
                except:
                    pass
        races.append({"race_number": rno, "boats": boats})
    return races


def get_result(jcd, date, rno):
    """
    レース結果を取得して返す（1〜6着の艇番号）
    """
    url = f"{BASE_URL}/raceresult?rno={rno}&jcd={jcd}&hd={date}"
    res = requests.get(url)
    res.encoding = res.apparent_encoding
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
        racelist = get_racelist(jcd, today)

        for race in racelist:
            rno = race["race_number"]
            boats = race["boats"]

            # 結果を取得
            result = get_result(jcd, today, rno)

            entry = {
                "race_date": today,
                "stadium": stadium,
                "stadium_code": jcd,
                "race_number": rno,
                "boats": boats,
                "result": result
            }
            data.append(entry)

    # JSON保存
    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()