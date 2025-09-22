# fetch_data.py
# Fetch boat race programs for all 24 venues and write data.json in app.js-friendly format.
# Strategy:
#  - Try Boatrace Open API (https://boatraceopenapi.github.io/programs/v2/today.json)
#  - If that fails, fall back to per-venue official cardjson endpoint
#  - Normalize programs into flat list: each item has race_date (YYYY-MM-DD), race_stadium_number (int), race_number (int), race_title, boats[]
#  - Save output with keys: updated, programs, races.programs (both exist to be compatible)

import requests, json, datetime, time, sys, os

OPEN_API_URL = "https://boatraceopenapi.github.io/programs/v2/today.json"
CARDJSON_URL = "https://www.boatrace.jp/owpc/pc/race/cardjson?jcd={jcd}&hd={date}"

VENUE_CODES = {
    1:"桐生", 2:"戸田", 3:"江戸川", 4:"平和島", 5:"多摩川", 6:"浜名湖",
    7:"蒲郡", 8:"常滑", 9:"津", 10:"三国", 11:"びわこ", 12:"住之江",
    13:"尼崎", 14:"鳴門", 15:"丸亀", 16:"児島", 17:"宮島", 18:"徳山",
    19:"下関", 20:"若松", 21:"芦屋", 22:"福岡", 23:"唐津", 24:"大村"
}

OUT_FILE = "data.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Referer": "https://www.boatrace.jp/"
}

def iso_today():
    return datetime.date.today().strftime("%Y-%m-%d")

def ymd_today():
    return datetime.date.today().strftime("%Y%m%d")

def fetch_open_api():
    try:
        print("[INFO] Trying Open API:", OPEN_API_URL)
        r = requests.get(OPEN_API_URL, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            print(f"[WARN] Open API returned status {r.status_code}")
            return None
        j = r.json()
        if not j:
            print("[WARN] Open API returned empty json")
            return None
        # open API returns { programs: [ ... ] } or similar — handle both
        if isinstance(j, dict) and "programs" in j and isinstance(j["programs"], list):
            return j["programs"]
        # some mirrors return { races: { programs: [...] } }
        if isinstance(j, dict) and j.get("races") and isinstance(j["races"].get("programs"), list):
            return j["races"]["programs"]
        # else if top-level is array
        if isinstance(j, list):
            return j
        print("[WARN] Open API JSON shape unexpected")
        return None
    except Exception as e:
        print("[ERROR] Open API fetch failed:", e)
        return None

def fetch_cardjson_for_all():
    """
    Fallback: for each venue call cardjson and normalize.
    cardjson example: contains "cardDataList" with races
    """
    out = []
    date = ymd_today()
    for jcd_int, venue_name in VENUE_CODES.items():
        jcd = f"{jcd_int:02d}"
        url = CARDJSON_URL.format(jcd=jcd, date=date)
        try:
            print(f"[INFO] cardjson {venue_name} ({jcd}) -> {url}")
            r = requests.get(url, headers=HEADERS, timeout=15)
            # debug snippet if non-json:
            if r.status_code != 200:
                print(f"[WARN] {venue_name} cardjson status {r.status_code}")
                time.sleep(0.2)
                continue
            # some responses may be HTML if blocked — try json()
            try:
                j = r.json()
            except Exception as je:
                print(f"[WARN] {venue_name} cardjson not json: {je}; snippet:\n{r.text[:300]}")
                time.sleep(0.2)
                continue

            # cardDataList holds per-race info
            cdl = j.get("cardDataList") or j.get("carddataList") or []
            for race in cdl:
                rno = race.get("raceNo") or race.get("race_no") or race.get("raceNoStr")
                try:
                    rno_int = int(rno)
                except:
                    continue
                title = race.get("title") or race.get("raceName") or f"{rno_int}R"
                sensyu = race.get("sensyuList") or race.get("entryList") or []
                boats = []
                for e in sensyu:
                    try:
                        teiban = e.get("teiban") or e.get("boatNo") or e.get("racerBoatNumber")
                        teiban_int = int(teiban) if teiban is not None else None
                    except:
                        teiban_int = None
                    boats.append({
                        "racer_boat_number": teiban_int,
                        "racer_name": e.get("name") or e.get("racerName"),
                        "racer_number": e.get("racerNo") or e.get("racer_number"),
                        "racer_class": e.get("kyu") or e.get("class"),
                        # other fields often not in cardjson; leave nulls
                        "racer_average_start_timing": None,
                        "racer_flying_count": None,
                        "racer_local_top_1_percent": None,
                        "racer_assigned_motor_top_2_percent": None,
                        "racer_assigned_boat_top_2_percent": None
                    })
                program = {
                    "race_date": datetime.date.today().isoformat(),
                    "race_stadium_number": jcd_int,
                    "race_number": rno_int,
                    "race_title": title,
                    "race_subtitle": race.get("subTitle") or "",
                    "race_distance": race.get("distance") or None,
                    "boats": boats
                }
                out.append(program)
            # be polite
            time.sleep(0.25)
        except Exception as e:
            print(f"[WARN] {venue_name} fetch error: {e}")
            time.sleep(0.25)
            continue
    return out

def normalize_open_programs(raw_programs):
    """
    The open API programs are likely already in desired shape.
    We'll map fields to the app's expectations when necessary.
    """
    out = []
    for p in raw_programs:
        try:
            # open API fields example: race_date: "2025-09-15", race_stadium_number: 2,... boats: [...]
            rd = p.get("race_date") or p.get("date") or None
            # ensure yyyy-mm-dd
            if rd and len(rd) == 8 and rd.isdigit():
                rd = f"{rd[:4]}-{rd[4:6]}-{rd[6:8]}"
            stadium = p.get("race_stadium_number") or p.get("jcd") or p.get("stadium") or None
            try:
                stadium_int = int(stadium) if stadium is not None else None
            except:
                stadium_int = None
            rno = p.get("race_number") or p.get("race_number_str") or p.get("raceNo") or p.get("raceNoInt")
            try:
                rno_int = int(rno) if rno is not None else None
            except:
                rno_int = None

            boats_raw = p.get("boats") or p.get("entries") or p.get("boatList") or []
            boats = []
            for b in boats_raw:
                boats.append({
                    "racer_boat_number": b.get("racer_boat_number") or b.get("boat_number") or b.get("teiban") or b.get("teiban_int"),
                    "racer_name": b.get("racer_name") or b.get("name") or b.get("racerName"),
                    "racer_number": b.get("racer_number") or b.get("racerNo") or b.get("racer_number"),
                    "racer_class_number": b.get("racer_class_number") or b.get("klass") or None,
                    "racer_average_start_timing": b.get("racer_average_start_timing") or b.get("st") or None,
                    "racer_flying_count": b.get("racer_flying_count") or b.get("fcount") or 0,
                    "racer_local_top_1_percent": b.get("racer_local_top_1_percent") or b.get("local_win_rate") or None,
                    "racer_assigned_motor_top_2_percent": b.get("racer_assigned_motor_top_2_percent") or b.get("motor_win_rate") or None,
                    "racer_assigned_boat_top_2_percent": b.get("racer_assigned_boat_top_2_percent") or b.get("boat_win_rate") or None
                })
            prog = {
                "race_date": rd or datetime.date.today().isoformat(),
                "race_stadium_number": stadium_int,
                "race_number": rno_int,
                "race_title": p.get("race_title") or p.get("race_title_jp") or p.get("race_title_raw") or p.get("race_title") or p.get("race_title") or p.get("race_title") or "",
                "race_subtitle": p.get("race_subtitle") or p.get("race_subtitle") or "",
                "race_distance": p.get("race_distance") or None,
                "boats": boats
            }
            out.append(prog)
        except Exception as e:
            print("[WARN] normalize open program error:", e)
            continue
    return out

def load_existing_history():
    # preserve history if present in existing data.json
    if os.path.exists(OUT_FILE):
        try:
            with open(OUT_FILE, encoding="utf-8") as f:
                cur = json.load(f)
            return cur.get("history", [])
        except Exception:
            return []
    return []

def main():
    history = load_existing_history()
    progs = fetch_open_api()
    if progs is not None:
        print(f"[OK] Open API returned {len(progs)} program entries (raw)")
        normalized = normalize_open_programs(progs)
    else:
        print("[INFO] Open API failed — using cardjson fallback")
        normalized = fetch_cardjson_for_all()

    # filter out items that don't have stadium/race number or boats
    normalized = [p for p in normalized if p.get("race_stadium_number") and p.get("race_number")]

    # sort for deterministic order: stadium asc, race asc
    normalized.sort(key=lambda x: (int(x.get("race_stadium_number") or 0), int(x.get("race_number") or 0)))

    out = {
        "updated": datetime.datetime.utcnow().isoformat() + "Z",
        "programs": normalized,
        "races": {"programs": normalized},
        "stats": {},      # later expansion: per-venue AI hit counts
        "history": history
    }

    # write
    try:
        with open(OUT_FILE, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=2)
        print(f"[SAVED] {OUT_FILE} ({len(normalized)} records)")
    except Exception as e:
        print("[ERROR] write failed:", e)
        sys.exit(2)

if __name__ == "__main__":
    main()