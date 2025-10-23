import os, json, requests, datetime, time
from bs4 import BeautifulSoup

DATA_DIR = "data"
DATA_FILE = os.path.join(DATA_DIR, "data.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")

VENUES = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖","蒲郡","常滑","津",
    "三国","びわこ","住之江","尼崎","鳴門","丸亀","児島","宮島","徳山",
    "下関","若松","芦屋","福岡","唐津","大村"
]

def fetch_today_data():
    today = datetime.date.today().strftime("%Y%m%d")
    print(f"📅 {today} のレースデータを取得します...")
    all_data = {}

    for venue in VENUES:
        try:
            url = f"https://www.boatrace.jp/owpc/pc/race/racelist?jcd={VENUES.index(venue)+1:02d}&hd={today}"
            resp = requests.get(url, timeout=10)
            soup = BeautifulSoup(resp.text, "lxml")
            races = {}

            for i in range(1, 13):
                entries = []
                for tr in soup.select(f"#racecard_{i} tr"):
                    tds = tr.find_all("td")
                    if len(tds) < 6:
                        continue
                    entries.append({
                        "name": tds[1].get_text(strip=True),
                        "class": tds[2].get_text(strip=True),
                        "f": tds[3].get_text(strip=True),
                        "l": tds[4].get_text(strip=True),
                        "tenji": tds[5].get_text(strip=True)
                    })
                if entries:
                    races[str(i)] = {"entries": entries, "prediction": "未学習"}
            all_data[venue] = {"date": today, "races": races}

            print(f"✅ {venue} OK")
            time.sleep(0.5)
        except Exception as e:
            print(f"⚠️ {venue} のデータ取得失敗:", e)

    return all_data


def update_history(today_data):
    """履歴(60日)管理 + 古いデータ削除"""
    if not os.path.exists(HISTORY_FILE):
        history = {}
    else:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)

    today = datetime.date.today().strftime("%Y%m%d")
    history[today] = today_data

    # 60日分制限
    if len(history) > 60:
        oldest = sorted(history.keys())[0]
        print(f"🧹 古いデータ削除: {oldest}")
        del history[oldest]

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def save_today(today_data):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(today_data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    today_data = fetch_today_data()
    save_today(today_data)
    update_history(today_data)
    print("✅ 本日分データ更新完了！ data.json / history.json 保存済み。")