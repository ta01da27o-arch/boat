import asyncio
import json
import os
import random
from datetime import datetime
from playwright.async_api import async_playwright

# ===== 保存ディレクトリ =====
OUTPUT_DIR = "data"
OUTPUT_FILE = f"{OUTPUT_DIR}/data.json"
AI_STATS_FILE = f"{OUTPUT_DIR}/ai_stats.json"

# ===== ボートレース場一覧 =====
VENUES = [
    ("桐生", "01"), ("戸田", "02"), ("江戸川", "03"), ("平和島", "04"), ("多摩川", "05"),
    ("浜名湖", "06"), ("蒲郡", "07"), ("常滑", "08"), ("津", "09"), ("三国", "10"),
    ("びわこ", "11"), ("住之江", "12"), ("尼崎", "13"), ("鳴門", "14"), ("丸亀", "15"),
    ("児島", "16"), ("宮島", "17"), ("徳山", "18"), ("下関", "19"), ("若松", "20"),
    ("芦屋", "21"), ("福岡", "22"), ("唐津", "23"), ("大村", "24")
]

# ==== AI的中率データ管理 ======================================
def load_ai_stats():
    """AI的中率データを読み込む"""
    if os.path.exists(AI_STATS_FILE):
        with open(AI_STATS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_ai_stats(stats):
    """AI的中率データを保存"""
    with open(AI_STATS_FILE, "w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

def update_ai_accuracy(stats, venue_name):
    """簡易AI：ランダム変動で的中率更新"""
    if venue_name not in stats:
        stats[venue_name] = random.randint(20, 40)
    else:
        base = stats[venue_name]
        drift = random.randint(-3, 3)
        stats[venue_name] = max(10, min(95, base + drift))
    return stats[venue_name]
# ===============================================================


async def fetch_race_data(playwright):
    """各場のデータをスクレイピングして保存"""
    browser = await playwright.chromium.launch(headless=True)
    page = await browser.new_page()
    all_data = []
    today = datetime.now().strftime("%Y%m%d")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ai_stats = load_ai_stats()

    for name, code in VENUES:
        print(f"▶ {name} ({code}) データ取得中...")
        try:
            url = f"https://www.boatrace.jp/owpc/pc/race/index?jcd={code}&hd={today}"
            await page.goto(url, timeout=30000)

            try:
                await page.wait_for_selector(".table1, .table1-responsive, .table1.table1-header", timeout=15000)
            except:
                print(f"⚠️ {name}: 出走表が見つかりません。スキップ。")
                continue

            rows = await page.query_selector_all(".table1 tbody tr")
            race_info = []
            for row in rows:
                tds = await row.query_selector_all("td")
                if len(tds) >= 3:
                    racer = await tds[1].inner_text()
                    mark = await tds[2].inner_text()
                    race_info.append({
                        "racer": racer.strip(),
                        "mark": mark.strip()
                    })

            # 的中率を更新
            hit_rate = update_ai_accuracy(ai_stats, name)

            all_data.append({
                "venue": name,
                "code": code,
                "date": today,
                "hit_rate": hit_rate,
                "races": race_info
            })

            print(f"✅ {name} 取得完了 ({len(race_info)}件) 的中率 {hit_rate}%")

        except Exception as e:
            print(f"⚠️ {name} 失敗: {e}")

    await browser.close()
    save_ai_stats(ai_stats)
    return all_data


async def main():
    async with async_playwright() as p:
        data = await fetch_race_data(p)
        try:
            with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"\n✅ 全データ保存完了: {OUTPUT_FILE}")
        except Exception as e:
            print(f"❌ JSON保存エラー: {e}")


if __name__ == "__main__":
    asyncio.run(main())