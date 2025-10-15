import requests
from bs4 import BeautifulSoup
import json
import sys
from datetime import datetime, timedelta, timezone
import os
import re

# JST = UTC+9
JST = timezone(timedelta(hours=9))

DATA_FILE = "data.json"

# -----------------------------
# 日本時間で日付取得
# -----------------------------
def get_target_date(arg=None):
    now_jst = datetime.now(JST)
    if arg == "yesterday":
        target = now_jst - timedelta(days=1)
    else:
        target = now_jst
    return target.strftime("%Y%m%d")

# -----------------------------
# 公式サイトスクレイピング（出走表）
# -----------------------------
def fetch_today_from_boatrace(date_str):
    print(f"[SCRAPING] 本日データ取得中 ({date_str}) ...")

    BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"
    data = []

    for stadium in range(1, 25):
        url = f"{BASE_URL}?rno=1&jcd={stadium:02d}&hd={date_str}"
        try:
            res = requests.get(url, timeout=10)
            res.encoding = "utf-8"
            if "現在開催中ではありません" in res.text:
                continue

            soup = BeautifulSoup(res.text, "lxml")
            race_name = soup.select_one(".heading1_title").text.strip() if soup.select_one(".heading1_title") else ""

            # 選手情報抽出
            rows = soup.select(".table1 tbody tr")
            if not rows:
                continue

            boats = []
            for tr in rows:
                cols = tr.find_all("td")
                if len(cols) < 6:
                    continue

                try:
                    number = int(cols[0].text.strip())
                    name = cols[1].text.strip()
                    timing = 0.00
                    boats.append({
                        "racer_boat_number": number,
                        "racer_course_number": number,
                        "racer_start_timing": timing,
                        "racer_place_number": 0,
                        "racer_number": 4000 + number,
                        "racer_name": name,
                    })
                except Exception:
                    continue

            if boats:
                data.append({
                    "race_date": date_str,
                    "race_stadium_number": str(stadium),
                    "race_number": "1",
                    "race_name": race_name,
                    "boats": boats
                })
        except Exception as e:
            print(f"[WARN] {stadium:02d}場取得失敗: {e}")

    print(f"[SCRAPING] 取得完了: {len(data)}件")
    return data

# -----------------------------
# 過去分データをオープンAPIから取得
# -----------------------------
def fetch_history_from_api(date_str):
    print(f"[API] 過去データ取得 ({date_str}) ...")

    url = f"https://api-example.boatrace-data.net/history?date={date_str}"
    data = []

    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
    except Exception as e:
        print(f"[WARN] API取得失敗: {e}")

    print(f"[API] {len(data)}件 取得")
    return data

# -----------------------------
# 保存処理
# -----------------------------
def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] 保存完了 -> {DATA_FILE} ({len(data)} races)")

# -----------------------------
# メイン処理
# -----------------------------
def main():
    if len(sys.argv) <= 1:
        print("❌ Usage: python fetch_data.py [today|yesterday|history]")
        sys.exit(1)

    arg = sys.argv[1].lower()
    date_str = get_target_date("yesterday" if arg == "yesterday" else None)

    if arg == "today":
        data = fetch_today_from_boatrace(date_str)
    elif arg == "history":
        # 過去30日分取得
        data = []
        for i in range(1, 31):
            d = (datetime.now(JST) - timedelta(days=i)).strftime("%Y%m%d")
            daily = fetch_history_from_api(d)
            data.extend(daily)
    else:
        print("❌ Usage: python fetch_data.py [today|yesterday|history]")
        sys.exit(1)

    save_data(data)

if __name__ == "__main__":
    main()