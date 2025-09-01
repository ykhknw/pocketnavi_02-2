-- Supabase建築家テーブル正規化移行スクリプト
-- 実行順序: 1. テーブル作成 → 2. データ移行 → 3. インデックス作成

-- ========================================
-- 1. 新しいテーブル構造の作成
-- ========================================

-- individual_architectsテーブル（個別建築家マスタ）
CREATE TABLE IF NOT EXISTS individual_architects (
    individual_architect_id SERIAL PRIMARY KEY,
    name_ja VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- architect_compositionsテーブル（建築家構成関係）
CREATE TABLE IF NOT EXISTS architect_compositions (
    architect_id INTEGER NOT NULL,
    individual_architect_id INTEGER NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (architect_id, individual_architect_id),
    FOREIGN KEY (individual_architect_id) REFERENCES individual_architects(individual_architect_id) ON DELETE CASCADE
);

-- ========================================
-- 2. インデックスの作成
-- ========================================

-- individual_architectsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_individual_architects_slug ON individual_architects(slug);
CREATE INDEX IF NOT EXISTS idx_individual_architects_name_ja ON individual_architects(name_ja);
CREATE INDEX IF NOT EXISTS idx_individual_architects_name_en ON individual_architects(name_en);

-- architect_compositionsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_architect_compositions_architect_id ON architect_compositions(architect_id);
CREATE INDEX IF NOT EXISTS idx_architect_compositions_individual_id ON architect_compositions(individual_architect_id);
CREATE INDEX IF NOT EXISTS idx_architect_compositions_order ON architect_compositions(order_index);

-- ========================================
-- 3. データ移行（architects_table → individual_architects）
-- ========================================

-- ユニークな建築家名を抽出してindividual_architectsに挿入
INSERT INTO individual_architects (name_ja, name_en, slug)
SELECT DISTINCT
    architectJa,
    architectEn,
    COALESCE(slug, 
        LOWER(
            REGEXP_REPLACE(
                REGEXP_REPLACE(architectJa, '[^\w\s-]', '', 'g'),
                '\s+', '-', 'g'
            )
        )
    ) as slug
FROM architects_table
WHERE architectJa IS NOT NULL AND architectJa != ''
ON CONFLICT (slug) DO NOTHING;

-- ========================================
-- 4. 構成関係データの作成（architect_compositions）
-- ========================================

-- architects_tableの各レコードをindividual_architectsとマッピング
INSERT INTO architect_compositions (architect_id, individual_architect_id, order_index)
SELECT 
    at.architect_id,
    ia.individual_architect_id,
    1 as order_index
FROM architects_table at
JOIN individual_architects ia ON (
    at.architectJa = ia.name_ja AND 
    at.architectEn = ia.name_en
)
ON CONFLICT (architect_id, individual_architect_id) DO NOTHING;

-- ========================================
-- 5. 移行結果の確認クエリ
-- ========================================

-- 移行されたデータの確認
SELECT 
    'individual_architects' as table_name,
    COUNT(*) as record_count
FROM individual_architects
UNION ALL
SELECT 
    'architect_compositions' as table_name,
    COUNT(*) as record_count
FROM architect_compositions
UNION ALL
SELECT 
    'original_architects_table' as table_name,
    COUNT(*) as record_count
FROM architects_table;

-- サンプルデータの確認
SELECT 
    'Sample individual_architects' as info,
    individual_architect_id,
    name_ja,
    name_en,
    slug
FROM individual_architects
LIMIT 5;

SELECT 
    'Sample architect_compositions' as info,
    ac.architect_id,
    ac.individual_architect_id,
    ac.order_index,
    ia.name_ja,
    ia.name_en
FROM architect_compositions ac
JOIN individual_architects ia ON ac.individual_architect_id = ia.individual_architect_id
LIMIT 5;

-- ========================================
-- 6. 移行後の検証クエリ
-- ========================================

-- 建築家情報の取得テスト（新しいテーブル構造）
SELECT 
    ac.architect_id,
    ia.name_ja,
    ia.name_en,
    ia.slug,
    ac.order_index
FROM architect_compositions ac
JOIN individual_architects ia ON ac.individual_architect_id = ia.individual_architect_id
WHERE ac.architect_id = 1; -- テスト用の建築家ID

-- 建築物の建築家情報取得テスト
SELECT 
    ba.building_id,
    ba.architect_order,
    ia.name_ja,
    ia.name_en,
    ia.slug
FROM building_architects ba
JOIN architect_compositions ac ON ba.architect_id = ac.architect_id
JOIN individual_architects ia ON ac.individual_architect_id = ia.individual_architect_id
WHERE ba.building_id = 1 -- テスト用の建築物ID
ORDER BY ba.architect_order, ac.order_index;

-- ========================================
-- 7. ロールバック用スクリプト（必要時のみ実行）
-- ========================================

/*
-- 注意: 本番環境では慎重に実行してください
DROP TABLE IF EXISTS architect_compositions;
DROP TABLE IF EXISTS individual_architects;
*/

