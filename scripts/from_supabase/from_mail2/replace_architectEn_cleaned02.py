import csv
import re
import sys

# 入力ファイル（例）
tsv_file = "architects_table0828-1_cleaned_01.tsv"
seigo_file = "architectJa正誤表_2.txt"
output_file = "architects_table0828-1_cleaned_02.tsv"



# 誤→正 マッピングを作成（キーは大文字化して保存）
seigo_map = {}
with open(seigo_file, "r", encoding="utf-8") as f:
    for lineno, line in enumerate(f, start=1):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split("\t")
        if len(parts) != 2:
            sys.exit(f"❌ エラー: {seigo_file} の {lineno} 行目が不正です → 「{line}」")

        wrong, correct = parts
        wrong = wrong.strip().upper()

        # 正の列に小文字が含まれていたら大文字化
        if any(c.islower() for c in correct):
            print(f"⚠ 正の値に小文字を検出 → 大文字化します: {correct} → {correct.upper()}")
            correct = correct.upper()
        else:
            correct = correct.strip()

        seigo_map[wrong] = correct

print("=== 誤→正 マッピング ===")
for k, v in seigo_map.items():
    print(f"{k} → {v}")

# TSVの処理
with open(tsv_file, "r", encoding="utf-8") as infile, \
     open(output_file, "w", encoding="utf-8", newline="") as outfile:

    reader = csv.DictReader(infile, delimiter="\t")

    # 固定の見出し行を書き込む
    outfile.write("#architect_id\tarchitectJa\tarchitectEn\tarchitectJa_cleaned\tarchitectEn_cleaned\n")

    writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames, delimiter="\t")

    for row in reader:
        if row["architectEn_cleaned"]:
            original = row["architectEn_cleaned"]
            names = original.split("|")
            cleaned_names = []
            for name in names:
                stripped = name.strip()
                key = stripped.upper()
                if key in seigo_map:
                    print(f"置換: {stripped} → {seigo_map[key]} (architect_id={row['#architect_id']})")
                    stripped = seigo_map[key]
                cleaned_names.append(stripped)
            row["architectEn_cleaned"] = "|".join(cleaned_names)

        writer.writerow(row)

print(f"\n✅ 処理完了: {output_file} に出力しました")
