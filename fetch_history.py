import os
import json
import requests
import datetime
from pathlib import Path

# 保存先ファイル
DATA_FILE = Path("history.json")

# APIベースURL
RESULTS_API = "https://boatraceopenapi.github.io/results/v2"

def fetch_result_api(date_str):
    """
    指定日付(YYYYMMDD)のレース結果JSONを取得
    """
    url = f"{RESULTS_API}/{date_str[:4]}/{date_str}.json"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"取得失敗 {date_str}: {resp.status_code}")
            return None
    except Exception as e:
        print(f"取得エラー {date_str}: {e}")
        return None


def load_existing_data():
    """
    保存済みのhistory.jsonを読み込み
    """
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_data(data):
    """
    辞書形式のデータをhistory.jsonに保存
    """
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def fetch_past_days(days=60):
    """
    過去days日分のレース結果を取得
    """
    today = datetime.date.today()
    all_data = load_existing_data()

    for i in range(days):
        target_date = today - datetime.timedelta(days=i)
        date_str = target_date.strftime("%Y%m%d")

        # 既に保存済みならスキップ
        if date_str in all_data:
            continue

        print(f"取得中: {date_str}")
        result = fetch_result_api(date_str)
        if result:
            all_data[date_str] = result

    save_data(all_data)
    print(f"✅ 過去{days}日分データを保存完了 → {DATA_FILE}")


def weekly_update():
    """
    直近7日分を更新
    """
    today = datetime.date.today()
    all_data = load_existing_data()

    for i in range(7):
        target_date = today - datetime.timedelta(days=i)
        date_str = target_date.strftime("%Y%m%d")

        print(f"更新中: {date_str}")
        result = fetch_result_api(date_str)
        if result:
            all_data[date_str] = result

    save_data(all_data)
    print("✅ 直近1週間分を更新完了")


if __name__ == "__main__":
    # 初回実行 → 60日分を保存
    if not DATA_FILE.exists():
        fetch_past_days(60)
    else:
        # 2回目以降は週次更新
        weekly_update()