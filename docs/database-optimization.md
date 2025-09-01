# PocketNavi - データベース最適化ガイド

## 概要
PocketNaviアプリケーションのSupabaseデータベース最適化のための包括的なガイド

## 最適化の目標
- クエリ実行時間の短縮（目標: 100ms以下）
- データベース容量の削減（目標: 30%削減）
- インデックス効率の向上
- コストの最適化

## テーブル構造最適化

### 1. メインテーブル（buildings_table_2）

#### 現在の構造
```sql
CREATE TABLE buildings_table_2 (
  building_id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE,
  title VARCHAR(500),
  titleEn VARCHAR(500),
  thumbnailUrl TEXT,
  youtubeUrl TEXT,
  completionYears SMALLINT,
  parentBuildingTypes TEXT,
  buildingTypes TEXT,
  parentStructures TEXT,
  structures TEXT,
  prefectures VARCHAR(100),
  areas VARCHAR(100),
  location TEXT,
  locationEn_from_datasheetChunkEn TEXT,
  buildingTypesEn TEXT,
  architectDetails TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 最適化提案
```sql
-- 不要なカラムの削除
ALTER TABLE buildings_table_2 DROP COLUMN IF EXISTS locationEn_from_datasheetChunkEn;

-- データ型の最適化
ALTER TABLE buildings_table_2 
ALTER COLUMN completionYears TYPE SMALLINT,
ALTER COLUMN likes TYPE INTEGER,
ALTER COLUMN lat TYPE DECIMAL(10, 8),
ALTER COLUMN lng TYPE DECIMAL(11, 8);

-- 制約の追加
ALTER TABLE buildings_table_2 
ADD CONSTRAINT chk_completion_years CHECK (completionYears >= 1800 AND completionYears <= 2030),
ADD CONSTRAINT chk_coordinates CHECK (lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180);
```

### 2. 建築家テーブル（architects_table）

#### 最適化
```sql
-- インデックスの追加
CREATE INDEX idx_architects_name_ja ON architects_table(architectJa);
CREATE INDEX idx_architects_name_en ON architects_table(architectEn);

-- 全文検索インデックス
CREATE INDEX idx_architects_search ON architects_table 
USING gin(to_tsvector('japanese', architectJa || ' ' || architectEn));
```

### 3. 関連テーブル最適化

#### building_architects
```sql
-- 複合インデックス
CREATE INDEX idx_building_architects_composite ON building_architects(building_id, architect_id);

-- 外部キー制約
ALTER TABLE building_architects 
ADD CONSTRAINT fk_building_architects_building 
FOREIGN KEY (building_id) REFERENCES buildings_table_2(building_id) ON DELETE CASCADE;

ALTER TABLE building_architects 
ADD CONSTRAINT fk_building_architects_architect 
FOREIGN KEY (architect_id) REFERENCES architects_table(architect_id) ON DELETE CASCADE;
```

## インデックス戦略

### 1. 検索用インデックス

#### 全文検索インデックス
```sql
-- 日本語全文検索
CREATE INDEX idx_buildings_fulltext_ja ON buildings_table_2 
USING gin(to_tsvector('japanese', title || ' ' || architectDetails));

-- 英語全文検索
CREATE INDEX idx_buildings_fulltext_en ON buildings_table_2 
USING gin(to_tsvector('english', titleEn || ' ' || architectDetails));
```

#### 地理空間インデックス
```sql
-- PostGIS拡張の有効化
CREATE EXTENSION IF NOT EXISTS postgis;

-- 地理空間インデックス
CREATE INDEX idx_buildings_geom ON buildings_table_2 
USING gist(ST_SetSRID(ST_MakePoint(lng, lat), 4326));
```

#### 複合インデックス
```sql
-- 地域・年・座標の複合インデックス
CREATE INDEX idx_buildings_location_year ON buildings_table_2(prefectures, completionYears, lat, lng);

-- 建物タイプ・地域の複合インデックス
CREATE INDEX idx_buildings_type_area ON buildings_table_2(buildingTypes, areas, lat, lng);
```

### 2. パフォーマンス監視用インデックス

#### 使用状況監視
```sql
-- インデックス使用状況の確認
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE tablename = 'buildings_table_2'
ORDER BY idx_scan DESC;
```

## クエリ最適化

### 1. 検索クエリの最適化

#### 全文検索クエリ
```sql
-- 最適化された全文検索
SELECT 
  building_id,
  title,
  architectDetails,
  lat,
  lng,
  ts_rank(to_tsvector('japanese', title || ' ' || architectDetails), plainto_tsquery('japanese', $1)) as rank
FROM buildings_table_2 
WHERE to_tsvector('japanese', title || ' ' || architectDetails) @@ plainto_tsquery('japanese', $1)
ORDER BY rank DESC
LIMIT 20;
```

#### 距離検索クエリ
```sql
-- PostGISを使用した距離検索
SELECT 
  building_id,
  title,
  lat,
  lng,
  ST_Distance(
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    ST_SetSRID(ST_MakePoint($1, $2), 4326)
  ) as distance
FROM buildings_table_2 
WHERE ST_DWithin(
  ST_SetSRID(ST_MakePoint(lng, lat), 4326),
  ST_SetSRID(ST_MakePoint($1, $2), 4326),
  $3
)
ORDER BY distance
LIMIT 50;
```

### 2. 集計クエリの最適化

#### 統計情報クエリ
```sql
-- 地域別建築物数
SELECT 
  prefectures,
  COUNT(*) as building_count,
  AVG(completionYears) as avg_completion_year,
  MAX(completionYears) as latest_building,
  MIN(completionYears) as oldest_building
FROM buildings_table_2 
WHERE prefectures IS NOT NULL
GROUP BY prefectures
HAVING COUNT(*) > 5
ORDER BY building_count DESC;
```

#### 建築家別統計
```sql
SELECT 
  a.architectJa,
  COUNT(b.building_id) as building_count,
  AVG(b.completionYears) as avg_completion_year
FROM architects_table a
JOIN building_architects ba ON a.architect_id = ba.architect_id
JOIN buildings_table_2 b ON ba.building_id = b.building_id
GROUP BY a.architect_id, a.architectJa
HAVING COUNT(b.building_id) > 1
ORDER BY building_count DESC;
```

## データクレンジング

### 1. 重複データの削除

#### 重複建築物の特定と削除
```sql
-- 重複データの特定
WITH duplicates AS (
  SELECT 
    building_id,
    title,
    lat,
    lng,
    ROW_NUMBER() OVER (
      PARTITION BY title, lat, lng 
      ORDER BY building_id
    ) as rn
  FROM buildings_table_2
  WHERE title IS NOT NULL AND lat IS NOT NULL AND lng IS NOT NULL
)
DELETE FROM buildings_table_2 
WHERE building_id IN (
  SELECT building_id 
  FROM duplicates 
  WHERE rn > 1
);
```

#### 空データの削除
```sql
-- 必須フィールドが空のレコード削除
DELETE FROM buildings_table_2 
WHERE title IS NULL OR title = '' 
   OR lat IS NULL OR lng IS NULL;
```

### 2. データ整合性の確保

#### 座標データの検証
```sql
-- 日本国内の座標範囲チェック
UPDATE buildings_table_2 
SET lat = NULL, lng = NULL
WHERE lat < 24 OR lat > 46 OR lng < 122 OR lng > 154;
```

#### 年号データの正規化
```sql
-- 完成年の正規化
UPDATE buildings_table_2 
SET completionYears = NULL
WHERE completionYears < 1800 OR completionYears > 2030;
```

## パフォーマンス監視

### 1. クエリパフォーマンス監視

#### 実行計画の分析
```sql
-- クエリの実行計画確認
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM buildings_table_2 
WHERE title ILIKE '%建築%' 
LIMIT 10;
```

#### スロークエリの特定
```sql
-- スロークエリの特定
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows,
  total_time / calls as avg_time_per_call
FROM pg_stat_statements 
WHERE query LIKE '%buildings_table_2%'
  AND mean_time > 100
ORDER BY mean_time DESC;
```

### 2. テーブル統計情報の更新

#### 統計情報の更新
```sql
-- 統計情報の手動更新
ANALYZE buildings_table_2;
ANALYZE architects_table;
ANALYZE building_architects;
ANALYZE architect_websites_3;
```

#### テーブルサイズの監視
```sql
-- テーブルサイズの確認
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 最適化チェックリスト

### インデックス最適化
- [ ] 全文検索インデックスが作成されている
- [ ] 地理空間インデックスが作成されている
- [ ] 複合インデックスが適切に設定されている
- [ ] 不要なインデックスが削除されている

### データクレンジング
- [ ] 重複データが削除されている
- [ ] 空データが削除されている
- [ ] 座標データが正規化されている
- [ ] 年号データが正規化されている

### クエリ最適化
- [ ] 全文検索クエリが最適化されている
- [ ] 距離検索クエリが最適化されている
- [ ] 集計クエリが最適化されている
- [ ] ページネーションが最適化されている

### パフォーマンス監視
- [ ] クエリパフォーマンスが監視されている
- [ ] 統計情報が定期的に更新されている
- [ ] テーブルサイズが監視されている
- [ ] スロークエリが特定されている

## 定期メンテナンス

### 1. 週次メンテナンス
```sql
-- 統計情報の更新
ANALYZE buildings_table_2;
ANALYZE architects_table;

-- ログの確認
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%buildings_table_2%'
ORDER BY total_time DESC
LIMIT 10;
```

### 2. 月次メンテナンス
```sql
-- インデックスの再構築
REINDEX INDEX CONCURRENTLY idx_buildings_fulltext_ja;
REINDEX INDEX CONCURRENTLY idx_buildings_location_year;

-- テーブルの最適化
VACUUM ANALYZE buildings_table_2;
VACUUM ANALYZE architects_table;
```

### 3. 四半期メンテナンス
```sql
-- 全体的な最適化
REINDEX DATABASE your_database_name;
VACUUM FULL buildings_table_2;
VACUUM FULL architects_table;
```

---

**最終更新**: 2024年12月19日  
**バージョン**: 2.2.0  
**プロジェクト**: PocketNavi