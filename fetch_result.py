# =========================================
# fetch_result.py
# 本日の結果＋決まり手を取得しhistory.jsonに蓄積
# =========================================
import os, json, datetime, requests, time
from bs4 import BeautifulSoup

VENUES = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
    "蒲郡", "常滑", "津", "三国", "びわこ", "住之江",
    "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
    "下関", "若松", "芦屋", "福岡", "唐津", "大村"
]

DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")

BASE_URL = "https://www.boatrace.jp/owpc/pc/race/raceresult"

def fetch_today_results(date_str):
    results = {}
    for idx, venue in enumerate(VENUES, start=1):
        code = f"{idx:02d}"
        url = f"{BASE_URL}?jcd={code}&hd={date_str}"
        print(f"🎯 {venue} の結果を取得中 ...")
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "lxml")

            race_divs = soup.select(".table1")
            venue_results = []
            for race_no, div in enumerate(race_divs, 1):
                tds = div.select("tbody tr td")
                if not tds:
                    continue
                first = tds[0].get_text(strip=True)
                second = tds[1].get_text(strip=True)
                third = tds[2].get_text(strip=True)
                decision = tds[-1].get_text(strip=True)
                venue_results.append({
                    "race_no": race_no,
                    "1着": first,
                    "2着": second,
                    "3着": third,
                    "決まり手": decision
                })

            results[venue] = {"date": date_str, "results": venue_results}
            print(f"✅ {venue} OK")
        except Exception as e:
            print(f"⚠️ {venue} 失敗: {e}")
        time.sleep(1)
    return results

def main():
    today = datetime.date.today()
    date_str = today.strftime("%Y%m%d")
    print(f"📅 {date_str} の結果を取得します...")

    today_results = fetch_today_results(date_str)

    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)
    else:
        history = {}

    history[date_str] = today_results

    # 60日保持ロジック
    if len(history) > 60:
        oldest = sorted(history.keys())[0]
        del history[oldest]
        print(f"🧹 古いデータ({oldest})を削除")

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"✅ history.json 更新完了！")

if __name__ == "__main__":
    main()