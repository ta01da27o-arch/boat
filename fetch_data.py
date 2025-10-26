import os
import json
import time
import random
import requests
import subprocess
from datetime import datetime

# -------------------------------------
# ⚙ 設定
# -------------------------------------
DATA_DIR = "data"
DATA_FILE = os.path.join(DATA_DIR, "data.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")

# 対象場リスト（24場）
VENUES = [
    "桐生", "戸田", "江戸川", "平和島", "多摩川", "浜名湖", "蒲郡", "常滑",
    "津", "三国", "びわこ", "住之江", "尼崎", "鳴門", "丸亀", "児島",
    "宮島", "徳山", "下関", "若松", "芦屋", "福岡", "唐津", "大村"
]

# -------------------------------------
# 🛰️ データ取得関数（開催判定含む）
# -------------------------------------
def fetch_boatrace_data(venue):
    """競艇公式から開催データを取得（開催中か判定）"""
    base_url = f"https://www.boatrace.jp/owpc/pc/RaceRaceList"
    params = {"jcd": VENUES.index(venue) + 1, "hd": datetime.now().strftime("%Y%m%d")}

    for retry in range(3):
        try:
            res = requests.get(base_url, params=params, timeout=8)
            if res.status_code == 200 and "レース情報" in res.text:
                print(f"🏁 {venue}：開催中")
                return {"status": "開催中", "hit_rate": random.randint(30, 85), "races": {}}
            else:
                print(f"ー {venue}：非開催")
                return {"status": "ー", "hit_rate": 0, "races": {}}
        except requests.exceptions.Timeout:
            print(f"⚠️ {venue} タイムアウト再試行 ({retry+1}/3)")
            time.sleep(1)

    print(f"ー {venue}：非開催（最終）")
    return {"status": "ー", "hit_rate": 0, "races": {}}

# -------------------------------------
# 💾 JSON保存
# -------------------------------------
def save_json(data, filename):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# -------------------------------------
# 🚀 GitHub自動Push機能（Render→GitHub）
# -------------------------------------
def push_to_github():
    """RenderからGitHubへ自動push"""
    token = os.getenv("GITHUB_TOKEN")
    repo = os.getenv("GITHUB_REPO")
    branch = os.getenv("GITHUB_BRANCH", "main")
    user = os.getenv("GITHUB_USER", "github-actions[bot]")

    if not token or not repo:
        print("⚠️ GitHub設定未登録（pushスキップ）")
        return

    print("📡 GitHubへ自動Push開始")

    try:
        subprocess.run(["git", "config", "--global", "user.email", "actions@github.com"], check=True)
        subprocess.run(["git", "config", "--global", "user.name", user], check=True)
        subprocess.run(["git", "add", "data/data.json", "data/history.json"], check=True)
        subprocess.run(["git", "commit", "-m", f"Auto update {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"], check=False)
        subprocess.run(["git", "push", f"https://{token}@github.com/{repo}.git", branch], check=True)
        print("✅ GitHubへ自動反映完了")

    except subprocess.CalledProcessError as e:
        print(f"❌ GitHub Push失敗: {e}")

# -------------------------------------
# 🧭 メイン処理
# -------------------------------------
def main():
    print("🚀 Render 自動更新スクリプト開始")

    data = {}
    history = {}

    for venue in VENUES:
        info = fetch_boatrace_data(venue)
        data[venue] = info
        history[venue] = info

    today_str = datetime.now().strftime("%Y-%m-%d")

    data["last_update"] = today_str
    history["last_update"] = today_str

    save_json(data, DATA_FILE)
    save_json(history, HISTORY_FILE)

    print(f"✅ 完了: {today_str}")
    print(f"├ data.json: {len(VENUES)}場分")
    print(f"└ history.json: {len(VENUES)}場分")

    # GitHubへ反映
    push_to_github()

# -------------------------------------
# 実行
# -------------------------------------
if __name__ == "__main__":
    main()