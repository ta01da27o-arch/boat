import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time

VENUES = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑",
    "津","三国","びわこ","住之江","尼崎","鳴門","丸亀","児島",
    "宮島","徳山","下関","若松","芦屋","福岡","唐津","大村"
]

def get_race_data(date_str):
    """指定日の全24場データを取得"""
    results = {}
    for venue in VENUES:
        try:
            url = f"https://www.boatrace.jp/owpc/pc/race/racelist?rno=1&jcd=01&hd={date_str.replace('-','')}"
            res = requests.get(url, timeout=10)
            if res.status_code != 200:
                results[venue] = {"status": "ー", "hit_rate": 0, "races": {}}
                continue

            soup = BeautifulSoup(res.text, "html.parser")
            races = {}
            race_elements = soup.select(".is-pc ul.race_num_list li a")
            if not race_elements:
                results[venue] = {"status": "ー", "hit_rate": 0, "races": {}}
                continue

            for race_no, _ in enumerate(race_elements, 1):
                # 簡易構造（詳細は別途AI学習で精査）
                races[race_no] = [
                    {
                        "number": i,
                        "name": f"選手{i}",
                        "grade": "A1",
                        "st": 0.15 + i * 0.01,
                        "f": "ー",
                        "all": 6.50 + i * 0.1,
                        "local": 6.40 + i * 0.1,
                        "mt": 6.20 + i * 0.1,
                        "course": i,
                        "eval": "◎" if i == 1 else "○"
                    } for i in range(1, 7)
                ]
            results[venue] = {"status": "開催中", "hit_rate": 0, "races": races}
            time.sleep(0.5)

        except Exception:
            results[venue] = {"status": "ー", "hit_rate": 0, "races": {}}
    return results