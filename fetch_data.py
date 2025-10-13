#!/usr/bin/env python3
# coding: utf-8

import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
import json
import time
from datetime import datetime, timedelta
import pytz
import warnings
import sys
import os
from urllib.parse import urljoin, urlparse, parse_qs

# ------------------------
# 設定・定数
# ------------------------
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

BASE = "https://www.boatrace.jp"
DATA_FILE = "data.json"
MAX_RETRY = 3
RETRY_DELAY = 3600  # 秒（1時間）

JST = pytz.timezone("Asia/Tokyo")

force_program = "--force-program" in sys.argv
force_result = "--force-result" in sys.argv
# Optional: 指定日取得オプション
forced_date = None
for arg in sys.argv:
    if arg.startswith("--date="):
        forced_date = arg.split("=", 1)[1]

# ------------------------
# ユーティリティ関数
# ------------------------
def now_jst_date():
    return datetime.now(pytz.utc).astimezone(JST).date()

def date_to_ymd(d):
    return d.strftime("%Y%m%d")

def safe_get_text(el):
    return el.get_text(strip=True) if el else ""

def load_json():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                j = json.load(f)
            if isinstance(j, list):
                merged = {}
                for item in j:
                    if isinstance(item, dict):
                        merged.update(item)
                return merged
            if isinstance(j, dict):
                return j
        except Exception as e:
            print(f"[WARN] load_json failed: {e}")
    return {}

def save_json(d):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    print("[INFO] Saved to", DATA_FILE)

def http_get(url):
    headers = {"User-Agent": "boat-fetcher/1.0"}
    r = requests.get(url, headers=headers, timeout=15)
    r.raise_for_status()
    if r.encoding is None:
        r.encoding = r.apparent_encoding
    return r

def fetch_and_check(url, target_ymd):
    try:
        resp = http_get(url)
    except Exception as e:
        print(f"[ERROR] HTTP get failed: {url} -> {e}")
        return None, None

    soup = BeautifulSoup(resp.text, "lxml")

    txt = soup.get_text(" ", strip=True)
    import re
    m = re.search(r"(\d{4})[/-](\d{2})[/-](\d{2})", txt)
    if m:
        ym = f"{m.group(1)}{m.group(2)}{m.group(3)}"
        return ym, soup

    m2 = re.search(r'"race_date"\s*:\s*"(\d{8})"', resp.text)
    if m2:
        return m2.group(1), soup

    return None, soup

# ------------------------
# 出走表取得ロジック
# ------------------------
def fetch_program_for_date(dt):
    target_ymd = date_to_ymd(dt)
    print(f"[INFO] Fetch program attempt: {target_ymd}")
    url_idx = f"{BASE}/owpc/pc/race/raceindex?hd={target_ymd}"
    matched, soup = fetch_and_check(url_idx, target_ymd)
    if matched == target_ymd:
        print(f"[OK] index reports date {matched}")
        return parse_index(soup, dt), matched

    for offset in (-1, 1):
        dt2 = dt + timedelta(days=offset)
        y2 = date_to_ymd(dt2)
        url2 = f"{BASE}/owpc/pc/race/raceindex?hd={y2}"
        m2, so2 = fetch_and_check(url2, y2)
        if m2 == y2:
            print(f"[OK] using offset date {y2}")
            return parse_index(so2, dt2), m2

    print("[WARN] cannot confirm correct date in index, fallback parse target")
    try:
        resp = http_get(url_idx)
        soup = BeautifulSoup(resp.text, "lxml")
        return parse_index(soup, dt), None
    except Exception as e:
        print(f"[ERROR] fallback parse failed: {e}")
        return None, None

def parse_index(soup, dt):
    program = {}
    venue_links = soup.select("ul.tab01_01 li a") or soup.select(".is-holding a") or soup.select("a[href*='raceinfo']")
    seen = set()
    for a in venue_links:
        title = safe_get_text(a)
        href = a.get("href")
        if not href or title in seen:
            continue
        seen.add(title)
        url = href if href.startswith("http") else urljoin(BASE, href)
        try:
            resp = http_get(url)
            so = BeautifulSoup(resp.text, "lxml")
            vid = extract_venue_id(href) or title
            program[vid] = parse_venue_page(so)
            time.sleep(0.2)
        except Exception as e:
            print(f"[WARN] venue parse fail {title}: {e}")
    return program

def extract_venue_id(href):
    try:
        qs = parse_qs(urlparse(href).query)
        jcd = qs.get("jcd")
        if jcd:
            return jcd[0]
    except:
        pass
    return None

def parse_venue_page(so):
    races = {}
    links = so.select(".race_card_btn a") or so.select(".race_card_btn") or so.select("a[href*='racelist']")
    for a in links:
        txt = safe_get_text(a)
        import re
        m = re.match(r"^(\d{1,2})R$", txt)
        href = a.get("href")
        if m and href:
            no = m.group(1)
            url = href if href.startswith("http") else urljoin(BASE, href)
            try:
                resp = http_get(url)
                so2 = BeautifulSoup(resp.text, "lxml")
                races[no] = parse_race_detail(so2)
                time.sleep(0.15)
            except Exception as e:
                races[no] = {"error": str(e)}
    return races

def parse_race_detail(so):
    out = {"race_title": "", "boats": []}
    t0 = so.select_one(".heading1_title") or so.select_one("h2")
    out["race_title"] = safe_get_text(t0)
    rows = so.select(".table1 tbody tr") or so.select(".is-fs14 tr") or so.select(".table4 tr")
    for tr in rows:
        cols = tr.select("td")
        if len(cols) < 4:
            continue
        try:
            lane = safe_get_text(cols[0])
            name = safe_get_text(cols[1]) if len(cols) > 1 else ""
            st = safe_get_text(cols[5]) if len(cols) > 5 else ""
            fcnt = safe_get_text(cols[4]) if len(cols) > 4 else "0"
            meta = safe_get_text(cols[7]) if len(cols) > 7 else ""
            import re
            nums = re.findall(r"\d+\.\d+", meta)
            nat = float(nums[0]) if len(nums) > 0 else 0.0
            loc = float(nums[1]) if len(nums) > 1 else 0.0
            mot = float(nums[2]) if len(nums) > 2 else 0.0
            out["boats"].append({
                "racer_boat_number": int(lane) if lane.isdigit() else lane,
                "racer_name": name,
                "racer_average_start_timing": float(st) if st and st.replace(".", "").isdigit() else None,
                "racer_flying_count": int(fcnt) if fcnt.isdigit() else 0,
                "racer_national_top_1_percent": nat,
                "racer_local_top_1_percent": loc,
                "racer_assigned_motor_top_2_percent": mot
            })
        except Exception:
            continue
    return out

# ------------------------
# 結果取得ロジック
# ------------------------
def fetch_result_for_date(dt):
    ymd = date_to_ymd(dt)
    url = f"{BASE}/owpc/pc/race/raceresultall?hd={ymd}"
    matched, so = fetch_and_check(url, ymd)
    if matched == ymd:
        return parse_result_index(so), matched
    for offset in (-1, 1):
        dt2 = dt + timedelta(days=offset)
        y2 = date_to_ymd(dt2)
        url2 = f"{BASE}/owpc/pc/race/raceresultall?hd={y2}"
        m2, s2 = fetch_and_check(url2, y2)
        if m2 == y2:
            return parse_result_index(s2), m2
    try:
        resp = http_get(url)
        so2 = BeautifulSoup(resp.text, "lxml")
        return parse_result_index(so2), None
    except Exception as e:
        print(f"[ERROR] fetch_result final fail: {e}")
        return None, None

def parse_result_index(so):
    out = {}
    items = so.select(".table1 a") or so.select("a[href*='raceresult']")
    for a in items:
        nm = safe_get_text(a)
        href = a.get("href")
        if not href:
            continue
        out[nm] = urljoin(BASE, href)
    return out

# ------------------------
# メイン処理
# ------------------------
def main():
    base_date = now_jst_date() if forced_date is None else datetime.strptime(forced_date, "%Y%m%d").date()
    d_json = load_json()

    # 出走表取得
    if force_program or date_to_ymd(base_date) not in d_json:
        prog, matched = fetch_program_for_date(base_date)
        key = matched or date_to_ymd(base_date)
        if prog is not None:
            if key not in d_json:
                d_json[key] = {}
            d_json[key]["program"] = prog
            print(f"[INFO] Stored program under key {key}")
    else:
        print("[INFO] Program already exists.")

    # 結果取得
    if force_result or ("results" not in d_json.get(date_to_ymd(base_date), {})):
        res, matched_r = fetch_result_for_date(base_date)
        keyr = matched_r or date_to_ymd(base_date)
        if res is not None:
            if keyr not in d_json:
                d_json[keyr] = {}
            d_json[keyr]["results"] = res
            print(f"[INFO] Stored results under key {keyr}")
    else:
        print("[INFO] Results already exist.")

    save_json(d_json)
    print(f"[DONE] Done. Base date = {date_to_ymd(base_date)}")

if __name__ == "__main__":
    main()