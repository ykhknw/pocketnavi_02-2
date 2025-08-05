# データベース容量最適化戦略

## 現状分析
- SQLファイル: 42MB
- 推定DB容量: 100-150MB
- Supabase無料プラン: 500MB

## 最適化手順

### Phase 1: データクリーニング
```sql
-- 不要なデータ削除
DELETE FROM buildings WHERE title IS NULL OR title = '';
DELETE FROM photos WHERE url IS NULL OR url = '';

-- 重複データ削除
DELETE FROM buildings 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM buildings 
    GROUP BY title, location
);
```

### Phase 2: データ型最適化
```sql
-- 文字列長制限
ALTER TABLE buildings ALTER COLUMN title TYPE VARCHAR(200);
ALTER TABLE buildings ALTER COLUMN location TYPE VARCHAR(300);

-- 不要な精度削減
ALTER TABLE buildings ALTER COLUMN lat TYPE DECIMAL(8,6);
ALTER TABLE buildings ALTER COLUMN lng TYPE DECIMAL(9,6);
```

### Phase 3: 外部データ分離
```sql
-- 大きなテキストデータを別テーブルに
CREATE TABLE building_details (
    building_id BIGINT REFERENCES buildings(id),
    architect_details TEXT,
    description TEXT
);

-- メインテーブルから削除
ALTER TABLE buildings DROP COLUMN architect_details;
```

### Phase 4: 画像データ外部化
```sql
-- 画像は外部URL参照のみ
-- Cloudinary, AWS S3等を使用
UPDATE photos 
SET url = REPLACE(url, 'data:image', 'https://cdn.example.com/');
```

## 容量監視
```sql
-- テーブルサイズ確認
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 段階的移行計画

### Step 1: 重要データのみインポート
- 建築物基本情報
- 主要建築家情報
- 代表的な写真のみ

### Step 2: 段階的データ追加
- 詳細情報
- 追加写真
- 関連データ

### Step 3: 必要に応じてプラン変更
- Pro プラン（$25/月、8GB）
- 本格運用時