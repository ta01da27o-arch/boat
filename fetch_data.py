import requests
import json
import os
from datetime import datetime, timedelta
from fetch_weather import fetch_weather

DATA_FILE = "data.json"
HISTORY_FILE = "history.json"
PROGRAM_API_TODAY = "https://boatraceopenapi.github.io/programs/v2/today.json"

def fetch_programs():
    print("[INFO] 出走表データ取得開始...")
    resp = requests.get(PROGRAM_API_TODAY, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    # データが dict なら展開して list にする
    if isinstance(data, dict):
        programs = []
        for v in data.values():
            if isinstance(v, list):
                programs.extend(v)
        data = programs

    print(f"[INFO] {len(data)} 件の出走表を取得しました")
    return data

def load_history(path=HISTORY_FILE):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def aggregate_recent_stats(history, days=90):
    cutoff = datetime.now() - timedelta(days=days)
    stats = {}
    for date_str, rec in history.items():
        try:
            d = datetime.strptime(date_str, "%Y%m%d")
        except ValueError:
            continue
        if d < cutoff:
            continue
        for r in rec.get("results", []):
            for entry in r.get("entries", []):
                pid = entry.get("player_id")
                if not pid:
                    continue
                if pid not in stats:
                    stats[pid] = {"races": 0, "wins": 0, "st_sum": 0.0, "course_stats": {}}
                stats[pid]["races"] += 1
                if entry.get("rank") == 1:
                    stats[pid]["wins"] += 1
                st = entry.get("st")
                if st:
                    try:
                        stats[pid]["st_sum"] += float(st)
                    except ValueError:
                        pass
                c = entry.get("course")
                if c:
                    cs = stats[pid]["course_stats"].setdefault(c, {"races": 0, "wins": 0})
                    cs["races"] += 1
                    if entry.get("rank") == 1:
                        cs["wins"] += 1
    # 集計後に比率を計算
    for pid, s in stats.items():
        s["win_rate"] = round(s["wins"] / s["races"], 3) if s["races"] else 0
        s["avg_st"] = round(s["st_sum"] / s["races"], 3) if s["races"] else None
        for c, cs in s["course_stats"].items():
            cs["win_rate"] = round(cs["wins"] / cs["races"], 3) if cs["races"] else 0
    return stats

def merge_stats_with_programs(programs, stats):
    today = datetime.now().strftime("%Y%m%d")
    for race in programs:
        if not isinstance(race, dict):
            print("[DEBUG] race is not dict:", race)
            continue

        # 🔍 entries の型を確認（デバッグ用）
        entries = race.get("entries")
        print("[DEBUG] race keys:", race.keys())
        print("[DEBUG] type(entries):", type(entries))
        if isinstance(entries, list):
            print("[DEBUG] entries sample:", entries[:2])
        else:
            print("[DEBUG] entries value:", entries)

        jcd = race.get("jcd")
        if jcd:
            race["weather"] = fetch_weather(jcd, today)

        # エラー回避：entries がリストでなければスキップ
        if not isinstance(entries, list):
            continue

        for entry in entries:
            if not isinstance(entry, dict):
                print("[DEBUG] entry is not dict:", entry)
                continue
            pid = entry.get("player_id")
            if pid in stats:
                entry["recent_win_rate"] = stats[pid]["win_rate"]
                entry["avg_st"] = stats[pid]["avg_st"]
                entry["course_stats"] = stats[pid]["course_stats"]
    return programs

def save_programs(data, out_path=DATA_FILE):
    # ✅ 必ず新規に data.json を生成・上書きする
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] 出走表を保存しました → {out_path}")

if __name__ == "__main__":
    try:
        programs = fetch_programs()
        history = load_history()
        stats = aggregate_recent_stats(history, days=90)
        merged = merge_stats_with_programs(programs, stats)
        save_programs(merged, DATA_FILE)
    except Exception as e:
        print(f"[ERROR] 出走表処理に失敗しました: {e}")