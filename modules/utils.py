import json, os
from datetime import datetime, timedelta

DATA_DIR = "data"

def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(filename, data):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_past_dates(days=60):
    today = datetime.today()
    return [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)][::-1]