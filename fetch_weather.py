import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.boatrace.jp/owpc/pc/race/index"

def fetch_weather(jcd, date):
    """
    jcd: 場コード（01:桐生, 02:戸田, ...）
    date: "YYYYMMDD"
    """
    url = f"{BASE_URL}?jcd={jcd}&hd={date}"
    print(f"[INFO] 気象データ取得: {url}")

    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    weather_data = {}
    try:
        weather = soup.select_one(".weather1_bodyUnitLabel").get_text(strip=True)
        wind = soup.select_one(".weather1_bodyUnitData").get_text(strip=True)
        wave = soup.select(".weather1_bodyUnitData")[1].get_text(strip=True)

        weather_data = {
            "weather": weather,
            "wind": wind,
            "wave": wave,
        }
    except Exception as e:
        print(f"[WARN] 気象情報の取得に失敗: {e}")
        weather_data = {}

    return weather_data