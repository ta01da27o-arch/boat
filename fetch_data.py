# fetch_data.py
import requests, json, datetime, sys, os
from bs4 import BeautifulSoup

DATA_FILE = "data.json"

def get_open_stadiums(target_date):
    """開催中のレース場を取得"""
    url = f"https://www.boatrace.jp/owpc/pc/race/index?hd={target_date}"
    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
    except requests.RequestException as e:
        print(f"⚠️ Failed to fetch stadiums: {e}")
        return []

    soup = BeautifulSoup(res.text, "lxml")
    links = soup.select(".table1 tbody tr a")
    jcds = []
    for a in links:
        href = a.get("href", "")
        if "jcd=" in href:
            jcd = href.split("jcd=")[1][:2]
            if jcd not in jcds:
                jcds.append(jcd)
    return jcds

def fetch_race_data(date_str, jcds):
    """各レース場の結果データを取得"""
    all_data = []
    for jcd in jcds:
        url = f"https://www.boatrace.jp/owpc/pc/race/raceresultall?jcd={jcd}&hd={date_str}"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                all_data.append({"date": date_str, "jcd": jcd, "html": res.text})
                print(f"🏁 {jcd} OK ({date_str})")
        except requests.exceptions.Timeout:
            print(f"⚠️ Timeout on {jcd}")
    return all_data

def main():
    today = datetime.date.today()
    mode = sys.argv[1] if len(sys.argv) > 1 else "today"

    if mode == "today":
        target_date = today.strftime("%Y%m%d")
    elif mode == "yesterday":
        target_date = (today - datetime.timedelta(days=1)).strftime("%Y%m%d")
    else:
        print("❌ Usage: python fetch_data.py [today|yesterday]")
        return

    print(f"📅 Fetching data for {mode} ({target_date})")

    jcds = get_open_stadiums(target_date)
    print(f"✅ 開催中場 ({target_date}): {jcds}")

    data = fetch_race_data(target_date, jcds)

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"date": target_date, "data": data}, f, ensure_ascii=False, indent=2)

    print(f"✅ {DATA_FILE} updated ({len(data)} items)")

if __name__ == "__main__":
    main()