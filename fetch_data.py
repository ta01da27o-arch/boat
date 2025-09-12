import requests, json, os, datetime

# オープンAPI (Boatrace Open API Programs v2)
API_URL_TODAY = "https://boatraceopenapi.github.io/programs/v2/today.json"

def fetch_today():
    print(f"Fetching {API_URL_TODAY}")
    res = requests.get(API_URL_TODAY)
    if res.status_code != 200:
        raise Exception(f"API error: {res.status_code}")
    return res.json()

def main():
    today_data = fetch_today()

    os.makedirs("data", exist_ok=True)
    output_file = "data/race_data.json"

    output = {
        "updated": datetime.datetime.now().isoformat(),
        "races": today_data
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Updated {output_file}")

if __name__ == "__main__":
    main()