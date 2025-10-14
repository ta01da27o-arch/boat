# fetch_data.py
# 競艇 本日・前日対応 自動データ取得統合版
# - 本日 or 前日を自動判定または手動指定
# - 開催中の場のみスクレイピング
# - 出走表・結果を統合して data.json に保存

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta
import time
import warnings
from bs4 import XMLParsedAsHTMLWarning

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

# --- 設定 ---
BASE_URL = "https://www.boatrace.jp/owpc/pc"
JSON_PATH = "data.json"
HEADERS = {"User-Agent": "Mozilla/5.0"}

# --- 関数: 開催中の場を取得 ---
def get_active_stadiums(target_date: str):
    """
    開催中の場コード一覧を取得 (例: ['01', '05', '18'])
    """
    print(f"🌏 開催中レース場を取得中... ({target_date})")
    url = f"{BASE_URL}/race/index?hd={target_date}"
    res = requests.get(url, headers=HEADERS)
    res.encoding = "utf-8"

    soup = BeautifulSoup(res.text, "lxml")
    links = soup.select("a[href*='jcd=']")
    stadium_codes = sorted(list(set([link["href"].split("jcd=")[-1][:2] for link in links])))

    print(f"✅ 開催中場 ({len(stadium_codes)}場): {', '.join(stadium_codes)}")
    return stadium_codes

# --- 関数: 出走表を取得 ---
def fetch_programs(stadium_codes, target_date):
    programs = []
    for code in stadium_codes:
        url = f"{BASE_URL}/race/racelist?jcd={code}&hd={target_date}"
        print(f"🔍 出走表取得中: {url}")
        res = requests.get(url, headers=HEADERS)
        if res.status_code != 200:
            print(f"⚠️ {code}: 出走表取得失敗 ({res.status_code})")
            continue

        soup = BeautifulSoup(res.text, "lxml")
        race_title_tag = soup.select_one(".heading1_titleName")
        race_title = race_title_tag.text.strip() if race_title_tag else "タイトル不明"

        programs.append({
            "stadium_code": code,
            "race_title": race_title,
            "url": url
        })
        time.sleep(0.3)
    return programs

# --- 関数: 結果を取得 ---
def fetch_results(stadium_codes, target_date):
    results = []
    for code in stadium_codes:
        url = f"{BASE_URL}/race/raceresultall?jcd={code}&hd={target_date}"
        print(f"🏁 結果取得中: {url}")
        res = requests.get(url, headers=HEADERS)
        if res.status_code != 200:
            print(f"⚠️ {code}: 結果取得失敗 ({res.status_code})")
            continue

        soup = BeautifulSoup(res.text, "lxml")
        title_tag = soup.select_one(".heading1_titleName")
        title = title_tag.text.strip() if title_tag else "タイトル不明"

        results.append({
            "stadium_code": code,
            "result_title": title,
            "url": url
        })
        time.sleep(0.3)
    return results

# --- 関数: JSON保存 ---
def save_json(data):
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ data.json 更新完了 ({data['race_date']})")

# --- メイン ---
def main(mode="today"):
    today = datetime.now()
    jst_today = today + timedelta(hours=9)
    if mode == "today":
        target_date = jst_today.strftime("%Y%m%d")
    elif mode == "yesterday":
        target_date = (jst_today - timedelta(days=1)).strftime("%Y%m%d")
    else:
        raise ValueError("modeは 'today' または 'yesterday' を指定してください")

    print(f"\n📦 競艇データ自動取得 ({mode.upper()}) 開始: {target_date}")

    # 開催中の場を取得
    stadiums = get_active_stadiums(target_date)
    if not stadiums:
        print("⚠️ 開催中のレース場が見つかりません。")
        return

    # 出走表と結果を取得
    programs = fetch_programs(stadiums, target_date)
    results = fetch_results(stadiums, target_date)

    # JSON保存
    data = {
        "race_date": target_date,
        "programs": programs,
        "results": results,
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    save_json(data)

if __name__ == "__main__":
    import sys
    mode = "today"
    if len(sys.argv) > 1:
        mode = sys.argv[1]
    main(mode)