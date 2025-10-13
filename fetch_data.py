import requests
from bs4 import BeautifulSoup
import json
import datetime
import pytz
import re
import os
import sys

# === 日本時間設定 ===
JST = pytz.timezone("Asia/Tokyo")
today = datetime.datetime.now(JST).date()

# --- 実行オプション ---
force_program = "--force-program" in sys.argv
force_result = "--force-result" in sys.argv

DATA_FILE = "data.json"

# --- データ読み込み ---
if os.path.exists(DATA_FILE):
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        print("⚠ data.json の読み込みに失敗。新規作成します。")
        data = {}
else:
    data = {}

# === 出走表取得 ===
def fetch_race_program(date):
    base_url = f"https://www.boatrace.jp/owpc/pc/race/raceindex?hd={date.strftime('%Y%m%d')}"
    print(f"🔍 出走表取得: {base_url}")
    res = requests.get(base_url)
    res.encoding = res.apparent_encoding
    soup = BeautifulSoup(res.text, "lxml")

    program = {}

    # 各場リンクを取得
    venues = soup.select("ul.tab01_01 li a")
    for v in venues:
        venue_name = v.text.strip()
        href = v.get("href")
        if not href:
            continue
        venue_url = "https://www.boatrace.jp" + href
        print(f"➡ {venue_name}: {venue_url}")

        try:
            v_res = requests.get(venue_url)
            v_res.encoding = v_res.apparent_encoding
            v_soup = BeautifulSoup(v_res.text, "lxml")

            races = {}
            for race_link in v_soup.select(".race_card_btn"):
                race_no = race_link.text.strip().replace("R", "")
                race_href = race_link.get("href")
                if not race_href:
                    continue
                race_url = "https://www.boatrace.jp" + race_href

                race_data = fetch_race_detail(race_url)
                races[race_no] = race_data

            program[venue_name] = races
        except Exception as e:
            print(f"⚠ {venue_name} 取得エラー: {e}")

    return program


# === 各レース詳細 ===
def fetch_race_detail(url):
    res = requests.get(url)
    res.encoding = res.apparent_encoding
    soup = BeautifulSoup(res.text, "lxml")

    race_data = {
        "title": soup.select_one(".heading1_title").text.strip() if soup.select_one(".heading1_title") else "",
        "entries": []
    }

    for row in soup.select(".table1 tbody tr"):
        cols = row.select("td")
        if len(cols) < 8:
            continue

        try:
            grade = cols[1].text.strip()
            name = cols[2].text.strip()
            st = cols[6].text.strip()

            # F表示変換
            f_flag = "ー"
            if "F2" in st:
                f_flag = "F2"
            elif "F1" in st:
                f_flag = "F1"

            # 勝率データを抽出
            raw_wr = re.findall(r"\d+\.\d", cols[7].text)
            if len(raw_wr) >= 3:
                national = round(float(raw_wr[0]) * 10, 1)  # 全国勝率→%
                local = round(float(raw_wr[1]) * 10, 1)     # 当地勝率→%
                motor = round(float(raw_wr[2]) * 10, 1)     # モーター勝率→%
            else:
                national = local = motor = 0.0

            # AI評価 (簡易ロジック)
            if national >= 70:
                ai_eval = "◎"
            elif national >= 60:
                ai_eval = "○"
            else:
                ai_eval = "▲"

            race_data["entries"].append({
                "grade": grade,
                "name": name,
                "st": st,
                "f": f_flag,
                "national_rate": f"{national}%",
                "local_rate": f"{local}%",
                "motor_rate": f"{motor}%",
                "ai_eval": ai_eval
            })
        except Exception as e:
            print(f"⚠ 選手データ抽出失敗: {e}")

    return race_data


# === 結果データ取得 ===
def fetch_results(date):
    result_url = f"https://www.boatrace.jp/owpc/pc/race/raceresultall?hd={date.strftime('%Y%m%d')}"
    print(f"🏁 結果取得: {result_url}")
    res = requests.get(result_url)
    res.encoding = res.apparent_encoding
    soup = BeautifulSoup(res.text, "lxml")

    results = {}
    for link in soup.select(".table1 a"):
        href = link.get("href")
        if not href:
            continue
        venue = link.text.strip()
        full_url = "https://www.boatrace.jp" + href
        results[venue] = full_url
    return results


# === 実行 ===
if force_program or not data.get(str(today)):
    print("📦 出走表を更新中...")
    program_data = fetch_race_program(today)
    data[str(today)] = {"program": program_data}
else:
    print("✅ 出走表は最新です。")

if force_result:
    print("📦 結果を更新中...")
    result_data = fetch_results(today)
    data[str(today)]["results"] = result_data
else:
    print("✅ 結果は最新です。")

# === 保存 ===
with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"✅ data.json 更新完了 ({today})")