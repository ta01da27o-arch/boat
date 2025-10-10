import requests
import json
import datetime
from datetime import timedelta, timezone
from bs4 import BeautifulSoup
from pathlib import Path

# ===== 設定 =====
DATA_FILE = Path("data.json")
RESULTS_API = "https://boatraceopenapi.github.io/api/results/v2"
PROGRAM_API = "https://boatraceopenapi.github.io/api/programs/v3"
SCRAPE_BASE = "https://www.boatrace.jp/owpc/pc/race/racelist"

JST = timezone(timedelta(hours=9))
today = datetime.datetime.now(JST).date()
today_str = today.strftime("%Y%m%d")

print(f"📅 出走表取得開始: {today_str}")

# ====== JSON保存関数 ======
def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ====== 出走表APIから取得 ======
def fetch_program_api(date_str):
    url = f"{PROGRAM_API}/{date_str}.json"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            print(f"✅ API出走表取得成功: {date_str}")
            return r.json()
        else:
            print(f"⚠️ API出走表取得失敗 ({r.status_code})")
            return None
    except Exception as e:
        print(f"⚠️ API通信エラー: {e}")
        return None

# ====== 公式サイトスクレイピング ======
def fetch_program_scrape(date_str):
    """公式サイトから24場分の出走表をスクレイピング"""
    print(f"🔍 スクレイピング開始: {date_str}")
    all_races = {}
    for stadium in range(1, 25):
        url = f"{SCRAPE_BASE}?jcd={stadium:02d}&hd={date_str}"
        try:
            res = requests.get(url, timeout=10)
            res.encoding = "utf-8"
            if res.status_code != 200:
                print(f"⚠️ {stadium:02d}場 取得失敗 ({res.status_code})")
                continue

            soup = BeautifulSoup(res.text, "lxml")
            title_tag = soup.select_one(".raceTitle")
            title = title_tag.get_text(strip=True) if title_tag else "タイトル不明"
            race_items = soup.select(".table1 tbody tr")
            race_list = []

            for tr in race_items:
                cols = [c.get_text(strip=True) for c in tr.find_all("td")]
                if len(cols) < 5:
                    continue
                race_list.append({
                    "艇": cols[0],
                    "選手名": cols[1],
                    "支部": cols[2],
                    "級": cols[3],
                    "F/L": cols[4],
                })
            all_races[f"{stadium:02d}"] = {
                "title": title,
                "races": race_list,
            }
            print(f"✅ {stadium:02d}場 取得成功 ({len(race_list)}行)")
        except Exception as e:
            print(f"⚠️ {stadium:02d}場 スクレイピング失敗: {e}")
    return all_races

# ====== 結果データAPI ======
def fetch_results(days=30):
    results = {}
    for i in range(days):
        date = today - timedelta(days=i)
        date_str = date.strftime("%Y%m%d")
        url = f"{RESULTS_API}/{date_str}.json"
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                results[date_str] = r.json()
                print(f"✅ 結果取得成功: {date_str}")
            else:
                print(f"⚠️ 結果取得失敗 ({r.status_code}): {date_str}")
        except Exception as e:
            print(f"⚠️ 結果通信エラー: {e}")
    return results

# ====== メイン処理 ======
def main():
    # 1️⃣ 出走表（API or スクレイピング）
    program_data = fetch_program_api(today_str)
    if not program_data:
        print("⚠️ APIから取得できないため、公式サイトからスクレイピングします。")
        program_data = fetch_program_scrape(today_str)
    else:
        print("✅ 出走表をAPIから取得しました。")

    # 2️⃣ 過去30日分の結果
    print("📊 過去30日分の結果データを取得中...")
    results_data = fetch_results(30)

    # 3️⃣ 結合
    combined = {
        "date": today_str,
        "program": program_data,
        "results": results_data,
    }

    # 4️⃣ 保存
    save_json(DATA_FILE, combined)
    print(f"💾 {DATA_FILE} に保存完了 ({today_str})")

# ====== 実行 ======
if __name__ == "__main__":
    main()