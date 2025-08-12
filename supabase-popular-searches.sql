-- 全ユーザーの検索履歴を保存するテーブル
CREATE TABLE IF NOT EXISTS global_search_history (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('text', 'architect', 'prefecture')),
  user_id BIGINT, -- 匿名ユーザーはNULL
  user_session_id TEXT, -- セッション識別用（匿名ユーザー向け）
  filters JSONB, -- フィルター情報
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_global_search_history_query ON global_search_history(query);
CREATE INDEX IF NOT EXISTS idx_global_search_history_type ON global_search_history(search_type);
CREATE INDEX IF NOT EXISTS idx_global_search_history_searched_at ON global_search_history(searched_at);
CREATE INDEX IF NOT EXISTS idx_global_search_history_user_session ON global_search_history(user_session_id);

-- 人気検索の集計ビュー（過去30日間）
CREATE OR REPLACE VIEW popular_searches_view AS
SELECT 
  query,
  search_type,
  COUNT(*) as total_searches,
  COUNT(DISTINCT COALESCE(user_id, user_session_id)) as unique_users,
  MAX(searched_at) as last_searched,
  AVG(EXTRACT(EPOCH FROM (NOW() - searched_at))/3600) as hours_since_last_search
FROM global_search_history
WHERE searched_at >= NOW() - INTERVAL '30 days'
GROUP BY query, search_type
HAVING COUNT(*) >= 2 -- 最低2回以上の検索のみ
ORDER BY 
  total_searches DESC, 
  unique_users DESC,
  hours_since_last_search ASC; -- 最近検索されたものを優先

-- 人気検索の集計関数（過去7日間）
CREATE OR REPLACE FUNCTION get_popular_searches(days INTEGER DEFAULT 7)
RETURNS TABLE (
  query TEXT,
  search_type VARCHAR(20),
  total_searches BIGINT,
  unique_users BIGINT,
  last_searched TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gsh.query,
    gsh.search_type,
    COUNT(*) as total_searches,
    COUNT(DISTINCT COALESCE(gsh.user_id, gsh.user_session_id)) as unique_users,
    MAX(gsh.searched_at) as last_searched
  FROM global_search_history gsh
  WHERE gsh.searched_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY gsh.query, gsh.search_type
  HAVING COUNT(*) >= 2
  ORDER BY 
    total_searches DESC, 
    unique_users DESC,
    last_searched DESC
  LIMIT 8;
END;
$$ LANGUAGE plpgsql;

-- サンプルデータの挿入（テスト用）
INSERT INTO global_search_history (query, search_type, user_session_id, filters) VALUES
('安藤忠雄', 'text', 'session_001', '{"query": "安藤忠雄"}'),
('安藤忠雄', 'text', 'session_002', '{"query": "安藤忠雄"}'),
('安藤忠雄', 'text', 'session_003', '{"query": "安藤忠雄"}'),
('美術館', 'text', 'session_001', '{"query": "美術館"}'),
('美術館', 'text', 'session_004', '{"query": "美術館"}'),
('東京', 'text', 'session_002', '{"query": "東京"}'),
('東京', 'text', 'session_005', '{"query": "東京"}'),
('現代建築', 'text', 'session_003', '{"query": "現代建築"}'),
('コンクリート', 'text', 'session_001', '{"query": "コンクリート"}'),
('隈研吾', 'architect', 'session_002', '{"architects": ["隈研吾"]}'),
('隈研吾', 'architect', 'session_004', '{"architects": ["隈研吾"]}'),
('図書館', 'text', 'session_003', '{"query": "図書館"}'),
('駅舎', 'text', 'session_005', '{"query": "駅舎"}'),
('大阪', 'prefecture', 'session_001', '{"prefectures": ["大阪"]}'),
('大阪', 'prefecture', 'session_002', '{"prefectures": ["大阪"]}'),
('京都', 'prefecture', 'session_003', '{"prefectures": ["京都"]}'),
('京都', 'prefecture', 'session_004', '{"prefectures": ["京都"]}'),
('京都', 'prefecture', 'session_005', '{"prefectures": ["京都"]}');

-- 人気検索の確認
SELECT * FROM get_popular_searches(30);
