import os
import json
import datetime
import requests
from bs4 import BeautifulSoup
from time import sleep

DATA_DIR = "data"
DATA_PATH = os.path.join(DATA_DIR, "data.json")
HISTORY_PATH = os.path.join(DATA_DIR, "history.json")

BASE_URL = "https://www.boatrace.jp"
RACE_DAYS = 60  # 保存する過去日数

# -----------------------------
# ヘルパー関数
# -----------------------------
def load_json(path, default):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return default

def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# -----------------------------
# スクレイピング関数
# -----------------------------
def scrape_today_venues():
    """本日の開催場を公式から取得"""
    url = f"{BASE_URL}/owpc/pc/extra/race/"
    res = requests.get(url, timeout=10)
    soup = BeautifulSoup(res.text, "html.parser")

    venues = {}
    today = datetime.date.today().strftime("%Y-%m-%d")

    for div in soup.select(".contentsFrame1 .contentsHeader"):
        name = div.get_text(strip=True)
        if not name:
            continue
        venues[name] = {
            "status": "開催中",
            "date": today,
            "races": {}
        }

    return venues

def scrape_race_table(venue_name):
    """出走表スクレイピング"""
    url = f"{BASE_URL}/owpc/pc/race/racelist?jcd={venue_name}"
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")
        races = {}

        for race_div in soup.select(".table1"):
            race_no = race_div.select_one(".tit").get_text(strip=True)
            races[race_no] = []

            for tr in race_div.select("tbody tr"):
                tds = [td.get_text(strip=True) for td in tr.select("td")]
                if len(tds) < 7:
                    continue
                data = {
                    "艇番": tds[0],
                    "選手名": tds[1],
                    "級": tds[2],
                    "平均ST": tds[3],
                    "F数": tds[4],
                    "全国勝率": tds[5],
                    "当地勝率": tds[6],
                    "モーター勝率": tds[7] if len(tds) > 7 else "ー"
                }
                races[race_no].append(data)

        return races
    except Exception as e:
        print(f"⚠️ {venue_name} 出走表取得失敗: {e}")
        return {}

# -----------------------------
# メインロジック
# -----------------------------
def update_data():
    today_str = datetime.date.today().strftime("%Y-%m-%d")

    data = load_json(DATA_PATH, {})
    history = load_json(HISTORY_PATH, {})

    print("🚀 Render 自動更新スクリプト開始")

    # ① 本日の開催場
    venues_today = scrape_today_venues()

    # ② 各場の出走表を取得
    for venue in venues_today.keys():
        print(f"→ {venue} 出走表取得中...")
        races = scrape_race_table(venue)
        venues_today[venue]["races"] = races
        sleep(1)

    # ③ data.json 更新
    save_json(DATA_PATH, venues_today)

    # ④ history.json へ追加
    history[today_str] = venues_today

    # ⑤ 古いデータ削除（60日以前）
    cutoff = datetime.date.today() - datetime.timedelta(days=RACE_DAYS)
    for key in list(history.keys()):
        if datetime.date.fromisoformat(key) < cutoff:
            del history[key]

    save_json(HISTORY_PATH, history)

    print(f"✅ 完了: {today_str}")
    print(f"├ data.json: {len(venues_today)}場分")
    print(f"└ history.json: {len(history)}日分")

# -----------------------------
# 実行
# -----------------------------
if __name__ == "__main__":
    update_data()