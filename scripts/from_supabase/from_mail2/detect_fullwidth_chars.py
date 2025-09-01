import csv
import unicodedata

input_file = "architects_table0823-3.tsv"
input_file = "architects_table0823-3_cleaned.tsv"
input_file = "architects_table0828-1_cleaned.tsv"

with open(input_file, "r", encoding="utf-8") as infile:
    reader = csv.reader(infile, delimiter="\t")
    
    for row in reader:
        if len(row) < 3:
            continue
        text = row[2]
        text = row[4]

        # 全角文字だけ抽出
        fullwidth_chars = [ch for ch in text if unicodedata.east_asian_width(ch) in ("F", "W")]

        if fullwidth_chars:
            unique_chars = "".join(sorted(set(fullwidth_chars)))
            print(f"ID={row[0]} に全角文字があります → {text}")
            print(f"   全角文字: {unique_chars}")
