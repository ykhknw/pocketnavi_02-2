import os

import csv
import re

# 入力ファイル
tsv_file = "architects_table0828-1_cleaned.tsv"
seigo_file = "architectJa正誤表_1.txt"
output_file = "architects_table0828-1_cleaned_01.tsv"

# 誤→正 マッピングを作成
seigo_map = {}
with open(seigo_file, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        wrong, correct = line.split("\t")
        seigo_map[wrong.strip()] = correct.strip()

print("=== 誤→正 マッピング ===")
for k, v in seigo_map.items():
    print(f"{k} → {v}")

# TSVの処理
with open(tsv_file, "r", encoding="utf-8") as infile, \
     open(output_file, "w", encoding="utf-8", newline="") as outfile:

    reader = csv.DictReader(infile, delimiter="\t")

    # 出力ファイルに固定の見出し行を書き込む
    outfile.write("#architect_id\tarchitectJa\tarchitectEn\tarchitectJa_cleaned\tarchitectEn_cleaned\n")

    writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames, delimiter="\t")

    for row in reader:
        if not row["architectJa_cleaned"]:  # 空欄のときだけ処理
            original = row["architectJa"]
            names = original.split("|")
            cleaned_names = []
            for name in names:
                name = name.strip()
                # 誤表にあれば置換
                if name in seigo_map:
                    print(f"置換: {name} → {seigo_map[name]} (architect_id={row['#architect_id']})")
                    name = seigo_map[name]
                # アルファベットが含まれていたら大文字に統一
                if re.search(r"[A-Za-z]", name):
                    name = name.upper()
                cleaned_names.append(name)

            # " | " ではなく "|" で結合
            row["architectJa_cleaned"] = "|".join(cleaned_names)

        writer.writerow(row)

print(f"\n処理完了: {output_file} に出力しました")
