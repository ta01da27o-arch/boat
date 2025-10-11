import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
import warnings
import json
from datetime import datetime

# 警告を非表示
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

# 全国24場（01〜24）
STADIUMS = {
    "01": "桐生",
    "02": "戸田",
    "03": "江戸川",
    "04": "平和島",
    "05": "多摩川",
    "06": "浜名湖",
    "07": "蒲郡",
    "08": "常滑",
    "09": "津",
    "10": "三国",
    "11": "びわこ",
    "12": "住之江",
    "13": "尼崎",
    "14": "鳴門",
    "15": "丸亀",
    "16": "児島",
    "17": "宮島",
    "18": "徳山",
    "19": "下関",
    "20": "若松",
    "21": "芦屋",
    "22": "福岡",
    "23": "唐津",
    "24": "大村"
}

def fetch_race_data(jcd, name):
    """指定されたレース場の本日出走表を取得"""
    today = datetime.now().strftime("%Y%m%d")
    url = f"https://www.boatrace.jp/owpc/pc/race/racelist?rno=1&jcd={jcd}&hd={today}"

    try:
        res = requests.get(url, timeout=10)
        res.raise_for_status()
    except requests.RequestException:
        print(f"⚠️ {name}（{jcd}）取得失敗: 接続エラー")
        return None

    soup = BeautifulSoup(res.text, "lxml")

    # 出走データ抽出
    rows = soup.select(".is-fs12")
    boats = []
    for row in rows:
        name_elem = row.select_one(".is-fs18")
        num_elem = row.select_one(".is-fs11")
        if name_elem:
            boats.append({
                "racer_name": name_elem.text.strip(),
                "racer_number": num_elem.text.strip() if num_elem else ""
            })

    if not boats:
        print(f"⚠️ {name}（{jcd}）: 出走表なし")
        return None

    race_info = {
        "race_date": datetime.now().strftime("%Y-%m-%d"),
        "race_stadium_name": name,
        "race_stadium_number": int(jcd),
        "race_number": 1,
        "boats": boats
    }

    print(f"✅ {name}（{jcd}）: {len(boats)}件の出走データ取得")
    return race_info


def main():
    all_data = []
    for jcd, name in STADIUMS.items():
        data = fetch_race_data(jcd, name)
        if data:
            all_data.append(data)

    if not all_data:
        print("❌ 1場も取得できませんでした。")
        return

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\n🏁 完了：{len(all_data)}場のデータを data.json に保存しました。")


if __name__ == "__main__":
    print("🚀 全国24場の本日出走表を取得開始")
    main()