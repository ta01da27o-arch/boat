import requests
from bs4 import BeautifulSoup
import json
import datetime
import time

BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"

# 全国24会場コード
VENUES = {
    "01": "桐生", "02": "戸田", "03": "江戸川", "04": "平和島", "05": "多摩川",
    "06": "浜名湖", "07": "蒲郡", "08": "常滑", "09": "津", "10": "三国",
    "11": "びわこ", "12": "住之江", "13": "尼崎", "14": "鳴門", "15": "丸亀",
    "16": "児島", "17": "宮島", "18": "徳山", "19": "下関", "20": "若松",
    "21": "芦屋", "22": "福岡", "23": "唐津", "24": "大村"
}


def fetch_race_data(venue_code, date):
    """指定会場・日付の全レース出走表を取得"""
    url = f"{BASE_URL}?jcd={venue_code}&hd={date}"
    res = requests.get(url)
    res.encoding = "utf-8"
    soup = BeautifulSoup(res.text, "html.parser")

    races = []
    race_cards = soup.select(".is-raceList")

    for race_card in race_cards:
        race_no_tag = race_card.select_one(".numberSet1_number")
        if not race_no_tag:
            continue
        race_no = race_no_tag.get_text(strip=True).replace("R", "")

        entries = []
        rows = race_card.select("tbody tr")

        for row in rows:
            cols = row.find_all("td")
            if not cols or len(cols) < 5:
                continue

            lane = int(cols[0].get_text(strip=True)) if cols[0].get_text(strip=True).isdigit() else None
            name = cols[1].get_text(strip=True)

            # 勝率（全国 / 当地）
            try:
                win_rate_all = float(cols[3].get_text(strip=True))
            except:
                win_rate_all = None
            try:
                win_rate_local = float(cols[4].get_text(strip=True))
            except:
                win_rate_local = None

            entries.append({
                "lane": lane,
                "name": name,
                "win_rate": win_rate_all,
                "local_win_rate": win_rate_local
            })

        races.append({
            "race_no": race_no,
            "entries": entries
        })

    return races


def main():
    today = datetime.date.today()
    date_str = today.strftime("%Y%m%d")

    all_data = {"date": date_str, "venues": {}}

    for code, name in VENUES.items():
        print(f"Fetching {name}...")
        try:
            races = fetch_race_data(code, date_str)
            all_data["venues"][name] = races
        except Exception as e:
            print(f"⚠️ {name} 取得失敗: {e}")
            all_data["venues"][name] = []

        time.sleep(1)  # サーバー負荷対策で1秒待機

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print("✅ data.json updated!")


if __name__ == "__main__":
    main()