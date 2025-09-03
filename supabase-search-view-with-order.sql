-- Supabase検索用ビューの作成（order_index対応版）
-- このファイルをSupabaseのSQL Editorで実行してください

-- 1. 建築物検索用ビューの作成（新しいテーブル構造対応）
CREATE OR REPLACE VIEW buildings_search_view_with_order AS
SELECT 
  b.building_id,
  b.uid,
  b.title,
  b.titleEn,
  b.thumbnailUrl,
  b.youtubeUrl,
  b.completionYears,
  b.buildingTypes,
  b.buildingTypesEn,
  b.prefectures,
  b.prefecturesEn,
  b.areas,
  b.areasEn,
  b.location,
  b.locationEn_from_datasheetChunkEn,
  b.lat,
  b.lng,
  b.likes,
  b.created_at,
  b.updated_at,
  b.slug,
  -- 建築家情報をorder_index順で集約
  COALESCE(
    string_agg(ia.name_ja, ',' ORDER BY ac.order_index) FILTER (WHERE ia.name_ja IS NOT NULL), 
    ''
  ) as architect_names_ja,
  COALESCE(
    string_agg(ia.name_en, ',' ORDER BY ac.order_index) FILTER (WHERE ia.name_en IS NOT NULL), 
    ''
  ) as architect_names_en,
  -- 建築家IDの配列（order_index順）
  array_agg(ba.architect_id ORDER BY ac.order_index) FILTER (WHERE ba.architect_id IS NOT NULL) as architect_ids,
  -- order_indexの配列（並び順の保証用）
  array_agg(ac.order_index ORDER BY ac.order_index) FILTER (WHERE ac.order_index IS NOT NULL) as architect_order_indices
FROM buildings_table_2 b
LEFT JOIN building_architects ba ON b.building_id = ba.building_id
LEFT JOIN architect_compositions ac ON ba.architect_id = ac.architect_id
LEFT JOIN individual_architects ia ON ac.individual_architect_id = ia.individual_architect_id
GROUP BY b.building_id, b.uid, b.title, b.titleEn, b.thumbnailUrl, b.youtubeUrl, 
         b.completionYears, b.buildingTypes, b.buildingTypesEn, b.prefectures, 
         b.prefecturesEn, b.areas, b.areasEn, b.location, b.locationEn_from_datasheetChunkEn, 
         b.lat, b.lng, b.likes, b.created_at, b.updated_at, b.slug;

-- 2. ビューの権限設定
GRANT SELECT ON buildings_search_view_with_order TO authenticated;
GRANT SELECT ON buildings_search_view_with_order TO anon;

-- 3. 検索用インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_buildings_search_view_order_building_types 
ON buildings_table_2 USING gin(to_tsvector('japanese', buildingTypes));

CREATE INDEX IF NOT EXISTS idx_buildings_search_view_order_building_types_en 
ON buildings_table_2 USING gin(to_tsvector('english', buildingTypesEn));

CREATE INDEX IF NOT EXISTS idx_buildings_search_view_order_prefectures 
ON buildings_table_2(prefectures);

CREATE INDEX IF NOT EXISTS idx_buildings_search_view_order_prefectures_en 
ON buildings_table_2(prefecturesEn);

CREATE INDEX IF NOT EXISTS idx_buildings_search_view_order_completion_years 
ON buildings_table_2(completionYears);

CREATE INDEX IF NOT EXISTS idx_buildings_search_view_order_youtube_url 
ON buildings_table_2(youtubeUrl) WHERE youtubeUrl IS NOT NULL;

-- 4. architect_compositionsテーブルのorder_index用インデックス
CREATE INDEX IF NOT EXISTS idx_architect_compositions_order_index 
ON architect_compositions(order_index);

CREATE INDEX IF NOT EXISTS idx_architect_compositions_architect_id 
ON architect_compositions(architect_id);

-- 5. ビューの動作確認用クエリ例
-- 建物用途フィルターのテスト
-- SELECT COUNT(*) FROM buildings_search_view_with_order WHERE buildingTypes ILIKE '%庁舎%';

-- 都道府県フィルターのテスト
-- SELECT COUNT(*) FROM buildings_search_view_with_order WHERE prefectures = '東京都';

-- 動画フィルターのテスト
-- SELECT COUNT(*) FROM buildings_search_view_with_order WHERE youtubeUrl IS NOT NULL;

-- 建築年フィルターのテスト
-- SELECT COUNT(*) FROM buildings_search_view_with_order WHERE completionYears = 2020;

-- 建築家の並び順確認
-- SELECT building_id, title, architect_names_ja, architect_order_indices 
-- FROM buildings_search_view_with_order 
-- WHERE architect_names_ja LIKE '%安藤忠雄%' 
-- LIMIT 5;

-- 複合フィルターのテスト
-- SELECT COUNT(*) FROM buildings_search_view_with_order 
-- WHERE buildingTypes ILIKE '%庁舎%' 
--   AND prefectures = '東京都' 
--   AND youtubeUrl IS NOT NULL;

