import json
import os

NEW_FILE = "data.json"
HIST_FILE = "history_data.json"

def merge_data():
    if not os.path.exists(NEW_FILE):
        print(f"[ERROR] {NEW_FILE} がありません")
        return

    with open(NEW_FILE, "r", encoding="utf-8") as f:
        new_data = json.load(f)

    if os.path.exists(HIST_FILE):
        with open(HIST_FILE, "r", encoding="utf-8") as f:
            hist_data = json.load(f)
    else:
        hist_data = []

    existing = {(r["race_date"], r["race_stadium_number"], r["race_number"]) for r in hist_data}
    added = [r for r in new_data if (r["race_date"], r["race_stadium_number"], r["race_number"]) not in existing]

    hist_data.extend(added)
    hist_data.sort(key=lambda x: x["race_date"])
    with open(HIST_FILE, "w", encoding="utf-8") as f:
        json.dump(hist_data, f, ensure_ascii=False, indent=2)

    print(f"[INFO] {len(added)}件追加、合計 {len(hist_data)}件保存")

if __name__ == "__main__":
    merge_data()