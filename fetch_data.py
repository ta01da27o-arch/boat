import requests
import json
import datetime
import time

# 会場コードと名前
VENUES = {
    "01": "桐生", "02": "戸田", "03": "江戸川", "04": "平和島", "05": "多摩川",
    "06": "浜名湖", "07": "蒲郡", "08": "常滑", "09": "津", "10": "三国",
    "11": "びわこ", "12": "住之江", "13": "尼崎", "14": "鳴門", "15": "丸亀",
    "16": "児島", "17": "宮島", "18": "徳山", "19": "下関", "20": "若松",
    "21": "芦屋", "22": "福岡", "23": "唐津", "24": "大村"
}

# 今日の日付（YYYYMMDD）
today = datetime.date.today().strftime("%Y%m%d")

programs = []

for jcd, venue in VENUES.items():
    url = f"https://www.boatrace.jp/owpc/pc/race/cardjson?jcd={jcd}&hd={today}"
    try:
        res = requests.get(url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        })
        if res.status_code != 200:
            print(f"⚠ {venue} ({jcd}) データ取得失敗: {res.status_code}")
            programs.append({"venue": venue, "races": []})
            continue

        data_json = res.json()

        races = []
        # レースごとのデータを抽出
        for race in data_json.get("cardDataList", []):
            rno = race.get("raceNo")
            title = race.get("title", f"{rno}R")

            boats = []
            for entry in race.get("sensyuList", []):
                boats.append({
                    "lane": entry.get("teiban"),
                    "name": entry.get("name"),
                    "branch": entry.get("kyu"),
                    "age": entry.get("nenrei"),
                    "weight": entry.get("taiju"),
                    "nation": entry.get("ken"),
                    "motor": entry.get("motorNo"),
                    "boat": entry.get("boatNo")
                })

            races.append({
                "number": rno,
                "title": title,
                "boats": boats
            })

        programs.append({
            "venue": venue,
            "races": races
        })

        time.sleep(0.3)  # アクセス間隔を空ける

    except Exception as e:
        print(f"❌ {venue} 取得エラー: {e}")
        programs.append({"venue": venue, "races": []})

# 出力する全体データ
output = {
    "date": today,
    "programs": programs,
    "stats": {},
    "history": []
}

# data.json に保存
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("✅ data.json を更新しました")