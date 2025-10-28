# fetch_data_playwright.py
import json
import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from datetime import datetime

OUTPUT_FILE = "データ/data.json"
BASE_URL = "https://www.boatrace.jp/owpc/pc/race/racelist"

async def fetch_race_data(date_str):
    data = {}
    venues = [f"{i:02}" for i in range(1, 25)]  # 01～24場
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for jcd in venues:
            try:
                url = f"{BASE_URL}?rno=1&jcd={jcd}&hd={date_str}"
                await page.goto(url, timeout=60000)
                await page.wait_for_selector(".table1", timeout=10000)

                html = await page.content()
                soup = BeautifulSoup(html, "html.parser")
                races = []

                race_links = soup.select("ul.race_num li a")
                for a in race_links:
                    href = a.get("href")
                    if href:
                        races.append(f"https://www.boatrace.jp{href}")

                data[jcd] = races
                print(f"✅ {jcd} 取得完了 {len(races)}R")
            except Exception as e:
                print(f"⚠️ {jcd} 失敗: {e}")

        await browser.close()

    return data

async def main():
    today = datetime.now().strftime("%Y%m%d")
    data = await fetch_race_data(today)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("🎉 出走表データを保存しました:", OUTPUT_FILE)

if __name__ == "__main__":
    asyncio.run(main())