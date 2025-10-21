import requests
from bs4 import BeautifulSoup
import json
import datetime
import time
import os

# ===============================
# 競艇AI 自動データ収集スクリプト
# ===============================

# 出力フォルダ
OUTPUT_DIR = "data"
DATA_FILE = f"{OUTPUT_DIR}/data.json"
HISTORY_FILE = f"{OUTPUT_DIR}/history.json"

# 対象ボート場（24場）
VENUES = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
    "蒲郡","常滑","津","三国","びわこ","住之江",
    "尼崎","鳴門","丸亀","児島","宮島","徳山",
    "下関","若松","芦屋","福岡","唐津","大村"
]

# 日付（例：20251021）
today = datetime.date.today().strftime("%Y%m%d")

# 公式サイトのURLテンプレート
BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"

# ===============================
# 1. 本日のレースデータをスクレイピング
# ===============================
def fetch_today_data():
    all_data = []
    for venue_id in range(1, 25):
        try:
            url = f"{BASE_URL}?jcd={venue_id:02d}&hd={today}"
            res = requests.get(url, timeout=10)
            if res.status_code != 200:
                print(f"[{VENUES[venue_id-1]}] スキップ: HTTP {res.status_code}")
                continue
            soup = BeautifulSoup(res.text, "html.parser")

            race_titles = soup.select(".title03")
            if not race_titles:
                print(f"[{VENUES[venue_id-1]}] 開催なし")
                continue

            for i, race in enumerate(race_titles, start=1):
                all_data.append({
                    "date": today,
                    "venue": VENUES[venue_id-1],
                    "race": i,
                    "status": "開催中",
                    "comment": "",
                    "data_source": "boatrace.jp"
                })
            print(f"✅ {VENUES[venue_id-1]} 取得完了 ({len(race_titles)}R)")
            time.sleep(1)

        except Exception as e:
            print(f"⚠️ {VENUES[venue_id-1]} エラー: {e}")
            continue

    return all_data


# ===============================
# 2. 過去レースデータ（外部API）
#    例：オープンAPI (架空デモ)
# ===============================
def fetch_history_data():
    api_url = "https://api-boatrace-data.onrender.com/history"
    try:
        res = requests.get(api_url, timeout=10)
        if res.status_code == 200:
            return res.json()
        else:
            print("⚠️ 外部APIからの取得失敗")
            return []
    except Exception as e:
        print("⚠️ API接続エラー:", e)
        return []


# ===============================
# 3. JSONファイル保存
# ===============================
def save_json(path, data):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"💾 保存完了: {path} ({len(data)}件)")


# ===============================
# メイン処理
# ===============================
def main():
    print("=== ⛵ 競艇AIデータ更新開始 ===")

    today_data = fetch_today_data()
    history_data = fetch_history_data()

    if today_data:
        save_json(DATA_FILE, today_data)
    if history_data:
        save_json(HISTORY_FILE, history_data)

    print("=== ✅ 全処理完了 ===")

if __name__ == "__main__":
    main()