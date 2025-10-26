import os
from datetime import datetime
from modules.utils import load_json, save_json, get_past_dates
from modules.scraper import get_race_data
from modules.trainer import train_ai_model

print("🚀 自動更新スクリプト開始")

os.makedirs("data", exist_ok=True)
today = datetime.today().strftime("%Y-%m-%d")

# Step1: 本日データ取得
print(f"📡 本日データ取得: {today}")
today_data = get_race_data(today)
save_json("data.json", today_data)

# Step2: history更新
history = load_json("history.json")
history[today] = today_data

# 古い日付削除（60日超）
dates = sorted(history.keys())
if len(dates) > 60:
    old = dates[0]
    print(f"🧹 古いデータ削除: {old}")
    del history[old]

save_json("history.json", history)

# Step3: AI学習
print("🧠 AI学習開始")
ai_model = train_ai_model(history)
save_json("ai_model.json", ai_model)

print(f"✅ 完了: {today}")
print("├ data.json: 当日データ")
print("├ history.json: 過去60日")
print("└ ai_model.json: AI学習結果")