import json
import joblib
import pandas as pd

DATA_FILE = "data.json"
MODEL_FILE = "model.pkl"

def load_data():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def predict():
    model = joblib.load(MODEL_FILE)
    data = load_data()

    for race in data:
        entries = race.get("entries", [])
        features = []
        for e in entries:
            features.append({
                "course": e.get("course", 0),
                "st": float(e.get("st")) if e.get("st") else 0,
                "recent_win_rate": e.get("recent_win_rate", 0.0),
            })
        if not features:
            continue

        X = pd.DataFrame(features).fillna(0)
        probs = model.predict(X)

        # 各選手に1着確率を付与
        for e, p in zip(entries, probs):
            e["predict_win_rate"] = round(float(p), 3)

        # 1着確率順に並べ替え
        sorted_entries = sorted(entries, key=lambda x: x.get("predict_win_rate", 0), reverse=True)

        # 本命5点（上位選手中心）
        honmei = []
        if len(sorted_entries) >= 3:
            top3 = [e["player_id"] for e in sorted_entries[:3]]
            for i in range(len(top3)):
                for j in range(len(top3)):
                    if i == j: continue
                    for k in range(len(top3)):
                        if k in (i, j): continue
                        honmei.append([top3[i], top3[j], top3[k]])
        race["predicted_trifecta_honmei"] = honmei[:5]

        # 穴予想5点（下位選手を含める）
        ana = []
        low_candidates = sorted_entries[-3:]  # 下位3人
        if len(low_candidates) >= 2:
            for top in sorted_entries[:2]:
                for low in low_candidates:
                    for third in sorted_entries:
                        if third["player_id"] not in (top["player_id"], low["player_id"]):
                            ana.append([top["player_id"], low["player_id"], third["player_id"]])
        race["predicted_trifecta_ana"] = ana[:5]

    save_data(data)
    print(f"[INFO] 予測を data.json に追加しました")

if __name__ == "__main__":
    predict()