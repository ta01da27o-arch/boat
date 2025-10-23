# =========================================
# fetch_entry.py
# 本日の出走表データを公式サイトから取得
# =========================================
import os, json, datetime, requests, time, warnings
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

VENUES = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
    "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
    "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
    "下関", "若松", "芦屋", "福岡", "唐津", "大村"
]

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)
DATA_FILE = os.path.join(DATA_DIR, "data.json")

BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"

def fetch_today_entries(date_str):
    data = {}
    for idx, venue in enumerate(VENUES, start=1):
        code = f"{idx:02d}"
        url = f"{BASE_URL}?jcd={code}&hd={date_str}"
        print(f"⛵ {venue} ({code}) を取得中 ...")
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")
            race_divs = soup.select(".table1")
            races = []

            for race_no, div in enumerate(race_divs, 1):
                rows = div.select("tbody tr")
                boats = []
                for r in rows:
                    cols = r.find_all("td")
                    if len(cols) < 10:
                        continue
                    boat = {
                        "lane": len(boats) + 1,
                        "racer_name": cols[3].get_text(strip=True),
                        "racer_class": cols[4].get_text(strip=True),
                        "racer_start_timing": cols[5].get_text(strip=True),
                        "racer_flying_count": cols[6].get_text(strip=True),
                        "racer_national_win_rate": cols[7].get_text(strip=True),
                        "racer_local_win_rate": cols[8].get_text(strip=True),
                        "racer_motor_win_rate": cols[9].get_text(strip=True),
                        "racer_course_win_rate": cols[10].get_text(strip=True),
                    }
                    boats.append(boat)
                races.append({"race_no": race_no, "boats": boats})

            data[venue] = {"date": date_str, "races": races}
            print(f"✅ {venue} OK")
        except Exception as e:
            print(f"⚠️ {venue} のデータ取得失敗: {e}")
        time.sleep(1)
    return data

def main():
    today = datetime.date.today()
    date_str = today.strftime("%Y%m%d")
    print(f"📅 {date_str} の出走表を取得します...")

    all_data = fetch_today_entries(date_str)

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"✅ 本日分出走表を保存しました: {DATA_FILE}")

if __name__ == "__main__":
    main()