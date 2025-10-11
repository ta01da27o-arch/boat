import requests
from bs4 import BeautifulSoup
import json
import datetime
from pathlib import Path
from datetime import timedelta, timezone

# ===== 設定 =====
DATA_FILE = Path("data.json")
SCRAPE_BASE = "https://www.boatrace.jp/owpc/pc/race/racelist"
JST = timezone(timedelta(hours=9))
today = datetime.datetime.now(JST).date()
today_str = today.strftime("%Y%m%d")

print(f"📅 本日({today_str})のレースデータをスクレイピング開始")

# ====== JSON保存関数 ======
def save_json(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"💾 保存完了: {DATA_FILE}")

# ====== 1会場のレースデータ取得 ======
def fetch_venue_races(stadium_id, date_str):
    url = f"{SCRAPE_BASE}?jcd={stadium_id:02d}&hd={date_str}"
    try:
        res = requests.get(url, timeout=10)
        res.encoding = "utf-8"
        if res.status_code != 200:
            print(f"⚠️ {stadium_id:02d}場 取得失敗 ({res.status_code})")
            return None

        soup = BeautifulSoup(res.text, "lxml")
        title_tag = soup.select_one(".main_race_title")
        title = title_tag.get_text(strip=True) if title_tag else f"{stadium_id:02d}場"

        race_cards = soup.select(".table1")
        race_data = []

        for r, table in enumerate(race_cards, start=1):
            boats = []
            rows = table.select("tbody tr")
            for row in rows:
                cols = [c.get_text(strip=True) for c in row.find_all("td")]
                if len(cols) >= 6:
                    boats.append({
                        "racer_boat_number": len(boats) + 1,
                        "racer_name": cols[1],
                        "racer_class_number": cols[3],
                        "racer_branch_number": cols[2],
                        "racer_flying_count": cols[4],
                        "racer_average_start_timing": cols[5] if len(cols) > 5 else "",
                    })
            race_data.append({
                "race_date": date_str,
                "race_stadium_number": stadium_id,
                "race_number": r,
                "race_title": title,
                "boats": boats
            })

        print(f"✅ {stadium_id:02d}場 取得成功 ({len(race_data)}R)")
        return race_data
    except Exception as e:
        print(f"⚠️ {stadium_id:02d}場 エラー: {e}")
        return None

# ====== 全会場処理 ======
def main():
    all_data = []
    for sid in range(1, 25):  # 24会場分
        races = fetch_venue_races(sid, today_str)
        if races:
            all_data.extend(races)

    if not all_data:
        print("❌ 本日のレースデータが取得できませんでした。")
        return

    save_json(all_data)
    print(f"🎯 本日のレースデータ取得完了 ({len(all_data)}レース分)")

# ====== 実行 ======
if __name__ == "__main__":
    main()