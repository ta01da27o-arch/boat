# fetch_data.py
# JST基準で「today」「yesterday」「history(過去30日)」を取得する安定版
# 実行例:
#   python fetch_data.py today
#   python fetch_data.py yesterday
#   python fetch_data.py history

import sys
import json
import time
import warnings
import datetime
from datetime import timezone, timedelta
from pathlib import Path

import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# --- 設定 ---
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

BASE_URL = "https://www.boatrace.jp/owpc/pc/race"
OPENAPI_PROGRAMS_TODAY = "https://boatraceopenapi.github.io/programs/v2/today.json"
OUT_DATA = Path("data.json")
OUT_HISTORY = Path("history.json")

# requests セッション（リトライ付き）
session = requests.Session()
retries = Retry(total=3, backoff_factor=1.5, status_forcelist=[429, 500, 502, 503, 504])
session.mount("https://", HTTPAdapter(max_retries=retries))

# --- ユーティリティ ---
def now_jst():
    """現在時刻を JST（タイムゾーン付き datetime）で返す"""
    return datetime.datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=9)))

def date_jst(days_offset=0):
    """JST基準での日付(文字列 YYYYMMDD と date オブジェクト)を返す"""
    d = now_jst().date() + datetime.timedelta(days=days_offset)
    return d.strftime("%Y%m%d"), d

def fetch_text(url, timeout=30):
    try:
        r = session.get(url, timeout=timeout)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"⚠️ fetch failed: {url} -> {e}")
        return None

def fetch_json(url, timeout=20):
    try:
        r = session.get(url, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"⚠️ json fetch failed: {url} -> {e}")
        return None

def save_json_file(path: Path, data):
    try:
        with path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ {path} を更新しました ({len(data) if isinstance(data, list) else 'object'})")
    except Exception as e:
        print(f"⚠️ 保存失敗 {path}: {e}")

# --- スクレイピング系 ---
def parse_jcds_from_index(ymd):
    """公式トップの raceindex ページを解析して開催中場の jcd を抽出する（堅牢化）"""
    url = f"{BASE_URL}/raceindex?hd={ymd}"
    html = fetch_text(url)
    if not html:
        print("⚠️ raceindex の取得に失敗しました")
        return []

    soup = BeautifulSoup(html, "lxml")
    jcds = set()
    # 場所によってリンクの構造が異なるため、href に jcd= を含むすべてから抽出
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "jcd=" in href:
            # jcd=XX や jcd=XX&... に対応
            try:
                part = href.split("jcd=")[1]
                code = part.split("&")[0][:2]
                if code.isdigit():
                    jcds.add(code)
            except:
                continue
    jcds_list = sorted(jcds)
    print(f"✅ 開催中場 ({ymd}): {jcds_list}")
    return jcds_list

def fallback_jcds_from_openapi():
    """公式 OpenAPI から今日のプログラムの場コードを取得する（フォールバック）"""
    data = fetch_json(OPENAPI_PROGRAMS_TODAY)
    if not data:
        return []
    jcds = set()
    # openapi の構造は複数形で返る場合があるので柔軟に探す
    if isinstance(data, dict):
        # 値が配列のものを調べる
        for v in data.values():
            if isinstance(v, list):
                for item in v:
                    j = item.get("jcd") or item.get("race_stadium_number") or item.get("stadium_code")
                    if j:
                        jcds.add(str(j).zfill(2))
    elif isinstance(data, list):
        for item in data:
            j = item.get("jcd") or item.get("race_stadium_number") or item.get("stadium_code")
            if j:
                jcds.add(str(j).zfill(2))
    jcds_list = sorted(jcds)
    print(f"🔁 OpenAPI フォールバックで取得: {jcds_list}")
    return jcds_list

def fetch_racelist_for_jcd_and_rno(ymd, jcd, rno):
    """各場・各レース番号の出走表ページを取得して最低限の情報を返す"""
    url = f"{BASE_URL}/racelist?rno={rno}&jcd={jcd}&hd={ymd}"
    html = fetch_text(url)
    if not html:
        return None

    soup = BeautifulSoup(html, "lxml")
    # レースタイトル
    title_tag = soup.select_one(".heading2_title")
    race_title = title_tag.get_text(strip=True) if title_tag else f"{rno}R"

    # 出走選手（できる範囲で取得）
    boats = []
    # 公式ページの構造は多種あるため、可能な限りフィールドを拾う
    # 例: 選手名 -> .table1_name や .boatname 等
    name_nodes = soup.select(".table1_name") or soup.select(".boatName") or soup.select(".name")
    st_nodes = soup.select(".table1_st") or soup.select(".st") or []
    f_nodes = soup.select(".table1_f") or []
    # 単純に艇番号->順に並ぶ想定で抽出（完全な精度は現場で微調整）
    for i in range(6):
        name = None
        if i < len(name_nodes):
            name = name_nodes[i].get_text(strip=True)
        st = None
        if i < len(st_nodes):
            raw = st_nodes[i].get_text(strip=True)
            try:
                st = float(raw)
            except:
                st = None
        fcnt = 0
        if i < len(f_nodes):
            txt = f_nodes[i].get_text(strip=True)
            # "F1" などの表現があれば数値抽出
            try:
                if txt and "F" in txt.upper():
                    fcnt = int(''.join(filter(str.isdigit, txt)) or 0)
            except:
                fcnt = 0

        boats.append({
            "racer_boat_number": i+1,
            "racer_name": name or None,
            "racer_start_timing": st,
            "racer_flying_count": fcnt
        })

    return {
        "race_date": ymd,
        "race_stadium_number": int(jcd),
        "race_number": rno,
        "race_title": race_title,
        "boats": boats,
        "source_url": url
    }

# --- 高レベル取得 ---
def fetch_programs_for_date(ymd):
    """指定日の開催場を判定し、その場のレース（最大12R）を収集"""
    jcds = parse_jcds_from_index(ymd)
    if not jcds:
        jcds = fallback_jcds_from_openapi()
    all_programs = []
    for jcd in jcds:
        # 各場12レースまでループして取得（存在しない場合は None を返す）
        for rno in range(1, 13):
            data = fetch_racelist_for_jcd_and_rno(ymd, jcd, rno)
            if data:
                all_programs.append(data)
            # スクレイピング先負荷軽減のため待機
            time.sleep(0.8)
    return all_programs

# --- モード別ラッパー ---
def mode_today():
    ymd, _ = date_jst(0)
    print(f"📅 JST 今日: {ymd} のデータを取得します (JST基準)")
    progs = fetch_programs_for_date(ymd)
    save_json = progs
    OUT_DATA.write_text(json.dumps(save_json, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ data.json を更新しました ({len(progs)} 件)")

def mode_yesterday():
    ymd, _ = date_jst(-1)
    print(f"📅 JST 前日: {ymd} のデータを取得します")
    progs = fetch_programs_for_date(ymd)
    OUT_DATA.write_text(json.dumps(progs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ data.json を更新しました ({len(progs)} 件)")

def mode_history(days=30):
    print(f"📦 過去 {days} 日分の履歴を JST 基準で取得します")
    today_jst = now_jst().date()
    history_all = []
    for i in range(1, days+1):
        d = today_jst - datetime.timedelta(days=i)
        ymd = d.strftime("%Y%m%d")
        print(f"🗓️ {ymd} を取得中...")
        progs = fetch_programs_for_date(ymd)
        history_all.extend(progs)
        time.sleep(1)
    OUT_HISTORY.write_text(json.dumps(history_all, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ history.json を更新しました ({len(history_all)} 件)")

# --- メイン ---
def main():
    arg = sys.argv[1].lower() if len(sys.argv) > 1 else "today"
    if arg not in ("today", "yesterday", "history"):
        print("Usage: python fetch_data.py [today|yesterday|history]")
        return

    # 実行モード
    try:
        if arg == "today":
            mode_today()
        elif arg == "yesterday":
            mode_yesterday()
        else:
            mode_history(30)
    except KeyboardInterrupt:
        print("Interrupted")
    except Exception as e:
        print(f"❌ 想定外エラー: {e}")

if __name__ == "__main__":
    main()