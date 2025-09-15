import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime, timedelta
from glob import glob

# === 24場の場コード一覧 ===
VENUES = {
    1: "桐生", 2: "戸田", 3: "江戸川", 4: "平和島", 5: "多摩川", 6: "浜名湖",
    7: "蒲郡", 8: "常滑", 9: "津", 10: "三国", 11: "びわこ", 12: "住之江",
    13: "尼崎", 14: "鳴門", 15: "丸亀", 16: "児島", 17: "宮島", 18: "徳山",
    19: "下関", 20: "若松", 21: "芦屋", 22: "福岡", 23: "唐津", 24: "大村"
}

# 保存フォルダ
DATA_DIR = "data"
os.makedirs(DATA_DIR, exist_ok=True)

# 取得対象日
today = datetime.now().strftime("%Y-%m-%d")

# --- 出走表と結果を取得する関数 ---
def fetch_race_data(stadium_code, date):
    race_data = []
    base_url = "https://www.boatrace.jp/owpc/pc/race"

    for race_no in range(1, 13):  # 1〜12R
        entry_url = f"{base_url}/racelist?rno={race_no}&jcd={stadium_code:02d}&hd={date}"
        result_url = f"{base_url}/raceresult?rno={race_no}&jcd={stadium_code:02d}&hd={date}"

        boats = []
        result = []

        # --- 出走表取得 ---
        try:
            res = requests.get(entry_url)
            soup = BeautifulSoup(res.text, "html.parser")
            rows = soup.select("div.is-fs12")
            for idx, row in enumerate(rows[:6]):  # 6艇分
                boats.append({"number": idx + 1, "name": row.get_text(strip=True)})
        except Exception as e:
            print(f"出走表取得失敗: {stadium_code} {race_no}R {e}")

        # --- 結果取得 ---
        try:
            res = requests.get(result_url)
            soup = BeautifulSoup(res.text, "html.parser")
            ranks = soup.select("div.is-fs12")
            for rank in ranks[:6]:
                try:
                    result.append(int(rank.get_text(strip=True)))
                except:
                    continue
        except Exception as e:
            print(f"結果取得失敗: {stadium_code} {race_no}R {e}")

        race_data.append({
            "race_date": date,
            "race_stadium_number": stadium_code,
            "race_number": race_no,
            "boats": boats,
            "result": result
        })

    return race_data


# --- 全場分まとめて取得 ---
all_races = []
for code in VENUES.keys():
    all_races.extend(fetch_race_data(code, today.replace("-", "")))

# --- 当日分を data.json に保存 ---
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(all_races, f, ensure_ascii=False, indent=2)

# --- 日付ごとの履歴保存 ---
daily_file = os.path.join(DATA_DIR, f"{today}.json")
with open(daily_file, "w", encoding="utf-8") as f:
    json.dump(all_races, f, ensure_ascii=False, indent=2)

# --- AI的中率の集計 ---
total_races = 0
hit_races = 0

for file in glob(os.path.join(DATA_DIR, "*.json")):
    with open(file, "r", encoding="utf-8") as f:
        races = json.load(f)
        for r in races:
            if "result" in r and r["result"]:
                total_races += 1
                # TODO: AI予想と比較して的中したかどうか判定するロジックをここに追加
                # 仮に「1号艇が勝ったら的中」とする
                if r["result"][0] == 1:
                    hit_races += 1

summary = {
    "global_hit_rate": round(hit_races / total_races * 100, 1) if total_races > 0 else 0,
    "total_races": total_races,
    "hit_races": hit_races
}

with open("summary.json", "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

print("✅ fetch_data.py 完了")