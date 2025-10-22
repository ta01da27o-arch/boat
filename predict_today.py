# =======================================
# predict_today.py — 本日分AI予想生成
# =======================================
import os
import json
import pickle
import pandas as pd

DATA_DIR = "data"
DATA_FILE = os.path.join(DATA_DIR, "data.json")
MODEL_FILE = os.path.join(DATA_DIR, "model.pkl")
PREDICT_FILE = os.path.join(DATA_DIR, "predictions.json")

def predict_today():
    if not os.path.exists(MODEL_FILE):
        print("⚠️ model.pkl が存在しません。学習を先に実行してください。")
        return

    if not os.path.exists(DATA_FILE):
        print("⚠️ data.json が存在しません。fetch_data.py を先に実行してください。")
        return

    with open(MODEL_FILE, "rb") as f:
        model = pickle.load(f)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    today = list(data.keys())[0]
    today_data = data[today]

    predictions = {}

    for venue, venue_data in today_data.items():
        venue_results = []
        for race in venue_data["races"]:
            boats = race["boats"]
            df = pd.DataFrame([{
                "boat_number": b.get("boat_number"),
                "start_timing": b.get("start_timing") or 0.2,
                "racer_class": 1 if b.get("racer_class") == "A1" else 0
            } for b in boats])

            probs = model.predict_proba(df)[:, 1]
            for b, p in zip(boats, probs):
                b["ai_prediction"] = round(float(p), 3)

            # 上位3艇を選出
            top3 = sorted(boats, key=lambda x: x["ai_prediction"], reverse=True)[:3]
            venue_results.append({
                "race_no": race["race_no"],
                "predictions": top3
            })

        predictions[venue] = {"races": venue_results}

    with open(PREDICT_FILE, "w", encoding="utf-8") as f:
        json.dump(predictions, f, ensure_ascii=False, indent=2)

    print(f"✅ AI予想生成完了: {PREDICT_FILE}")

if __name__ == "__main__":
    predict_today()