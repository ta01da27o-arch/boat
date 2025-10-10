import requests
import json
import datetime
from datetime import timedelta, timezone
import os

# ====== 設定 ======
HISTORY_FILE = "history.json"
OUTPUT_FILE = "data.json"
API_URL = "https://boatraceopenapi.github.io/api/programs/v3"
RESULT_URL = "https://boatraceopenapi.github.io/api/results/v3"

# ====== JST（日本時間）設定 ======
JST = timezone(timedelta(hours=9))
today = datetime.datetime.now(JST).date()
date_str = today.strftime("%Y%m%d")
print(f"📅 出走表取得開始（JST基準）: {date_str}")

# ====== 履歴ファイル読み込み ======
if os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        history = json.load(f)
else:
    history = []

# ====== データ格納用 ======
all_data = []

# ====== APIから当日分を取得 ======
def fetch_json(url):
    try:
        r = requests.get(url)
        if r.status_code == 200:
            return r.json()
        else:
            print(f"⚠️ 取得失敗 ({r.status_code}): {url}")
            return None
    except Exception as e:
        print(f"⚠️ 取得エラー: {e}")
        return None


def fetch_race_data(date_str):
    url = f"{API_URL}/{date_str}.json"
    data = fetch_json(url)
    if data:
        print(f"✅ 出走表取得成功: {date_str}")
    else:
        print(f"⚠️ 出走表データなし: {date_str}")
    return data


def fetch_result_data(date_str):
    url = f"{RESULT_URL}/{date_str}.json"
    data = fetch_json(url)
    if data:
        print(f"✅ 結果データ取得成功: {date_str}")
    else:
        print(f"⚠️ 結果データなし: {date_str}")
    return data


# ====== 当日データ取得（JST基準） ======
race_data = fetch_race_data(date_str)

if not race_data:
    print(f"🔁 当日データなし → 前日データを取得します")
    prev_day = today - timedelta(days=1)
    date_str = prev_day.strftime("%Y%m%d")
    race_data = fetch_race_data(date_str)

if race_data:
    all_data.append({
        "date": date_str,
        "programs": race_data
    })
else:
    print("⚠️ 出走表データが取得できませんでした。")

# ====== 結果データも取得（過去30日分） ======
for i in range(30):
    d = today - timedelta(days=i)
    d_str = d.strftime("%Y%m%d")
    result_data = fetch_result_data(d_str)
    if result_data:
        all_data.append({
            "date": d_str,
            "results": result_data
        })

# ====== data.json 保存 ======
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)
print(f"💾 data.json に保存完了 ({len(all_data)}日分)")

# ====== history.json 更新 ======
if date_str not in history:
    history.append(date_str)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history[-100:], f, ensure_ascii=False, indent=2)
    print(f"🆕 history.json 更新: {date_str}")

print("✅ 全ての処理が完了しました。")