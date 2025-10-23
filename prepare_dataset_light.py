import ijson
import csv

INPUT_FILE = "history.json"
OUTPUT_FILE = "dataset.csv"

# 出力する列（例: JSONにあるフィールドを選択）
COLUMNS = ["race_date", "stadium", "race_number", "start_timing", "water_type"]

def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f, \
         open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as out:

        writer = csv.writer(out)
        writer.writerow(COLUMNS)  # ヘッダー行を書き込み

        # JSONのトップレベルが配列の場合: "item"
        for record in ijson.items(f, "item"):
            row = [record.get(col, "") for col in COLUMNS]
            writer.writerow(row)

if __name__ == "__main__":
    main()