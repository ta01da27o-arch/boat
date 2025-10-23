import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta
import time
import os

# ===== 設定 =====
BASE_URL = "https://www.boatrace.jp"
OUTPUT_DATA = "data.json"
OUTPUT_HISTORY = "history.json"

# すべての競艇場リスト（24場）
VENUES = [
    "桐生","戸田","江戸川","平和島","多摩川","浜名湖",
    "蒲郡","常滑","津","三国","びわこ","住之江",
    "尼崎","鳴門","丸亀","児島","宮島","徳山",
    "下関","若松","芦屋","唐津","大村"
]

# ===== 日付 =====
TODAY = datetime.now().strftime("%Y%m%d")
YESTERDAY = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")


# ===== ファイル読み込み =====
def load_json(filename):
    if os.path.exists(filename):
        with open(filename, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}
    return {}

# ===== ファイル保存 =====
def save_json(filename, data):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ===== 出走表スクレイピング =====
def fetch_entry_table(venue):
    print(f"🏁 出走表取得中: {venue}")
    url = f"{BASE_URL}/owpc/pc/race/racelist?rno=1&jcd={get_jcd(venue)}&hd={TODAY}"
    res = requests.get(url)
    if res.status_code != 200:
        print(f"❌ {venue} 出走表なし")
        return None

    soup = BeautifulSoup(res.text, "html.parser")
    table = soup.select_one(".table1")
    if not table:
        print(f"⚠️ {venue} 出走データなし")
        return None

    race_info = {}
    rows = table.select("tbody tr")
    for r in range(0, len(rows), 2):
        try:
            rank_row = rows[r]
            data_row = rows[r + 1]
            cols = rank_row.select("td")
            name_col = data_row.select("td")

            number = cols[0].text.strip()
            player_class = cols[1].text.strip()
            player_name = name_col[1].text.strip()
            st = name_col[5].text.strip()

            race_info[number] = {
                "階級": player_class,
                "選手名": player_name,
                "平均ST": st,
                "F": name_col[2].text.strip() or "ー",
                "全国": name_col[3].text.strip(),
                "当地": name_col[4].text.strip(),
                "モーター": name_col[6].text.strip(),
                "コース": name_col[7].text.strip(),
                "評価": "◎" if float(name_col[3].text.strip() or 0) > 6.0 else "○"
            }
        except Exception as e:
            print(f"⚠️ {venue} 出走表パースエラー: {e}")
            continue
    return race_info


# ===== 結果スクレイピング =====
def fetch_result_data(venue):
    print(f"📊 結果取得中: {venue}")
    url = f"{BASE_URL}/owpc/pc/race/raceresult?rno=12&jcd={get_jcd(venue)}&hd={YESTERDAY}"
    res = requests.get(url)
    if res.status_code != 200:
        print(f"❌ {venue} 結果なし")
        return None

    soup = BeautifulSoup(res.text, "html.parser")
    table = soup.select_one(".table1")
    if not table:
        print(f"⚠️ {venue} 結果データなし")
        return None

    result_data = {}
    try:
        rows = table.select("tbody tr")
        for row in rows:
            cols = row.select("td")
            if len(cols) >= 5:
                lane = cols[0].text.strip()
                name = cols[1].text.strip()
                rank = cols[2].text.strip()
                decision = cols[4].text.strip()
                result_data[lane] = {"順位": rank, "決まり手": decision}
    except Exception as e:
        print(f"⚠️ {venue} 結果パースエラー: {e}")

    return result_data


# ===== 場コード変換 =====
def get_jcd(venue_name):
    JCD_MAP = {
        "桐生": "01", "戸田": "02", "江戸川": "03", "平和島": "04",
        "多摩川": "05", "浜名湖": "06", "蒲郡": "07", "常滑": "08",
        "津": "09", "三国": "10", "びわこ": "11", "住之江": "12",
        "尼崎": "13", "鳴門": "14", "丸亀": "15", "児島": "16",
        "宮島": "17", "徳山": "18", "下関": "19", "若松": "20",
        "芦屋": "21", "唐津": "22", "大村": "23"
    }
    return JCD_MAP.get(venue_name, "00")


# ===== メイン処理 =====
def main():
    data = load_json(OUTPUT_DATA)
    history = load_json(OUTPUT_HISTORY)

    now_hour = datetime.now().hour
    mode = "entry" if now_hour < 14 else "result"

    print(f"=== 実行モード: {mode} ===")

    for venue in VENUES:
        if mode == "entry":
            entry = fetch_entry_table(venue)
            if entry:
                data[venue] = {"date": TODAY, "races": entry}
        else:
            result = fetch_result_data(venue)
            if result:
                if venue not in history:
                    history[venue] = {}
                history[venue][YESTERDAY] = result

        time.sleep(1.5)  # アクセス間隔

    save_json(OUTPUT_DATA, data)
    save_json(OUTPUT_HISTORY, history)
    print("✅ データ更新完了！")


if __name__ == "__main__":
    main()