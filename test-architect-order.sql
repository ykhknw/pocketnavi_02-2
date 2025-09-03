-- 建築家の並び順テスト用クエリ
-- このファイルをSupabaseのSQL Editorで実行して、order_indexが正しく動作するか確認してください

-- 1. 新しいビューの動作確認
SELECT 
  building_id,
  title,
  architect_names_ja,
  architect_order_indices,
  architect_ids
FROM buildings_search_view_with_order 
WHERE architect_names_ja LIKE '%安藤忠雄%' 
LIMIT 5;

-- 2. 特定の建築物の建築家情報とorder_indexの確認
SELECT 
  b.building_id,
  b.title,
  ba.architect_id,
  ba.architect_order,
  ac.order_index,
  ia.name_ja,
  ia.name_en
FROM buildings_table_2 b
JOIN building_architects ba ON b.building_id = ba.building_id
JOIN architect_compositions ac ON ba.architect_id = ac.architect_id
JOIN individual_architects ia ON ac.individual_architect_id = ia.individual_architect_id
WHERE b.building_id = 1  -- テスト用の建築物ID
ORDER BY ac.order_index;

-- 3. architect_compositionsテーブルのorder_index分布確認
SELECT 
  architect_id,
  COUNT(*) as composition_count,
  MIN(order_index) as min_order,
  MAX(order_index) as max_order,
  array_agg(order_index ORDER BY order_index) as order_indices
FROM architect_compositions
GROUP BY architect_id
HAVING COUNT(*) > 1
ORDER BY architect_id
LIMIT 10;

-- 4. 特定のarchitect_id（例：10168）の詳細確認
SELECT 
  ac.architect_id,
  ac.order_index,
  ia.name_ja,
  ia.name_en,
  ia.individual_architect_id
FROM architect_compositions ac
JOIN individual_architects ia ON ac.individual_architect_id = ia.individual_architect_id
WHERE ac.architect_id = 10168
ORDER BY ac.order_index;

-- 5. ビューデータとテーブルデータの整合性確認
SELECT 
  b.building_id,
  b.title,
  v.architect_names_ja as view_architects,
  v.architect_order_indices as view_order,
  string_agg(ia.name_ja, ',' ORDER BY ac.order_index) as table_architects,
  array_agg(ac.order_index ORDER BY ac.order_index) as table_order
FROM buildings_table_2 b
JOIN buildings_search_view_with_order v ON b.building_id = v.building_id
LEFT JOIN building_architects ba ON b.building_id = ba.building_id
LEFT JOIN architect_compositions ac ON ba.architect_id = ac.architect_id
LEFT JOIN individual_architects ia ON ac.individual_architect_id = ia.individual_architect_id
WHERE v.architect_names_ja IS NOT NULL AND v.architect_names_ja != ''
GROUP BY b.building_id, b.title, v.architect_names_ja, v.architect_order_indices
LIMIT 5;

