import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta

# 保存ファイル
OUTPUT_FILE = "data.json"

# 全国24会場（公式サイトの場コード）
VENUE_CODES = {
    "桐生": "01", "戸田": "02", "江戸川": "03", "平和島": "04", "多摩川": "05",
    "浜名湖": "06", "蒲郡": "07", "常滑": "08", "津": "09", "三国": "10",
    "琵琶湖": "11", "住之江": "12", "尼崎": "13", "鳴門": "14", "丸亀": "15",
    "児島": "16", "宮島": "17", "徳山": "18", "下関": "19", "若松": "20",
    "芦屋": "21", "福岡": "22", "唐津": "23", "大村": "24"
}

def get_today():
    """本日の日付（YYYYMMDD形式）"""
    return datetime.now().strftime("%Y%m%d")

def fetch_race_html(jcd, rno, date):
    """レース一覧ページを取得"""
    url = f"https://www.boatrace.jp/owpc/pc/race/racelist?rno={rno}&jcd={jcd}&hd={date}"
    res = requests.get(url)
    res.encoding = "utf-8"
    return res.text

def parse_race_table(html):
    """出走表データを解析してリスト化"""
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", class_="is-w495")
    if not table:
        return []

    rows = table.find_all("tr")[1:]  # 見出し行を除外
    data = []

    for row in rows:
        cols = row.find_all("td")
        if len(cols) < 5:
            continue
        racer = {
            "枠": cols[0].get_text(strip=True),
            "選手名": cols[1].get_text(strip=True),
            "支部/出身地": cols[2].get_text(strip=True),
            "年齢/体重": cols[3].get_text(strip=True),
            "級別": cols[1].find("span").get_text(strip=True) if cols[1].find("span") else "",
            "全国勝率": cols[4].get_text(strip=True) if len(cols) > 4 else ""
        }
        data.append(racer)
    return data

def main():
    all_data = {"本日": {}, "前日": {}}
    today = get_today()
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")

    for label, target_date in [("本日", today), ("前日", yesterday)]:
        for venue, code in VENUE_CODES.items():
            all_data[label][venue] = {}
            for rno in range(1, 13):  # 1R〜12R
                try:
                    html = fetch_race_html(code, rno, target_date)
                    race_data = parse_race_table(html)
                    all_data[label][venue][f"{rno}R"] = race_data
                except Exception as e:
                    print(f"Error: {venue} {rno}R {e}")
                    all_data[label][venue][f"{rno}R"] = []

    # JSON保存
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"✅ {OUTPUT_FILE} を更新しました")

if __name__ == "__main__":
    main()