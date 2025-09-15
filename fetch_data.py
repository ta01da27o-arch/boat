import requests
from bs4 import BeautifulSoup
import json
import os
import joblib
from datetime import datetime
from glob import glob

# === 24場の場コード一覧 ===
VENUES = {
    1: "桐生", 2: "戸田", 3: "江戸川", 4: "平和島", 5: "多摩川", 6: "浜名湖",
    7: "蒲郡", 8: "常滑", 9: "津", 10: "三国", 11: "びわこ", 12: "住之江",
    13: "尼崎", 14: "鳴門", 15: "丸亀", 16: "児島", 17: "宮島", 18: "徳山",
    19: "下関", 20: "若松", 21: "芦屋", 22: "福岡", 23: "唐津", 24: "大村"
}

DATA_DIR = "data"
MODEL_DIR = "model"
os.makedirs(DATA_DIR, exist_ok=True)

today = datetime.now().strftime("%Y-%m-%d")
today_param = datetime.now().strftime("%Y%m%d")

# --- 学習済みモデルを読み込む ---
model = None
model_path = os.path.join(MODEL_DIR, "model.pkl")
if os.path.exists(model_path):
    model = joblib.load(model_path)
    print("✅ 学習済みモデルを読み込みました")
else:
    print("⚠️ モデル未学習のため暫定ルールで予測します")

# --- AI予測関数 ---
def ai_predict(boats):
    if not boats:
        return []

    if model is None:
        # 暫定ロジック: 1-2-3固定
        return [1, 2, 3, 4, 5, 6]

    X = []
    for b in boats:
        num = b.get("number", 0)
        feat = [
            num,
            1 if num == 1 else 0,
            1 if num <= 3 else 0
        ]
        X.append(feat)

    probs = model.predict_proba(X)[:, 1]  # 1着確率
    order = sorted(zip([b["number"] for b in boats], probs),
                   key=lambda x: x[1], reverse=True)
    prediction = [num for num, _ in order]
    return prediction

# --- 出走表＆結果取得 ---
def fetch_race_data(stadium_code, date):
    race_data = []
    base_url = "https://www.boatrace.jp/owpc/pc/race"

    for race_no in range(1, 13):
        entry_url = f"{base_url}/racelist?rno={race_no}&jcd={stadium_code:02d}&hd={date}"
        result_url = f"{base_url}/raceresult?rno={race_no}&jcd={stadium_code:02d}&hd={date}"

        boats, result = [], []
        ai_prediction = []

        # 出走表
        try:
            res = requests.get(entry_url)
            soup = BeautifulSoup(res.text, "html.parser")
            rows = soup.select("div.is-fs12")
            for idx, row in enumerate(rows[:6]):
                boats.append({"number": idx + 1, "name": row.get_text(strip=True)})
        except Exception as e:
            print(f"出走表取得失敗: {stadium_code} {race_no}R {e}")

        # AI予測
        ai_prediction = ai_predict(boats)

        # 結果
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
            "race_date": today,
            "race_stadium_number": stadium_code,
            "race_number": race_no,
            "boats": boats,
            "ai_prediction": ai_prediction,
            "result": result
        })

    return race_data

# --- 全場まとめて取得 ---
all_races = []
for code in VENUES.keys():
    all_races.extend(fetch_race_data(code, today_param))

# --- 保存 ---
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(all_races, f, ensure_ascii=False, indent=2)

daily_file = os.path.join(DATA_DIR, f"{today}.json")
with open(daily_file, "w", encoding="utf-8") as f:
    json.dump(all_races, f, ensure_ascii=False, indent=2)

# --- 的中率集計 ---
total_races, hit_races = 0, 0
for file in glob(os.path.join(DATA_DIR, "*.json")):
    with open(file, "r", encoding="utf-8") as f:
        races = json.load(f)
        for r in races:
            if r.get("result") and r.get("ai_prediction"):
                total_races += 1
                if r["ai_prediction"][0] == r["result"][0]:
                    hit_races += 1

summary = {
    "global_hit_rate": round(hit_races / total_races * 100, 1) if total_races > 0 else 0,
    "total_races": total_races,
    "hit_races": hit_races
}
with open("summary.json", "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

print("✅ fetch_data.py 完了")