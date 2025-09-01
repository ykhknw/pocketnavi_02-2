import csv

# 入力・出力ファイル名
#input_file = "architects_table0823-3.tsv"
input_file = "architects_table0828-1.tsv"
#output_file = "architects_table0823-3_cleaned_02.tsv"
output_file = "architects_table0828-1_cleaned.tsv"

# 全角→半角の変換マップ
fullwidth_map = str.maketrans({
    "／": "/",   # 全角スラッシュ
    "　": " ",   # 全角スペース
    "＋": "+",
    "（": "(",
    "）": ")",
    "，": ",",
    "：": ":",
    "＆": "&",
    "ー": "-",
    "．": ".",
    "。": ".",   # 全角句点 → 半角ピリオド
    "＼": "/",
    "０": "0",
    "１": "1",
    "２": "2",
    "４": "4",
    "５": "5",
})

with open(input_file, "r", encoding="utf-8") as infile, \
     open(output_file, "w", encoding="utf-8", newline="") as outfile:
    
    reader = csv.reader(infile, delimiter="\t")
    writer = csv.writer(outfile, delimiter="\t")

    for row in reader:
        if len(row) < 3:
            continue

        # コラム4（空）
        col4 = ""

        # コラム5 = コラム3 → UpperCase → 全角→半角変換
        col5 = row[2].upper().translate(fullwidth_map)

        new_row = row + [col4, col5]
        writer.writerow(new_row)

print(f"出力完了: {output_file}")
