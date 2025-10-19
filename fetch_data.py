import json, os, requests
from datetime import datetime, timedelta, timezone

# ===== 設定 =====
JST = timezone(timedelta(hours=9))
DATA_PATH = "data/data.json"
HISTORY_PATH = "data/history.json"
DAYS_TO_KEEP = 60  # ← 直近60日間保持
API_URL = "https://api.odds-api.example/boatrace/day"  # 仮API例

# ===== 共通関数 =====
def load_json(path):
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ===== データ取得 =====
def fetch_day(date_str):
    """指定日データをAPIから取得（仮データ対応）"""
    try:
        # 実際のAPIを使う場合は↓を有効に
        # r = requests.get(f"{API_URL}?date={date_str}", timeout=10)
        # r.raise_for_status()
        # return r.json()

        # ダミーデータ生成
        return [
            {
                "date": date_str,
                "race": i,
                "venue": "桐生",
                "wind": round(1.0 + i * 0.1, 1),
                "wave": round(0.5 + i * 0.1, 1),
                "result": "仮データ",
            }
            for i in range(1, 13)
        ]
    except Exception as e:
        print(f"[WARN] {date_str} の取得に失敗: {e}")
        return []

# ===== 履歴更新 =====
def update_history(all_data):
    """履歴ファイルを更新（60日分保持）"""
    history = load_json(HISTORY_PATH)
    if isinstance(history, dict):
        history = list(history.values())

    # 既存＋新規をまとめる（重複除外）
    date_seen = set()
    merged = []
    for d in sorted(all_data + history, key=lambda x: x.get("date", "")):
        key = f"{d.get('date')}_{d.get('race')}"
        if key not in date_seen:
            date_seen.add(key)
            merged.append(d)

    # 60日以上前を削除
    cutoff = (datetime.now(JST) - timedelta(days=DAYS_TO_KEEP)).strftime("%Y%m%d")
    merged = [d for d in merged if d.get("date", "") >= cutoff]

    save_json(HISTORY_PATH, merged)
    print(f"[INFO] 履歴データ更新: {len(merged)}件保持")

# ===== メイン処理 =====
def main():
    today = datetime.now(JST)
    all_data = []

    print(f"📅 Fetching last {DAYS_TO_KEEP} days of race data...")

    for i in range(DAYS_TO_KEEP):
        date_obj = today - timedelta(days=i)
        date_str = date_obj.strftime("%Y%m%d")

        day_data = fetch_day(date_str)
        if day_data:
            print(f"✅ {date_str}: {len(day_data)} races")
            all_data.extend(day_data)
        else:
            print(f"⚠ {date_str}: データなし")

    # 最新日分のみ data.json に保存
    latest_date = today.strftime("%Y%m%d")
    latest_data = [d for d in all_data if d.get("date") == latest_date]
    save_json(DATA_PATH, latest_data)

    # 履歴ファイルに統合保存
    update_history(all_data)

    print(f"🎯 完了: 最新 {DAYS_TO_KEEP}日分の履歴を保存しました。")

if __name__ == "__main__":
    main()