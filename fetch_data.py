# fetch_data.py
# 出走表＋結果＋AI予測（本命・穴・コメント・順位）を自動生成し保存する統合スクリプト

import requests
from bs4 import BeautifulSoup
import json
import random
from datetime import datetime, timedelta
import os

# ======== 設定 ========
BASE_URL = "https://www.boatrace.jp"
DATA_DIR = "data"
DATA_FILE = os.path.join(DATA_DIR, "data.json")
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")

# ======== 共通関数 ========
def jst_now():
    return datetime.utcnow() + timedelta(hours=9)

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def get_soup(url):
    res = requests.get(url)
    res.encoding = res.apparent_encoding
    return BeautifulSoup(res.text, "html.parser")

# ======== AI 予測ロジック ========
def generate_ai_predictions(entries):
    """出走表データを基にAI買い目・展開コメント・順位予測を生成"""
    ai_main = []
    ai_sub = []
    comments = []
    ai_rank = []

    # 評価値を元に確率を計算
    scores = []
    for e in entries:
        base = 70 if e["eval"] == "◎" else 60 if e["eval"] == "◯" else 50 if e["eval"] == "▲" else 40
        # ST値が速いほど高スコア
        score = base + (0.20 - e["st"]) * 100
        scores.append((e["lane"], e["name"], score))

    # 順位順に並び替え
    sorted_scores = sorted(scores, key=lambda x: x[2], reverse=True)

    # AI順位予測
    for rank, (lane, name, score) in enumerate(sorted_scores, 1):
        ai_rank.append({
            "rank": rank,
            "lane": lane,
            "name": name,
            "score": round(score, 2)
        })

    # 本命買い目（上位艇から3連単ランダム組み合わせ）
    top = [s[0] for s in sorted_scores[:3]]
    all_combos = [f"{a}-{b}-{c}" for a in top for b in top for c in top if len({a,b,c}) == 3]
    main_choices = random.sample(all_combos, min(5, len(all_combos)))

    for c in main_choices:
        ai_main.append({
            "bet": c,
            "prob": f"{round(random.uniform(20, 40), 1)}%"
        })

    # 穴買い目（下位艇中心）
    low = [s[0] for s in sorted_scores[3:]]
    all_low = [f"{a}-{b}-{c}" for a in low for b in low for c in low if len({a,b,c}) == 3]
    sub_choices = random.sample(all_low, min(5, len(all_low)))

    for c in sub_choices:
        ai_sub.append({
            "bet": c,
            "prob": f"{round(random.uniform(5, 15), 1)}%"
        })

    # 展開コメント生成
    tactics = ["逃げ", "差し", "まくり", "まくり差し", "抜き", "恵まれ"]
    for e in entries:
        move = random.choice(tactics)
        comments.append({
            "lane": e["lane"],
            "comment": f"{e['name']} は {move} が狙い目。"
        })

    return ai_main, ai_sub, comments, ai_rank

# ======== 出走表取得（AI生成込み） ========
def fetch_race_entries():
    print("▶ 出走表データ取得＋AI予測生成中...")
    ensure_dir(DATA_DIR)
    data = {}
    today = jst_now().strftime("%Y%m%d")

    venues = [
        "桐生", "戸田", "江戸川", "平和島", "多摩川",
        "浜名湖", "蒲郡", "常滑", "津", "三国",
        "びわこ", "住之江", "尼崎", "鳴門", "丸亀",
        "児島", "宮島", "徳山", "下関", "若松",
        "芦屋", "福岡", "唐津", "大村"
    ]

    for v in venues:
        print(f"  - {v} のデータ生成中...")
        venue_key = v
        data[venue_key] = {"status": "ー", "races": {}}

        # 仮想「開催中」設定
        data[venue_key]["status"] = random.choice(["開催中", "終了", "ー"])

        for r in range(1, 13):
            race_key = f"{r}R"
            entries = []

            # 仮出走表データ
            for i in range(1, 7):
                entry = {
                    "lane": i,
                    "class": "A1" if i <= 2 else "B1",
                    "name": f"選手{i}",
                    "st": round(0.12 + 0.01 * i, 2),
                    "f": "F1" if i == 3 else "ー",
                    "nation": round(6.20 - 0.2 * i, 2),
                    "local": round(6.00 - 0.2 * i, 2),
                    "motor": round(6.40 - 0.3 * i, 2),
                    "course": round(5.80 - 0.1 * i, 2),
                    "eval": random.choice(["◎", "◯", "▲", "△"])
                }
                entries.append(entry)

            ai_main, ai_sub, comments, ai_rank = generate_ai_predictions(entries)

            data[venue_key]["races"][race_key] = {
                "title": f"{v} 第{r}R",
                "entries": entries,
                "ai_main": ai_main,
                "ai_sub": ai_sub,
                "comments": comments,
                "ai_rank": ai_rank,
            }

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ 出走表＋AI予測データ保存完了：{DATA_FILE}")

# ======== 結果取得 ========
def fetch_race_results():
    print("▶ レース結果データ取得中...")
    ensure_dir(DATA_DIR)
    results = {}
    today = jst_now().strftime("%Y%m%d")

    venues = [
        "桐生", "戸田", "江戸川", "平和島", "多摩川",
        "浜名湖", "蒲郡", "常滑", "津", "三国",
        "びわこ", "住之江", "尼崎", "鳴門", "丸亀",
        "児島", "宮島", "徳山", "下関", "若松",
        "芦屋", "福岡", "唐津", "大村"
    ]

    for v in venues:
        results[v] = {}
        for r in range(1, 13):
            results[v][f"{r}R"] = {
                "finish": [
                    {"rank": 1, "lane": 1, "name": "選手1", "st": 0.13},
                    {"rank": 2, "lane": 3, "name": "選手3", "st": 0.15},
                    {"rank": 3, "lane": 5, "name": "選手5", "st": 0.17}
                ],
                "決まり手": random.choice(["逃げ", "まくり", "差し", "まくり差し", "抜き"])
            }

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"✅ 結果データ保存完了：{HISTORY_FILE}")

# ======== メイン ========
if __name__ == "__main__":
    now = jst_now()
    hour = now.hour

    if 7 <= hour < 9:
        fetch_race_entries()
    elif 22 <= hour < 24:
        fetch_race_results()
    else:
        print("現在の時刻では実行対象外です。8時 or 23時 に自動実行されます。")