import requests
import re
import json
import os
from datetime import datetime

# 保存パス
DATA_PATH = "data/data.json"
HISTORY_PATH = "data/history.json"

# 開催場コード
VENUES = {
    "桐生": "01", "戸田": "02", "江戸川": "03", "平和島": "04",
    "多摩川": "05", "浜名湖": "06", "蒲郡": "07", "常滑": "08",
    "津": "09", "三国": "10", "びわこ": "11", "住之江": "12",
    "尼崎": "13", "鳴門": "14", "丸亀": "15", "児島": "16",
    "宮島": "17", "徳山": "18", "下関": "19", "若松": "20",
    "芦屋": "21", "福岡": "22", "唐津": "23", "大村": "24"
}

# JSON保存
def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# window.__RACE_DATA__抽出
def extract_race_json(html):
    match = re.search(r"window\.__RACE_DATA__\s*=\s*(\{.*?\});", html, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    return None

# レース出走表を構造化
def parse_race_data(race_data):
    results = []
    for r in race_data.get("racers", []):
        try:
            results.append({
                "艇番": r.get("teiban"),
                "選手名": r.get("name"),
                "級": r.get("class"),
                "平均ST": r.get("stAvg"),
                "F数": r.get("fCount"),
                "全国勝率": r.get("nationWinRate"),
                "当地勝率": r.get("localWinRate"),
                "モーター勝率": r.get("motorWinRate"),
                "コース勝率": r.get("courseWinRate"),
            })
        except Exception:
            continue
    return results

# 出走表取得（1場）
def fetch_race_table(venue_code, date_str):
    races = {}
    for rno in range(1, 13):
        url = f"https://www.boatrace.jp/owpc/pc/race/racedata?rno={rno}&jcd={venue_code}&hd={date_str}"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code != 200:
                continue
            race_json = extract_race_json(res.text)
            if not race_json or "racers" not in race_json:
                continue
            races[str(rno)] = parse_race_data(race_json)
        except Exception:
            continue
    return races

def main():
    today = datetime.now().strftime("%Y%m%d")
    print("🚀 GitHub Actions 出走表スクレイピング開始")

    all_data = {}
    for venue, code in VENUES.items():
        print(f"📡 {venue} 取得中...")
        races = fetch_race_table(code, today)
        status = "開催中" if races else "ー"
        all_data[venue] = {
            "date": today,
            "status": status,
            "races": races
        }
        print(f"✅ {venue} 完了 ({len(races)}R 取得)")

    save_json(DATA_PATH, all_data)
    print(f"✅ data.json 更新完了 ({len(VENUES)}場)")

    # 履歴ファイル更新（最新2日分保持）
    if os.path.exists(HISTORY_PATH):
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            history = json.load(f)
    else:
        history = {}

    history[today] = all_data
    for key in sorted(history.keys())[:-2]:
        del history[key]

    save_json(HISTORY_PATH, history)
    print(f"🧠 history.json 更新完了 (2日分保持)")
    print(f"🎯 完了: {today}")

if __name__ == "__main__":
    main()