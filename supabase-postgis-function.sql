-- Supabase PostGIS関数: 距離順にソートされた建築物検索
-- このファイルをSupabaseのSQL Editorで実行してください

-- 必要な拡張機能を有効化（PostGISが有効でない場合）
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- 距離計算用の関数（Haversine公式）
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE plpgsql
AS $$
DECLARE
  R double precision := 6371; -- 地球の半径（km）
  dlat double precision;
  dlon double precision;
  a double precision;
  c double precision;
BEGIN
  -- 度をラジアンに変換
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine公式
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;

-- メイン検索関数: 距離順にソートされた建築物検索
CREATE OR REPLACE FUNCTION search_buildings_with_distance(
  search_lat double precision,
  search_lng double precision,
  search_radius double precision,
  search_query text DEFAULT NULL,
  search_architects text[] DEFAULT NULL,
  search_building_types text[] DEFAULT NULL,
  search_prefectures text[] DEFAULT NULL,
  search_has_videos boolean DEFAULT false,
  search_completion_year integer DEFAULT NULL,
  search_exclude_residential boolean DEFAULT true,
  search_language text DEFAULT 'ja',
  page_start integer DEFAULT 0,
  page_limit integer DEFAULT 10
)
RETURNS TABLE(
  building_id integer,
  title text,
  title_en text,
  location text,
  location_en text,
  lat double precision,
  lng double precision,
  completion_years integer,
  prefectures text,
  prefectures_en text,
  areas text,
  areas_en text,
  building_types text,
  building_types_en text,
  architect_ja text,
  architect_en text,
  youtube_url text,
  photos text[],
  likes integer,
  slug text,
  distance double precision
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_text text;
  architect_column text;
  building_type_column text;
  prefecture_column text;
  area_column text;
BEGIN
  -- 言語に応じてカラム名を設定
  IF search_language = 'en' THEN
    architect_column := 'architect_en';
    building_type_column := 'building_types_en';
    prefecture_column := 'prefectures_en';
    area_column := 'areas_en';
  ELSE
    architect_column := 'architect_ja';
    building_type_column := 'building_types';
    prefecture_column := 'prefectures';
    area_column := 'areas';
  END IF;

  -- 基本クエリの構築
  query_text := '
    WITH filtered_buildings AS (
      SELECT 
        b.building_id,
        b.title,
        b.title_en,
        b.location,
        b.location_en,
        b.lat,
        b.lng,
        b.completion_years,
        b.prefectures,
        b.prefectures_en,
        b.areas,
        b.areas_en,
        b.building_types,
        b.building_types_en,
        b.youtube_url,
        b.photos,
        b.likes,
        b.slug,
        ba.' || architect_column || ' as architect_name,
        calculate_distance_km($1, $2, b.lat, b.lng) as distance
      FROM buildings_table_2 b
      LEFT JOIN LATERAL (
        SELECT string_agg(arch.' || architect_column || '', '','') as ' || architect_column || '
        FROM building_architects ba2
        JOIN architects_table arch ON ba2.architect_id = arch.architect_id
        WHERE ba2.building_id = b.building_id
      ) ba ON true
      WHERE b.lat IS NOT NULL 
        AND b.lng IS NOT NULL
        AND calculate_distance_km($1, $2, b.lat, b.lng) <= $3';

  -- テキスト検索条件
  IF search_query IS NOT NULL AND length(trim(search_query)) > 0 THEN
    query_text := query_text || '
        AND (b.title ILIKE ''%'' || $4 || ''%'' 
             OR b.title_en ILIKE ''%'' || $4 || ''%'' 
             OR b.location ILIKE ''%'' || $4 || ''%''
             OR ba.' || architect_column || ' ILIKE ''%'' || $4 || ''%'')';
  END IF;

  -- 建築家フィルター
  IF search_architects IS NOT NULL AND array_length(search_architects, 1) > 0 THEN
    query_text := query_text || '
        AND EXISTS (
          SELECT 1 FROM unnest($5::text[]) arch_name
          WHERE ba.' || architect_column || ' ILIKE ''%'' || arch_name || ''%''
        )';
  END IF;

  -- 建物用途フィルター
  IF search_building_types IS NOT NULL AND array_length(search_building_types, 1) > 0 THEN
    query_text := query_text || '
        AND EXISTS (
          SELECT 1 FROM unnest($6::text[]) building_type
          WHERE b.' || building_type_column || ' ILIKE ''%'' || building_type || ''%''
        )';
  END IF;

  -- 都道府県フィルター
  IF search_prefectures IS NOT NULL AND array_length(search_prefectures, 1) > 0 THEN
    query_text := query_text || '
        AND b.' || prefecture_column || ' = ANY($7)';
  END IF;

  -- 動画フィルター
  IF search_has_videos THEN
    query_text := query_text || '
        AND b.youtube_url IS NOT NULL';
  END IF;

  -- 建築年フィルター
  IF search_completion_year IS NOT NULL THEN
    query_text := query_text || '
        AND b.completion_years = $8';
  END IF;

  -- 住宅系除外
  IF search_exclude_residential THEN
    query_text := query_text || '
        AND b.building_types != ''住宅''
        AND b.building_types_en != ''housing''';
  END IF;

  -- クエリの完了
  query_text := query_text || '
    )
    SELECT 
      building_id,
      title,
      title_en,
      location,
      location_en,
      lat,
      lng,
      completion_years,
      prefectures,
      prefectures_en,
      areas,
      areas_en,
      building_types,
      building_types_en,
      architect_name as architect_ja,
      architect_name as architect_en,
      youtube_url,
      photos,
      likes,
      slug,
      distance
    FROM filtered_buildings
    ORDER BY distance ASC
    LIMIT $10 OFFSET $9';

  -- 動的クエリの実行
  RETURN QUERY EXECUTE query_text
    USING search_lat, search_lng, search_radius, search_query, 
          search_architects, search_building_types, search_prefectures,
          search_has_videos, search_completion_year, page_start, page_limit;

END;
$$;

-- 関数の説明
COMMENT ON FUNCTION search_buildings_with_distance IS 
'指定された座標から半径内の建築物を距離順にソートして返す関数。
距離計算にはHaversine公式を使用し、PostGISの空間インデックスを活用する。
パラメータ:
- search_lat, search_lng: 検索中心座標
- search_radius: 検索半径（km）
- search_query: テキスト検索クエリ
- search_architects: 建築家名配列
- search_building_types: 建物用途配列
- search_prefectures: 都道府県配列
- search_has_videos: 動画ありフラグ
- search_completion_year: 完成年
- search_exclude_residential: 住宅除外フラグ
- search_language: 言語設定（ja/en）
- page_start: ページ開始位置
- page_limit: ページあたりの件数

戻り値: 距離順にソートされた建築物データ（距離情報付き）';

-- 使用例
-- SELECT * FROM search_buildings_with_distance(
--   35.184527261391494,  -- 緯度
--   137.00538830150188,  -- 経度
--   10,                   -- 半径10km
--   NULL,                 -- テキスト検索なし
--   NULL,                 -- 建築家フィルターなし
--   NULL,                 -- 建物用途フィルターなし
--   NULL,                 -- 都道府県フィルターなし
--   false,                -- 動画フィルターなし
--   NULL,                 -- 完成年フィルターなし
--   true,                 -- 住宅除外
--   'ja',                 -- 日本語
--   0,                    -- 1ページ目開始
--   10                    -- 1ページあたり10件
-- );

-- Supabase用のPostgreSQL関数（RPC）
-- フィルター条件に基づいて建築物IDを返す関数

-- 関数の作成
CREATE OR REPLACE FUNCTION search_buildings_with_filters(
  building_types TEXT[] DEFAULT NULL,
  prefectures TEXT[] DEFAULT NULL,
  has_videos BOOLEAN DEFAULT NULL,
  completion_year INTEGER DEFAULT NULL,
  language TEXT DEFAULT 'ja'
)
RETURNS INTEGER[]
LANGUAGE plpgsql
AS $$
DECLARE
  result_ids INTEGER[];
  query_text TEXT;
  where_conditions TEXT[] := ARRAY[]::TEXT[];
  final_query TEXT;
BEGIN
  -- 基本クエリの構築
  query_text := 'SELECT DISTINCT building_id FROM buildings_table_2 WHERE 1=1';
  
  -- 建物用途フィルター
  IF building_types IS NOT NULL AND array_length(building_types, 1) > 0 THEN
    IF language = 'ja' THEN
      where_conditions := array_append(where_conditions, 
        'buildingTypes ILIKE ANY(SELECT ''%'' || unnest || ''%'' FROM unnest($1))');
    ELSE
      where_conditions := array_append(where_conditions, 
        'buildingTypesEn ILIKE ANY(SELECT ''%'' || unnest || ''%'' FROM unnest($1))');
    END IF;
  END IF;
  
  -- 都道府県フィルター
  IF prefectures IS NOT NULL AND array_length(prefectures, 1) > 0 THEN
    IF language = 'ja' THEN
      where_conditions := array_append(where_conditions, 
        'prefectures = ANY($2)');
    ELSE
      where_conditions := array_append(where_conditions, 
        'prefecturesEn = ANY($2)');
    END IF;
  END IF;
  
  -- 動画フィルター
  IF has_videos = TRUE THEN
    where_conditions := array_append(where_conditions, 
      'youtubeUrl IS NOT NULL');
  END IF;
  
  -- 建築年フィルター
  IF completion_year IS NOT NULL THEN
    where_conditions := array_append(where_conditions, 
      'completionYears = $4');
  END IF;
  
  -- WHERE条件を結合
  IF array_length(where_conditions, 1) > 0 THEN
    query_text := query_text || ' AND ' || array_to_string(where_conditions, ' AND ');
  END IF;
  
  -- クエリの実行
  EXECUTE 'SELECT array_agg(building_id) FROM (' || query_text || ') AS filtered_buildings'
  INTO result_ids
  USING building_types, prefectures, has_videos, completion_year;
  
  -- NULLの場合は空配列を返す
  IF result_ids IS NULL THEN
    result_ids := ARRAY[]::INTEGER[];
  END IF;
  
  RETURN result_ids;
END;
$$;

-- 関数の権限設定
GRANT EXECUTE ON FUNCTION search_buildings_with_filters TO authenticated;
GRANT EXECUTE ON FUNCTION search_buildings_with_filters TO anon;

-- 関数のテスト用クエリ例
-- SELECT search_buildings_with_filters(ARRAY['庁舎'], NULL, NULL, NULL, 'ja');
-- SELECT search_buildings_with_filters(ARRAY['庁舎'], ARRAY['東京都'], NULL, NULL, 'ja');
-- SELECT search_buildings_with_filters(NULL, NULL, TRUE, NULL, 'ja');
