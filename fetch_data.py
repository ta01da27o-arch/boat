import requests
import json
import datetime
from datetime import timedelta, timezone
import os

# ====== 設定 ======
HISTORY_FILE = "history.json"
OUTPUT_FILE = "data.json"
API_PROGRAM = "https://boatraceopenapi.github.io/api/programs/v3"
API_RESULT_CANDIDATES = [
    "https://boatraceopenapi.github.io/api/results/v3",
    "https://boatraceopenapi.github.io/results/v3",
    "https://boatraceopenapi.github.io/api/results/v2",
    "https://boatraceopenapi.github.io/results/v2"
]

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

all_data = []

def fetch_json(url):
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            return r.json()
        else:
            print(f"⚠️ 取得失敗 ({r.status_code}): {url}")
            return None
    except Exception as e:
        print(f"⚠️ 通信エラー: {url} → {e}")
        return None

# ====== 出走表 ======
def fetch_program(date):
    url = f"{API_PROGRAM}/{date}.json"
    data = fetch_json(url)
    if data:
        print(f"✅ 出走表取得成功: {date}")
    else:
        print(f"⚠️ 出走表データなし: {date}")
    return data

# ====== 結果 ======
def fetch_result(date):
    for base in API_RESULT_CANDIDATES:
        url = f"{base}/{date}.json"
        data = fetch_json(url)
        if data:
            print(f"✅ 結果データ取得成功: {url}")
            return data
    print(f"⚠️ 結果データが見つかりません: {date}")
    return None

# ====== 当日出走表 ======
program_data = fetch_program(date_str)

if not program_data:
    print("🔁 当日データなし → 前日を試行します")
    prev_day = today - timedelta(days=1)
    date_str = prev_day.strftime("%Y%m%d")
    program_data = fetch_program(date_str)

if program_data:
    all_data.append({"date": date_str, "programs": program_data})
else:
    print("⚠️ 出走表データが取得できませんでした。")

# ====== 過去30日分の結果 ======
for i in range(30):
    d = today - timedelta(days=i)
    d_str = d.strftime("%Y%m%d")
    result = fetch_result(d_str)
    if result:
        all_data.append({"date": d_str, "results": result})

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

print("✅ 全処理完了。")