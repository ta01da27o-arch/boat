import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta


def fetch_race_data(stadium_number=1, date=None):
    """
    ボートレース公式サイトから指定会場の全レースデータを取得
    stadium_number: 01=桐生, ... 24=大村
    date: YYYYMMDD (未指定なら今日)
    """
    if date is None:
        date = datetime.now().strftime("%Y%m%d")

    url = f"https://www.boatrace.jp/owpc/pc/race/racelist?jcd={stadium_number:02d}&hd={date}"
    res = requests.get(url)
    res.encoding = res.apparent_encoding
    if res.status_code != 200:
        return []

    races = []
    for race_no in range(1, 13):  # 1〜12R
        race = {
            "race_date": date,
            "race_stadium_number": stadium_number,
            "race_number": race_no,
            "boats": [],
            "ai_prediction": [],
            "result": []
        }

        race_url = f"https://www.boatrace.jp/owpc/pc/race/racelist?rno={race_no}&jcd={stadium_number:02d}&hd={date}"
        res_race = requests.get(race_url)
        res_race.encoding = res_race.apparent_encoding
        if res_race.status_code != 200:
            continue

        soup_race = BeautifulSoup(res_race.text, "html.parser")
        rows = soup_race.select("table.is-lineH2 tbody tr")

        for tr in rows:
            tds = tr.find_all("td")
            if len(tds) < 5:
                continue
            try:
                lane = int(tds[0].text.strip())
                player = tds[2].text.strip()
                win_rate_txt = tds[4].text.strip()
                try:
                    win_rate = float(win_rate_txt)
                except:
                    win_rate = None
                race["boats"].append({
                    "lane": lane,
                    "player": player,
                    "win_rate": win_rate
                })
            except:
                continue

        if race["boats"]:
            races.append(race)

    return races


def save_data(data, out_path="data.json"):
    """
    data.json を必ず配列 [] 形式で保存する
    """
    if not isinstance(data, list):
        data = []
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] {out_path} を保存しました")


def save_summary(data, out_path="summary.json"):
    summary = {
        "races": len(data),
        "stadiums": sorted(list({r["race_stadium_number"] for r in data})) if data else [],
        "date_range": [min(r["race_date"] for r in data), max(r["race_date"] for r in data)] if data else [],
        "columns": list(data[0].keys()) if data else []
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"[INFO] {out_path} を保存しました")


def main():
    today = datetime.now()
    # 過去3ヶ月分のデータを取得
    start_date = today - timedelta(days=90)

    all_data = []
    current = start_date
    while current <= today:
        date_str = current.strftime("%Y%m%d")
        for stadium in range(1, 25):  # 01〜24場
            try:
                races = fetch_race_data(stadium, date_str)
                if races:
                    all_data.extend(races)
                    print(f"[INFO] {date_str} {stadium:02d}場 {len(races)}R 取得")
            except Exception as e:
                print(f"[WARN] {date_str} {stadium:02d}場 失敗: {e}")
        current += timedelta(days=1)

    save_data(all_data, "data.json")
    save_summary(all_data, "summary.json")


if __name__ == "__main__":
    main()