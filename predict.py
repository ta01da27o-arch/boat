# predict.py
import json
import joblib
import pandas as pd

MODEL_FILE = "model.pkl"
DATA_FILE = "data.json"
OUTPUT_FILE = "data.json"
FEATURES_FILE = "features.csv"

def load_model():
    try:
        return joblib.load(MODEL_FILE)
    except FileNotFoundError:
        print("モデルが見つかりません。先に train.py を実行してください。")
        return None

def load_features():
    try:
        return pd.read_csv(FEATURES_FILE).set_index("racer_number")
    except FileNotFoundError:
        return pd.DataFrame()

def generate_bets(probabilities):
    """
    本命5点 + 穴5点の3連単買い目を生成
    """
    sorted_probs = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
    top = [r for r, _ in sorted_probs[:3]]
    bottom = [r for r, _ in sorted_probs[3:]]

    main_bets = [[top[0], top[1], top[2]],
                 [top[0], top[2], top[1]],
                 [top[1], top[0], top[2]],
                 [top[1], top[2], top[0]],
                 [top[2], top[0], top[1]]]

    dark_bets = []
    for i in range(min(5, len(bottom))):
        dark_bets.append([bottom[i], top[0], top[1]])

    return main_bets, dark_bets

def main():
    model = load_model()
    if model is None:
        return

    features_df = load_features()

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        races = json.load(f)

    for race in races:
        probabilities = {}
        for boat in race.get("boats", []):
            racer_id = boat["racer_number"]
            if racer_id in features_df.index:
                X = features_df.loc[[racer_id], ["total_races", "win_rate", "place2_rate", "place3_rate", "avg_rank", "avg_start"]]
                prob = model.predict(X)[0]
            else:
                prob = 0.1  # データがない場合は低めに設定

            probabilities[racer_id] = float(prob)
            boat["predicted_win_prob"] = round(prob, 3)

        main_bets, dark_bets = generate_bets(probabilities)
        race["predicted"] = {
            "win_probabilities": probabilities,
            "main_bets": main_bets,
            "dark_bets": dark_bets
        }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(races, f, ensure_ascii=False, indent=2)

    print(f"AI予想を {OUTPUT_FILE} に保存しました。")

if __name__ == "__main__":
    main()