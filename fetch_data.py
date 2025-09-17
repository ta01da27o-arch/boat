import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
import os

def fetch_race_data(stadium_number=01, date=None):
    """
    ボートレース公式サイトから1日のレースデータを取得
    stadium_number: 開催場番号 (01=桐生, 02=戸田, ... 24=大村)
    date: YYYYMMDD 形式 (指定しなければ今日の日付)
    """
    if date is None:
        date = datetime.now().strftime("%Y%m%d")

    url = f"https://www.boatrace.jp/owpc/pc/race/racelist?jcd={stadium_number:02d}&hd={date}"
    res = requests.get(url)
    res.encoding = res.apparent_encoding
    if res.status_code != 200:
        raise RuntimeError(f"Failed to fetch {url}")

    soup = BeautifulSoup(res.text, "html.parser")
    races = []

    # レース一覧（最大12R）
    for race_no in range(1, 13):
        race = {
            "race_date": date,
            "race_stadium_number": stadium_number,
            "race_number": race_no,
            "boats": [],
            "ai_prediction": [],
            "result": []
        }

        # 出走表ページ
        race_url = f"https://www.boatrace.jp/owpc/pc/race/racelist?rno={race_no}&jcd={stadium_number:02d}&hd={date}"
        res_race = requests.get(race_url)
        res_race.encoding = res_race.apparent_encoding
        if res_race.status_code != 200:
            continue

        soup_race = BeautifulSoup(res_race.text, "html.parser")

        # 出走表テーブル（6艇分）
        table = soup_race.select("table.is-lineH2 tbody tr")
        for tr in table:
            tds = tr.find_all("td")
            if len(tds) < 5:
                continue
            try:
                lane = int(tds[0].text.strip())
                name = tds[2].text.strip()
                win_rate = tds[4].text.strip()
                try:
                    win_rate = float(win_rate)
                except:
                    win_rate = None

                race["boats"].append({
                    "lane": lane,
                    "player": name,
                    "win_rate": win_rate
                })
            except Exception:
                continue

        races.append(race)

    return races


def save_data(data, out_path="data.json"):
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] data.json を保存しました → {out_path}")


def save_summary(data, out_path="summary.json"):
    summary = {
        "races": len(data),
        "stadiums": list({r["race_stadium_number"] for r in data}),
        "columns": list(data[0].keys()) if data else []
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"[INFO] summary.json を保存しました → {out_path}")


def main():
    today = datetime.now().strftime("%Y%m%d")
    all_data = []

    # 全24会場を取得（開催されていない場合はスキップされる）
    for stadium in range(1, 25):
        try:
            data = fetch_race_data(stadium, today)
            if data:
                all_data.extend(data)
                print(f"[INFO] {stadium:02d}場 {len(data)}レース取得")
        except Exception as e:
            print(f"[WARN] {stadium:02d}場 取得失敗: {e}")

    save_data(all_data, "data.json")
    save_summary(all_data, "summary.json")


if __name__ == "__main__":
    main()