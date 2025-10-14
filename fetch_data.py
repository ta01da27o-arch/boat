import requests
import json
import datetime
import time
from bs4 import BeautifulSoup
import os
import sys

# -------------------------------------
#  JST 現在日付
# -------------------------------------
def jst_now():
    return datetime.datetime.utcnow() + datetime.timedelta(hours=9)

# -------------------------------------
#  出走表URLと結果URL
# -------------------------------------
BASE_URL = "https://www.boatrace.jp/owpc/pc/race"

# -------------------------------------
#  開催中レース場を取得
# -------------------------------------
def get_open_stadiums(target_date):
    url = f"{BASE_URL}/raceindex?hd={target_date}"
    res = requests.get(url, timeout=10)
    res.encoding = "utf-8"
    soup = BeautifulSoup(res.text, "lxml")

    jcd_list = []
    for link in soup.select("a[href*='jcd=']"):
        href = link.get("href")
        if "jcd=" in href:
            code = href.split("jcd=")[-1].split("&")[0]
            if code not in jcd_list:
                jcd_list.append(code)
    return sorted(list(set(jcd_list)))

# -------------------------------------
#  レース一覧取得
# -------------------------------------
def fetch_programs(jcd_list, target_date):
    programs = []
    for jcd in jcd_list:
        url = f"{BASE_URL}/racelist?jcd={jcd}&hd={target_date}"
        print(f"🔍 出走表取得中: {url}")
        res = requests.get(url, timeout=10)
        res.encoding = "utf-8"
        if res.status_code != 200:
            continue
        soup = BeautifulSoup(res.text, "lxml")

        title_tag = soup.select_one(".title01")
        title = title_tag.get_text(strip=True) if title_tag else "タイトル不明"
        programs.append({
            "stadium_code": jcd,
            "race_title": title,
            "url": url
        })
        time.sleep(0.5)
    return programs

# -------------------------------------
#  結果取得
# -------------------------------------
def fetch_results(jcd_list, target_date):
    results = []
    for jcd in jcd_list:
        url = f"{BASE_URL}/raceresultall?jcd={jcd}&hd={target_date}"
        print(f"🏁 結果取得中: {url}")
        res = requests.get(url, timeout=10)
        res.encoding = "utf-8"
        if res.status_code != 200:
            continue
        soup = BeautifulSoup(res.text, "lxml")

        title_tag = soup.select_one(".title01")
        title = title_tag.get_text(strip=True) if title_tag else "結果データ"
        results.append({
            "stadium_code": jcd,
            "race_title": title,
            "url": url
        })
        time.sleep(0.5)
    return results

# -------------------------------------
#  保存関数
# -------------------------------------
def save_json(filename, data):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ {filename} 更新完了 ({data.get('race_date', '---')})")

# -------------------------------------
#  メイン
# -------------------------------------
if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "today"
    now = jst_now()
    today = now.strftime("%Y%m%d")
    yesterday = (now - datetime.timedelta(days=1)).strftime("%Y%m%d")

    if mode == "today":
        target_date = today
        print(f"📦 競艇データ自動取得 (TODAY) 開始: {target_date}")

    elif mode == "yesterday":
        target_date = yesterday
        print(f"📦 前日データ取得 (YESTERDAY) 開始: {target_date}")

    elif mode == "history":
        print(f"📦 過去30日データ更新 (HISTORY) 開始")
        all_data = []
        for i in range(1, 31):
            target_date = (now - datetime.timedelta(days=i)).strftime("%Y%m%d")
            print(f"🗓️ {target_date} のデータ取得中...")
            jcds = get_open_stadiums(target_date)
            programs = fetch_programs(jcds, target_date)
            results = fetch_results(jcds, target_date)
            all_data.append({
                "race_date": target_date,
                "programs": programs,
                "results": results
            })
            time.sleep(1)

        save_json("history.json", {"updated": today, "records": all_data})
        sys.exit(0)

    else:
        print("❌ モード指定が不正です: today / yesterday / history")
        sys.exit(1)

    # 通常モード（today / yesterday）
    print(f"🌏 開催中レース場を取得中... ({target_date})")
    jcd_list = get_open_stadiums(target_date)
    print(f"✅ 開催中場 ({len(jcd_list)}場): {', '.join(jcd_list)}")

    programs = fetch_programs(jcd_list, target_date)
    results = fetch_results(jcd_list, target_date)

    save_json("data.json", {
        "race_date": target_date,
        "programs": programs,
        "results": results
    })