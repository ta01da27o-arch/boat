import requests
from bs4 import BeautifulSoup
import json
import datetime
import time

OUTPUT_FILE = "data.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0 Mobile Safari/537.36"
}

BASE_URL = "https://www.boatrace.jp/owpc/pc/race/"

def log(msg):
    print(f"[DEBUG] {msg}")

def fetch_venues(date):
    """当日の開催会場一覧を取得"""
    url = BASE_URL + "index"
    res = requests.get(url, headers=HEADERS)
    log(f"会場一覧アクセス: {url} → {res.status_code}")

    if res.status_code != 200:
        return []

    soup = BeautifulSoup(res.text, "html.parser")
    venues = []

    for tag in soup.select(".raceIndex__item a"):
        href = tag.get("href")
        name = tag.get_text(strip=True)
        if "jcd=" in href:
            jcd = href.split("jcd=")[1].split("&")[0]
            venues.append({"name": name, "jcd": jcd})
            log(f"検出: {name} ({jcd})")

    return venues

def fetch_racelist(jcd, date):
    """会場ごとのレース一覧を取得"""
    races = []
    for rno in range(1, 13):  # 1R～12R
        url = f"{BASE_URL}racelist?rno={rno}&jcd={jcd}&hd={date}"
        res = requests.get(url, headers=HEADERS)
        log(f"レースアクセス: {url} → {res.status_code}")

        if res.status_code != 200:
            continue

        soup = BeautifulSoup(res.text, "html.parser")
        race_title = soup.select_one(".heading1_title")
        title = race_title.get_text(strip=True) if race_title else f"{rno}R"

        entries = []
        rows = soup.select(".table1 tbody tr")
        for row in rows:
            cols = row.find_all("td")
            if len(cols) < 8:
                continue

            try:
                lane = cols[0].get_text(strip=True)       # 枠番
                rank = cols[2].get_text(strip=True)       # 階級
                name = cols[3].get_text(strip=True)       # 選手名
                avg_st = cols[4].get_text(strip=True)     # 平均ST
                local_win = cols[5].get_text(strip=True)  # 当地勝率
                motor_win = cols[6].get_text(strip=True)  # モーター勝率
                course_win = cols[7].get_text(strip=True) # コース勝率

                entries.append({
                    "lane": lane,
                    "rank": rank,
                    "name": name,
                    "avg_st": avg_st,
                    "local_win": local_win,
                    "motor_win": motor_win,
                    "course_win": course_win
                })
            except Exception as e:
                log(f"解析エラー: {e}")

        races.append({
            "race_no": rno,
            "title": title,
            "entries": entries
        })

        time.sleep(0.5)  # サーバー負荷対策

    return races

def main():
    today = datetime.datetime.now().strftime("%Y%m%d")
    log(f"処理開始: {today}")

    venues = fetch_venues(today)
    programs = []

    for v in venues:
        log(f"処理中: {v['name']}")
        races = fetch_racelist(v["jcd"], today)
        programs.append({
            "venue": v["name"],
            "races": races
        })

    data = {
        "date": today,
        "programs": programs,
        "stats": {},
        "history": []
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    log(f"保存完了: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()