import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
import warnings
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

# XML警告を非表示にする
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

# 全国24場のコードマップ（例として）
STADIUM_MAP = {
    "01": "桐生", "02": "戸田", "03": "江戸川", "04": "平和島",
    "05": "多摩川", "06": "浜名湖", "07": "蒲郡", "08": "常滑",
    "09": "津", "10": "三国", "11": "びわこ", "12": "住之江",
    "13": "尼崎", "14": "鳴門", "15": "丸亀", "16": "児島",
    "17": "宮島", "18": "徳山", "19": "下関", "20": "若松",
    "21": "芦屋", "22": "福岡", "23": "唐津", "24": "大村"
}

DATA_FILE = Path("data.json")

# 日本時間 (JST) 設定
JST = timezone(timedelta(hours=9))
today_date = datetime.now(JST).date()
today_str = today_date.strftime("%Y%m%d")

def save_json(path: Path, obj):
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    print(f"✅ 保存: {path}")

def fetch_race_list_for_stadium(stadium_code: str, date_str: str):
    """
    指定された競艇場(stadium_code：2桁文字列)について、
    その日の開催レース一覧をスクレイピングして取得する。
    """
    url = f"https://www.boatrace.jp/owpc/pc/race/racelist?rno=1&jcd={stadium_code}&hd={date_str}"
    try:
        res = requests.get(url, timeout=10)
        res.encoding = "utf-8"
        if res.status_code != 200:
            print(f"⚠️ {stadium_code}場取得失敗 HTTP {res.status_code}")
            return None
        soup = BeautifulSoup(res.text, "lxml")

        # 会場名（例：桐生、戸田など）
        title_elem = soup.select_one(".main_title span")
        stadium_name = title_elem.text.strip() if title_elem else STADIUM_MAP.get(stadium_code, "")

        # 各レーステーブル群を取得
        table_nodes = soup.select(".table1")  # 出走表テーブルがこの CSS クラスである前提
        races = []
        race_number = 1
        for tbl in table_nodes:
            # 各行 <tr> に選手データ
            rows = tbl.select("tbody tr")
            boats = []
            for row in rows:
                cols = [c.get_text(strip=True) for c in row.find_all("td")]
                # 列数チェック（選手名, 支部, 級, F, ST など最低限入っていそうな数）
                if len(cols) < 4:
                    continue
                # 仮構成
                boats.append({
                    "racer_name": cols[1] if len(cols) > 1 else "",
                    "racer_branch": cols[2] if len(cols) > 2 else "",
                    "racer_class": cols[3] if len(cols) > 3 else "",
                    # FやST は cols[4], cols[5] など位置に応じて追加可能
                })
            if boats:
                races.append({
                    "race_date": date_str,
                    "race_stadium_number": int(stadium_code),
                    "race_stadium_name": stadium_name,
                    "race_number": race_number,
                    "boats": boats
                })
                race_number += 1

        if races:
            print(f"✅ {stadium_code}場 ({stadium_name})：{len(races)}レース取得")
            return races
        else:
            print(f"⚠️ {stadium_code}場 ({stadium_name}) は開催なしまたは取得失敗")
            return None

    except Exception as e:
        print(f"⚠️ {stadium_code}場 スクレイピング例外: {e}")
        return None

def main():
    print(f"📅 本日のデータ取得を開始: {today_str}")
    all_race_data = []

    for stadium_code in STADIUM_MAP.keys():
        st_data = fetch_race_list_for_stadium(stadium_code, today_str)
        if st_data:
            all_race_data.extend(st_data)

    if not all_race_data:
        print("❌ 本日のレースデータを１件も取得できませんでした。")
        return

    # 保存
    save_json(DATA_FILE, all_race_data)
    print(f"🎯 本日のレースデータ取得完了：{len(all_race_data)}件")

if __name__ == "__main__":
    main()