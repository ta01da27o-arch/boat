# fetch_history.py（改良版：学習データ蓄積付き）
import json, requests, datetime, os
from bs4 import BeautifulSoup

HISTORY_FILE = "history.json"
ALL_FILE = "history_all.json"
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

def load_json(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    today = datetime.date.today()
    all_dates = [(today - datetime.timedelta(days=i)).strftime("%Y%m%d") for i in range(MAX_DAYS)]

    # 既存履歴ロード
    history = load_json(HISTORY_FILE)
    history_all = load_json(ALL_FILE)

    existing_dates = {d["date"] for d in history_all}
    print(f"📦 過去{MAX_DAYS}日データ更新開始...")

    for date_str in all_dates:
        if date_str not in existing_dates:
            print(f"🗓️ {date_str} のデータ取得中...")
            data = fetch_race_data(date_str)
            if data:
                record = {"date": date_str, "data": data}
                history.append(record)
                history_all.append(record)

    # 最新30日分だけ残す
    history = sorted(history, key=lambda x: x["date"], reverse=True)[:MAX_DAYS]
    # 全履歴は削除しない
    history_all = sorted(history_all, key=lambda x: x["date"], reverse=True)

    save_json(HISTORY_FILE, history)
    save_json(ALL_FILE, history_all)

    print(f"✅ history.json 更新 ({len(history)} days)")
    print(f"✅ history_all.json 更新 (累計 {len(history_all)} days)")

if __name__ == "__main__":
    main()