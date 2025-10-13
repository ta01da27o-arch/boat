#!/usr/bin/env python3
# coding: utf-8
"""
fetch_data.py
- JST基準で本日の出走表 / 結果を取得して data.json に保存
- 取得したページの中身を検査し、指定日と異なる場合は前後1日を自動で試行
- 警告抑止（BeautifulSoup の XMLParsedAsHTMLWarning）
- 実行例:
    python fetch_data.py --force-program
    python fetch_data.py --force-result
    python fetch_data.py --force-program --force-result
"""

import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
import json
import datetime
import pytz
import warnings
import sys
import os
import time
from urllib.parse import urljoin

# -------------------------
# 設定
# -------------------------
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)
BASE_SITE = "https://www.boatrace.jp"
DATA_FILE = "data.json"
TIMEOUT = 15  # seconds for HTTP requests
JST = pytz.timezone("Asia/Tokyo")

# コマンドオプション
force_program = "--force-program" in sys.argv
force_result = "--force-result" in sys.argv
# allow manual override date via --date=YYYYMMDD
forced_date = None
for arg in sys.argv:
    if arg.startswith("--date="):
        forced_date = arg.split("=", 1)[1]

# -------------------------
# ユーティリティ
# -------------------------
def now_jst_date():
    return (datetime.datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(JST)).date()

def to_ymd(dateobj):
    return dateobj.strftime("%Y%m%d")

def safe_get_text(el):
    return el.get_text(strip=True) if el else ""

def load_datafile():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            # 過去に list で保存されている場合に dict に変換してマージ
            if isinstance(data, list):
                merged = {}
                for it in data:
                    if isinstance(it, dict):
                        merged.update(it)
                data = merged
            if not isinstance(data, dict):
                data = {}
            return data
        except Exception as e:
            print(f"[WARN] {DATA_FILE} 読込失敗: {e} → 新規作成します")
            return {}
    return {}

def save_datafile(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[INFO] 保存完了 → {DATA_FILE}")

def http_get(url, **kwargs):
    kwargs.setdefault("timeout", TIMEOUT)
    headers = kwargs.pop("headers", {})
    # 適度な User-Agent
    headers.setdefault("User-Agent", "boat-fetcher/1.0 (+https://github.com)")
    try:
        r = requests.get(url, headers=headers, **kwargs)
        r.raise_for_status()
        # attempt encoding
        if r.encoding is None:
            r.encoding = r.apparent_encoding
        return r
    except Exception as e:
        raise

# -------------------------
# ページ検査（ページ内に含まれる日付を推定して、targetと一致するか判定）
# 戻り値: (matched_date_str or None, parsed_soup)
# -------------------------
def fetch_and_check(url, target_ymd):
    """
    url を取得、BeautifulSoupで解析し、ページ内から日付（race_date相当）を探して返す。
    この関数は単一ページの検査に使う。見つからなければ None を返す。
    """
    try:
        r = http_get(url)
    except Exception as e:
        print(f"[ERROR] HTTP 取得失敗: {url} -> {e}")
        return None, None

    soup = BeautifulSoup(r.text, "lxml")

    # ページ内に YYYY-MM-DD や YYYY/MM/DD 形式の文字列があれば抽出
    txt = soup.get_text(separator=" ", strip=True)
    # 優先的に YYYY-MM-DD
    import re
    m = re.search(r"(\d{4})[/-](\d{2})[/-](\d{2})", txt)
    if m:
        ym = f"{m.group(1)}{m.group(2)}{m.group(3)}"
        return ym, soup

    # 代替: ページ内に race_date フィールドがあれば抽出
    #  (サイトにより様々なのでオプション的に)
    #  例: 'race_date":"2025-10-14' などが HTML 内に混ざる場合
    m2 = re.search(r'race_date"\s*:\s*"(\d{8})"', r.text)
    if m2:
        return m2.group(1), soup

    # 見つからない
    return None, soup

# -------------------------
# 出走表取得ロジック（指定日で試行、日付不一致なら前後1日を試す）
# - 戻り値: program_data (任意の構造)
# -------------------------
def fetch_program_for_date(target_date):
    target_ymd = to_ymd(target_date)
    print(f"[INFO] 出走表取得試行: {target_ymd}")

    # 主要URL: レースINDEX（場別リンクを一覧するページ）
    # 指定 hd パラで試す
    base_index = f"{BASE_SITE}/owpc/pc/race/raceindex?hd={target_ymd}"

    # try target
    matched, soup = fetch_and_check(base_index, target_ymd)
    if matched == target_ymd:
        print(f"[OK] index page reports date {matched} (matches target)")
        program = parse_program_index(soup, target_date)
        return program, matched

    # 不一致または日付不明 → 試行: 前日・翌日（順に）を試す
    for offset in (-1, 1):
        cand_date = target_date + datetime.timedelta(days=offset)
        cand_ymd = to_ymd(cand_date)
        url = f"{BASE_SITE}/owpc/pc/race/raceindex?hd={cand_ymd}"
        print(f"[INFO] 再試行: {cand_ymd}")
        matched2, soup2 = fetch_and_check(url, cand_ymd)
        if matched2 == cand_ymd:
            print(f"[OK] index page reports date {matched2} → using {cand_ymd}")
            program = parse_program_index(soup2, cand_date)
            return program, matched2

    # どれもうまくいかない場合は target を解析して返す（最終手段）
    print("[WARN] ページ内日付が見つからないか一致しません。ターゲットページを可能な範囲で解析します。")
    # fetch without check and parse target page
    try:
        r = http_get(base_index)
        soup = BeautifulSoup(r.text, "lxml")
        program = parse_program_index(soup, target_date)
        return program, None
    except Exception as e:
        print(f"[ERROR] 最終解析に失敗: {e}")
        return None, None

# -------------------------
# indexページから各場のリンクを抽出してプログラムを組み立てる
# -------------------------
def parse_program_index(soup, date_obj):
    """
    soup: raceindex ページの BeautifulSoup
    戻り値: program_data dict: { stadium_id_or_name: { races: {no: {...}} } }
    """
    program = {}
    # ページごとにDOMが変わるので、柔軟にリンクを探す
    # 典型: 各場のリンクが <ul class="tab01_01"> 内にあることが多い
    venue_links = soup.select("ul.tab01_01 li a") or soup.select(".is-holding a") or soup.select("a[href*='race/raceinfo']")
    seen = set()
    for a in venue_links:
        href = a.get("href")
        title = safe_get_text(a)
        if not href or title in seen:
            continue
        seen.add(title)
        # 完全URL化
        url = href if href.startswith("http") else urljoin(BASE_SITE, href)
        # 各場ページを取得して races を抜く
        try:
            r = http_get(url)
            s = BeautifulSoup(r.text, "lxml")
            # parse per-venue
            venue_id = extract_venue_id_from_href(href) or title
            program[venue_id] = parse_venue_page(s)
            # 少し待って過剰アクセスを回避
            time.sleep(0.2)
        except Exception as e:
            print(f"[WARN] 施設ページ取得失敗 {title}: {e}")
    return program

def extract_venue_id_from_href(href):
    # try extract jcd= or place code
    from urllib.parse import parse_qs, urlparse
    try:
        qs = urlparse(href).query
        params = parse_qs(qs)
        jcd = params.get("jcd")
        if jcd:
            return jcd[0]
    except Exception:
        pass
    return None

def parse_venue_page(soup):
    """
    施設ページから race list を解析して簡易的な races 情報を返す
    戻り値: { race_no: {race_title:..., boats: [...] } }
    """
    races = {}
    # race_card_btn 等からレース番号とリンクを抽出
    links = soup.select(".race_card_btn a") or soup.select(".race_card_btn") or soup.select("a[href*='racelist']")
    if not links:
        # fallback: collect buttons that look like '1R' '2R'
        links = soup.select("a")
    for a in links:
        txt = safe_get_text(a)
        m = None
        import re
        # '1R' '2R' のテキストをターゲットにする
        m = re.match(r"^(\d{1,2})R$", txt)
        href = a.get("href") or a.get("data-href") or ""
        if m and href:
            no = m.group(1)
            url = href if href.startswith("http") else urljoin(BASE_SITE, href)
            try:
                r = http_get(url)
                s = BeautifulSoup(r.text, "lxml")
                # レース詳細解析
                races[no] = parse_race_detail(s)
                time.sleep(0.15)
            except Exception as e:
                # skip on fail
                races[no] = {"error": str(e)}
    # 最低限空でも返す
    return races

def parse_race_detail(soup):
    """
    race detail page を解析して、boats（選手情報）を取り出す。
    戻り値: { race_title: str, boats: [ {fields...} ] }
    """
    out = {"race_title": "", "boats": []}
    title_el = soup.select_one(".heading2_title") or soup.select_one(".heading1_title") or soup.select_one("h2")
    out["race_title"] = safe_get_text(title_el)
    # テーブル内の各選手行を探す典型セレクタ
    rows = soup.select(".table1 tbody tr") or soup.select(".is-fs14 tr") or soup.select(".table4 tr")
    for tr in rows:
        cols = tr.select("td")
        if not cols or len(cols) < 4:
            continue
        try:
            # 適宜カラムを探して抽出（サイト差異に柔軟に対応）
            lane = None
            name = None
            st = None
            fcount = None
            national = None
            local = None
            motor = None
            # ランと名前を探す
            # try by class names
            lane_el = tr.select_one(".is-fs20") or tr.select_one(".boatNo") or tr.select_one("td:nth-of-type(1)")
            name_el = tr.select_one(".table1_name") or tr.select_one("td:nth-of-type(2)")
            st_el = tr.select_one(".table1_start") or tr.select_one("td:nth-of-type(6)") or tr.select_one(".startTiming")
            f_el = tr.select_one(".f_count") or tr.select_one(".table1_f")
            meta_el = tr.select_one(".table1_rate") or tr.select_one("td:nth-of-type(8)")

            lane = safe_get_text(lane_el)[:2] if lane_el else None
            name = safe_get_text(name_el)
            st = safe_get_text(st_el)
            fcount = safe_get_text(f_el) if f_el else None

            # 勝率系は数値抽出
            if meta_el:
                meta_txt = meta_el.get_text(" ", strip=True)
                import re
                nums = re.findall(r"\d+\.\d+|\d+\.\d|\d+", meta_txt)
                # heuristics: pick first three numbers as national/local/motor
                if nums and len(nums) >= 3:
                    try:
                        national = float(nums[0])
                        local = float(nums[1])
                        motor = float(nums[2])
                    except:
                        pass

            out["boats"].append({
                "racer_boat_number": int(lane) if lane and lane.isdigit() else lane,
                "racer_name": name or "",
                "racer_average_start_timing": float(st) if st and st.replace(".", "").isdigit() else None,
                "racer_flying_count": int(fcount) if fcount and fcount.isdigit() else 0,
                "racer_national_top_1_percent": national,
                "racer_local_top_1_percent": local,
                "racer_assigned_motor_top_2_percent": motor
            })
        except Exception as e:
            # ignore row parse errors
            continue
    return out

# -------------------------
# 結果取得ロジック（result page）
# -------------------------
def fetch_results_for_date(target_date):
    target_ymd = to_ymd(target_date)
    print(f"[INFO] 結果取得試行: {target_ymd}")
    # race result all page
    url = f"{BASE_SITE}/owpc/pc/race/raceresultall?hd={target_ymd}"
    matched, soup = fetch_and_check(url, target_ymd)
    if matched == target_ymd:
        print(f"[OK] result page reports date {matched}")
        results = parse_result_index(soup)
        return results, matched

    # try +/-1
    for offset in (-1, 1):
        cand = target_date + datetime.timedelta(days=offset)
        url2 = f"{BASE_SITE}/owpc/pc/race/raceresultall?hd={to_ymd(cand)}"
        matched2, soup2 = fetch_and_check(url2, to_ymd(cand))
        if matched2 == to_ymd(cand):
            print(f"[OK] result page reports date {matched2} (use this)")
            return parse_result_index(soup2), matched2

    # fallback parse target page if possible
    try:
        r = http_get(url)
        s = BeautifulSoup(r.text, "lxml")
        return parse_result_index(s), None
    except Exception as e:
        print(f"[ERROR] result fetch final fail: {e}")
        return None, None

def parse_result_index(soup):
    """
    result index ページから venue->races->result を取り出す（簡易）
    """
    out = {}
    # 掲載リンクを拾う
    # typical: table rows or anchor list
    items = soup.select(".table1 a") or soup.select(".is-result a") or soup.select("a[href*='raceresult']")
    for a in items:
        name = safe_get_text(a)
        href = a.get("href")
        if not href:
            continue
        out[name] = urljoin(BASE_SITE, href)
    return out

# -------------------------
# Main
# -------------------------
def main():
    today = now_jst_date() if forced_date is None else datetime.datetime.strptime(forced_date, "%Y%m%d").date()
    data = load_datafile()

    # プログラム（出走表）
    if force_program or (to_ymd(today) not in data):
        program, matched = fetch_program_for_date(today)
        key = matched or to_ymd(today)
        if program is None:
            print("[ERROR] 出走表の取得に失敗しました。")
        else:
            if key not in data:
                data[key] = {}
            data[key]["program"] = program
            print(f"[INFO] 出走表を data.json に格納 (key={key})")
    else:
        print("[INFO] 出走表は既に存在します。")

    # 結果（result）
    if force_result or (to_ymd(today) not in data) or ("results" not in data.get(to_ymd(today), {})):
        results, matched_r = fetch_results_for_date(today)
        keyr = matched_r or to_ymd(today)
        if results is None:
            print("[WARN] 結果の取得に失敗／データなし.")
        else:
            if keyr not in data:
                data[keyr] = {}
            data[keyr]["results"] = results
            print(f"[INFO] 結果を data.json に格納 (key={keyr})")
    else:
        print("[INFO] 結果は既に存在します。")

    # 保存
    save_datafile(data)
    print(f"[DONE] 終了 (基準日: {to_ymd(today)})")

if __name__ == "__main__":
    main()