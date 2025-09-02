-- Supabase検索用ビューの作成
-- このファイルをSupabaseのSQL Editorで実行してください

-- 1. 建築物検索用ビューの作成
CREATE OR REPLACE VIEW buildings_search_view AS
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
  -- 建築家情報を集約
  COALESCE(
    string_agg(DISTINCT a.architectJa, ',') FILTER (WHERE a.architectJa IS NOT NULL), 
    ''
  ) as architect_names_ja,
  COALESCE(
    string_agg(DISTINCT a.architectEn, ',') FILTER (WHERE a.architectEn IS NOT NULL), 
    ''
  ) as architect_names_en,
  -- 建築家IDの配列
  array_agg(DISTINCT a.architect_id) FILTER (WHERE a.architect_id IS NOT NULL) as architect_ids
FROM buildings_table_2 b
LEFT JOIN building_architects ba ON b.building_id = ba.building_id
LEFT JOIN architects_table a ON ba.architect_id = a.architect_id
GROUP BY b.building_id, b.uid, b.title, b.titleEn, b.thumbnailUrl, b.youtubeUrl, 
         b.completionYears, b.buildingTypes, b.buildingTypesEn, b.prefectures, 
         b.prefecturesEn, b.areas, b.areasEn, b.location, b.locationEn_from_datasheetChunkEn, b.lat, b.lng, b.likes, 
         b.created_at, b.updated_at;

-- 2. ビューの権限設定
GRANT SELECT ON buildings_search_view TO authenticated;
GRANT SELECT ON buildings_search_view TO anon;

-- 3. 検索用インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_buildings_search_view_building_types 
ON buildings_table_2 USING gin(to_tsvector('japanese', buildingTypes));

CREATE INDEX IF NOT EXISTS idx_buildings_search_view_building_types_en 
ON buildings_table_2 USING gin(to_tsvector('english', buildingTypesEn));

CREATE INDEX IF NOT EXISTS idx_buildings_search_view_prefectures 
ON buildings_table_2(prefectures);

CREATE INDEX IF NOT EXISTS idx_buildings_search_view_prefectures_en 
ON buildings_table_2(prefecturesEn);

CREATE INDEX IF NOT EXISTS idx_buildings_search_view_completion_years 
ON buildings_table_2(completionYears);

CREATE INDEX IF NOT EXISTS idx_buildings_search_view_youtube_url 
ON buildings_table_2(youtubeUrl) WHERE youtubeUrl IS NOT NULL;

-- 4. ビューの動作確認用クエリ例
-- 建物用途フィルターのテスト
-- SELECT COUNT(*) FROM buildings_search_view WHERE buildingTypes ILIKE '%庁舎%';

-- 都道府県フィルターのテスト
-- SELECT COUNT(*) FROM buildings_search_view WHERE prefectures = '東京都';

-- 動画フィルターのテスト
-- SELECT COUNT(*) FROM buildings_search_view WHERE youtubeUrl IS NOT NULL;

-- 建築年フィルターのテスト
-- SELECT COUNT(*) FROM buildings_search_view WHERE completionYears = 2020;

-- 複合フィルターのテスト
-- SELECT COUNT(*) FROM buildings_search_view 
-- WHERE buildingTypes ILIKE '%庁舎%' 
--   AND prefectures = '東京都' 
--   AND youtubeUrl IS NOT NULL;
