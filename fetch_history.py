# fetch_history.py
import json, requests, datetime, os
from bs4 import BeautifulSoup

HISTORY_FILE = "history.json"
MAX_DAYS = 30

def get_open_stadiums(target_date):
    url = f"https://www.boatrace.jp/owpc/pc/race/index?hd={target_date}"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
    except requests.RequestException:
        return []
    soup = BeautifulSoup(res.text, "lxml")
    jcds = [a.get("href").split("jcd=")[1][:2] for a in soup.select(".table1 tbody tr a") if "jcd=" in a.get("href", "")]
    return list(set(jcds))

def fetch_race_data(date_str):
    all_data = []
    jcds = get_open_stadiums(date_str)
    for jcd in jcds:
        url = f"https://www.boatrace.jp/owpc/pc/race/raceresultall?jcd={jcd}&hd={date_str}"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                all_data.append({"date": date_str, "jcd": jcd, "html": res.text})
        except requests.exceptions.Timeout:
            print(f"⚠️ Timeout on {date_str}-{jcd}")
    return all_data

def main():
    today = datetime.date.today()
    all_dates = [(today - datetime.timedelta(days=i)).strftime("%Y%m%d") for i in range(MAX_DAYS)]

    # 既存の履歴を読み込み
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            try:
                history = json.load(f)
            except json.JSONDecodeError:
                history = []
    else:
        history = []

    existing_dates = {d["date"] for d in history}
    print(f"📦 過去{MAX_DAYS}日データ更新開始...")

    for date_str in all_dates:
        if date_str not in existing_dates:
            print(f"🗓️ {date_str} のデータ取得中...")
            data = fetch_race_data(date_str)
            if data:
                history.append({"date": date_str, "data": data})

    # 最新30日分に整理
    history = sorted(history, key=lambda x: x["date"], reverse=True)[:MAX_DAYS]

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"✅ history.json updated ({len(history)} days)")

if __name__ == "__main__":
    main()