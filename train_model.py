import os, json, pickle
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

DATA_DIR = "data"
HISTORY_FILE = os.path.join(DATA_DIR, "history.json")
MODEL_FILE = os.path.join(DATA_DIR, "model.pkl")

def load_history_as_dataframe():
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        history = json.load(f)

    rows = []
    for date, venues in history.items():
        if isinstance(venues, dict):
            for venue, data in venues.items():
                races = data.get("races", {})
                for race_no, race in races.items():
                    for entry in race.get("entries", []):
                        rows.append({
                            "date": date,
                            "venue": venue,
                            "race_no": race_no,
                            "name": entry.get("name"),
                            "class": entry.get("class"),
                            "tenji": len(entry.get("tenji", "")),
                            "f": len(entry.get("f", "")),
                            "l": len(entry.get("l", "")),
                            "target": len(entry.get("name", "")) % 2  # 仮ラベル
                        })
    return pd.DataFrame(rows)

def train_and_save_model():
    df = load_history_as_dataframe()
    if df.empty:
        print("⚠️ 学習データなし")
        return

    X = df[["tenji", "f", "l"]]
    y = df["target"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model, f)
    print("✅ モデル学習・保存完了:", MODEL_FILE)

if __name__ == "__main__":
    train_and_save_model()