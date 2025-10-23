# fetch_data.py
# 2025/10/23 統合版（出走表＋結果自動更新）

import requests
from bs4 import BeautifulSoup
import json, os, datetime, time
import pytz

DATA_PATH = "data/data.json"
HISTORY_PATH = "data/history.json"
VENUES = [
    "桐生","戸田","江戸川","平和島","多摩川",
    "浜名湖","蒲郡","常滑","津","三国",
    "びわこ","住之江","尼崎","鳴門","丸亀",
    "児島","宮島","徳山","下関","若松",
    "芦屋","福岡","唐津","大村"
]

# ===== Utility =====
def load_json(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def jst_now():
    tz = pytz.timezone("Asia/Tokyo")
    return datetime.datetime.now(tz)

# ===== 出走表スクレイピング =====
def fetch_race_table(venue_id, venue_name, ymd):
    base_url = f"https://www.boatrace.jp/owpc/pc/race/racelist"
    params = {"jcd": f"{venue_id:02}", "hd": ymd}
    try:
        resp = requests.get(base_url, params=params, timeout=10)
        soup = BeautifulSoup(resp.text, "lxml")

        # 開催チェック
        h2 = soup.find("h2", class_="heading2_title")
        if not h2 or "開催なし" in h2.text:
            return {"status": "ー", "races": []}

        races = []
        race_links = soup.select(".table1 .is-pc a")
        race_nos = sorted(set([int(a["href"].split("rno=")[1].split("&")[0]) for a in race_links]))

        for rno in race_nos:
            url = f"https://www.boatrace.jp/owpc/pc/race/racedata?rno={rno}&jcd={venue_id:02}&hd={ymd}"
            r = requests.get(url, timeout=10)
            s = BeautifulSoup(r.text, "lxml")

            entries = []
            rows = s.select("table.is-tableFixed__3rdadd tr")
            for tr in rows[1:]:
                tds = tr.find_all("td")
                if len(tds) < 10:
                    continue
                waku = tds[0].get_text(strip=True)
                name = tds[2].get_text(strip=True)
                klass = tds[1].get_text(strip=True)
                st = tds[6].get_text(strip=True)
                f_info = "ー"
                if "F2" in tds[5].get_text(): f_info = "F2"
                elif "F1" in tds[5].get_text(): f_info = "F1"
                national = tds[7].get_text(strip=True)
                local = tds[8].get_text(strip=True)
                motor = tds[9].get_text(strip=True)
                course = tds[10].get_text(strip=True)
                entries.append({
                    "waku": int(waku),
                    "klass": klass,
                    "name": name,
                    "st": st,
                    "f": f_info,
                    "national": national,
                    "local": local,
                    "motor": motor,
                    "course": course,
                    "eval": "ー"
                })
            races.append({
                "no": rno,
                "entries": entries,
                "ai_main": [],
                "ai_ana": [],
                "comment": "",
                "prediction": []
            })

        return {"status": "開催中", "date": ymd, "races": races}

    except Exception as e:
        print(f"⚠️ {venue_name} 取得失敗: {e}")
        return {"status": "ー", "races": []}

# ===== 結果スクレイピング =====
def fetch_results(venue_id, venue_name, ymd):
    base = "https://www.boatrace.jp/owpc/pc/race/raceresult"
    try:
        hist_data = {}
        for rno in range(1, 13):
            url = f"{base}?rno={rno}&jcd={venue_id:02}&hd={ymd}"
            resp = requests.get(url, timeout=10)
            soup = BeautifulSoup(resp.text, "lxml")
            if not soup.select_one(".table1_boatImage1"):
                continue

            result = [td.get_text(strip=True) for td in soup.select(".is-winner1 td")]
            style = soup.select_one(".is-table__2ndadd tr:nth-of-type(2) td")
            hist_data[str(rno)] = {
                "result": result[:3],
                "style": style.get_text(strip=True) if style else "-"
            }
        return hist_data
    except Exception as e:
        print(f"⚠️ {venue_name} 結果取得失敗: {e}")
        return {}

# ===== メイン処理 =====
def main():
    today = jst_now().strftime("%Y%m%d")
    hour = jst_now().hour
    print(f"📅 {today} | JST {hour}:00 実行")

    data = load_json(DATA_PATH)
    history = load_json(HISTORY_PATH)

    for i, v in enumerate(VENUES, start=1):
        print(f"⛵ {v} ...")
        if hour < 12:  # 朝8時 → 出走表
            data[v] = fetch_race_table(i, v, today)
        else:          # 夜23時 → 結果
            hist = fetch_results(i, v, today)
            if v not in history:
                history[v] = {}
            history[v].update(hist)
            if v in data:
                data[v]["status"] = "終了"

    save_json(DATA_PATH, data)
    save_json(HISTORY_PATH, history)
    print("✅ 更新完了：data.json / history.json")

if __name__ == "__main__":
    main()