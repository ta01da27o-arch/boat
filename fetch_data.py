# =======================================
# fetch_data.py（完全版 / 自動インストール対応）
# =======================================
import subprocess
import sys
import json
import datetime
import os

# ---- 強制インストール（GitHub Actions 対策） ----
def ensure_package(pkg):
    try:
        __import__(pkg)
    except ImportError:
        print(f"📦 Installing missing package: {pkg} ...")
        subprocess.run([sys.executable, "-m", "pip", "install", pkg], check=False)

# 必要ライブラリの確実な導入
for pkg in ["beautifulsoup4", "requests", "lxml"]:
    ensure_package(pkg)

from bs4 import BeautifulSoup
import requests

# ====== 最新版 24会場（2025年10月現在）======
VENUES = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖",
    "蒲郡", "常滑", "津", "三国", "琵琶湖", "住之江",
    "尼崎", "鳴門", "丸亀", "児島", "宮島", "徳山",
    "下関", "若松", "芦屋", "福岡", "唐津", "大村"
]

# 保存ファイル
DATA_FILE = "data.json"
HISTORY_FILE = "history.json"

# ====== 仮スクレイピング設定（本番用に変更可）======
BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"  # 公式サイト構造

def fetch_daily_data(date_str):
    """指定日（YYYYMMDD）の仮データを作成"""
    data = {}
    for venue in VENUES:
        races = []
        for i in range(1, 13):
            races.append({
                "race_no": i,
                "boats": [
                    {
                        "racer_name": f"選手{i}-{lane}",
                        "racer_boat_number": lane,
                        "racer_start_timing": round(0.10 + lane * 0.02, 2),
                        "racer_class": "A1" if lane <= 2 else "B1",
                        "racer_flying_count": 0,
                        "racer_national_win_rate": round(6.0 - lane * 0.2, 2),
                        "racer_local_win_rate": round(5.5 - lane * 0.1, 2),
                        "racer_motor_win_rate": round(4.5 + lane * 0.3, 2),
                        "racer_course_win_rate": round(4.0 + lane * 0.1, 2)
                    } for lane in range(1, 7)
                ]
            })
        data[venue] = {"races": races}
    return data


# ====== メイン処理 ======
def main():
    print("📅 60日分のレースデータを取得します...")

    today = datetime.date.today()
    all_data = {}
    history = {"results": []}

    for i in range(60):
        day = today - datetime.timedelta(days=i)
        date_key = day.strftime("%Y%m%d")
        print(f"  ⏳ {date_key} を処理中...")

        try:
            # ここで実際に requests + BeautifulSoup によるスクレイピングを実装可能
            # res = requests.get(BASE_URL, params={"rno": 1, "jcd": "01", "hd": date_key})
            # soup = BeautifulSoup(res.text, "lxml")

            # 今回はダミーデータを作成
            daily = fetch_daily_data(date_key)
            all_data[date_key] = daily
        except Exception as e:
            print(f"⚠️ {date_key} の取得中にエラー発生: {e}")

    # ====== 保存 ======
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print("✅ data.json / history.json の更新完了！")


if __name__ == "__main__":
    main()