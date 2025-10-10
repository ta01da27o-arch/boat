# =======================================
# 🏁 fetch_data.py - 出走表自動取得 (v3対応最終版)
# =======================================

import os
import json
import requests
import datetime
from pathlib import Path

# === 保存ファイル ===
DATA_FILE = Path("data.json")

# === ベースURL ===
PROGRAM_API_V3 = "https://boatraceopenapi.github.io/api/programs/v3"
RACER_API      = "https://boatraceopenapi.github.io/racers/v2"

# === 出走表データ取得（v3全体構造） ===
def fetch_program_all(date_str: str):
    url = f"{PROGRAM_API_V3}/{date_str}.json"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            print(f"✅ 出走表取得成功: {url}")
            return r.json()
        else:
            print(f"⚠️ 出走表取得失敗: {r.status_code}")
    except Exception as e:
        print(f"❌ 取得エラー: {e}")
    return []

# === 選手データ取得 ===
def fetch_racer_data(racer_num: int):
    url = f"{RACER_API}/{racer_num}.json"
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None

# === 出走表を組み立て ===
def build_race_data(programs, date_str):
    result = []
    for race in programs:
        race_obj = {
            "race_date": date_str,
            "race_stadium_number": race.get("stadium_number"),
            "race_number": race.get("race_number"),
            "race_closed_at": race.get("race_closed_at"),
            "race_grade_number": race.get("race_grade_number"),
            "race_title": race.get("race_title"),
            "race_subtitle": race.get("race_subtitle"),
            "race_distance": race.get("race_distance"),
            "boats": [],
        }

        # 出走表の各艇データ
        entries = race.get("entries") or []
        for e in entries:
            racer_number = e.get("racer_number")
            racer_info = fetch_racer_data(racer_number) or {}

            boat = {
                "racer_boat_number": e.get("pit_number"),
                "racer_name": e.get("racer_name"),
                "racer_number": racer_number,
                "racer_class_number": racer_info.get("class_number"),
                "racer_branch_number": racer_info.get("branch_number"),
                "racer_birthplace_number": racer_info.get("birthplace_number"),
                "racer_age": racer_info.get("age"),
                "racer_weight": e.get("racer_weight"),
                "racer_flying_count": e.get("flying_count"),
                "racer_late_count": e.get("late_count"),
                "racer_average_start_timing": e.get("average_start_timing"),
                "racer_national_top_1_percent": e.get("national_win_rate_1"),
                "racer_national_top_2_percent": e.get("national_win_rate_2"),
                "racer_national_top_3_percent": e.get("national_win_rate_3"),
                "racer_local_top_1_percent": e.get("local_win_rate_1"),
                "racer_local_top_2_percent": e.get("local_win_rate_2"),
                "racer_local_top_3_percent": e.get("local_win_rate_3"),
            }
            race_obj["boats"].append(boat)

        result.append(race_obj)

    return result

# === メイン処理 ===
def fetch_all_data():
    today = datetime.date.today()
    date_str = today.strftime("%Y%m%d")

    print(f"📅 出走表取得開始: {date_str}")
    programs = fetch_program_all(date_str)

    if not programs:
        print("⚠️ 出走表データが取得できませんでした。")
        return

    all_data = build_race_data(programs, date_str)

    if all_data:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        print(f"✅ data.json に {len(all_data)}件保存完了")
    else:
        print("⚠️ 出走表データが空です。")

# === 実行 ===
if __name__ == "__main__":
    fetch_all_data()