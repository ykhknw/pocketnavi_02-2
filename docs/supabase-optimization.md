# PocketNavi - Supabase最適化ガイド

## 概要
PocketNaviアプリケーションのSupabaseパフォーマンス最適化のためのガイド

## 最適化の目標
- クエリ実行時間の短縮
- データベース容量の削減
- アプリケーションの応答速度向上
- コストの最適化

## データベース最適化

### 1. インデックス最適化

#### 検索用インデックス
```sql
-- 建築物検索用インデックス
CREATE INDEX idx_buildings_title ON buildings_table_2 USING gin(to_tsvector('japanese', title));
CREATE INDEX idx_buildings_architect ON buildings_table_2 USING gin(to_tsvector('japanese', architect_details));
CREATE INDEX idx_buildings_location ON buildings_table_2(lat, lng);
CREATE INDEX idx_buildings_completion_year ON buildings_table_2(completion_years);
CREATE INDEX idx_buildings_prefectures ON buildings_table_2(prefectures);
CREATE INDEX idx_buildings_areas ON buildings_table_2(areas);

-- 建築家検索用インデックス
CREATE INDEX idx_architects_name ON architects_table USING gin(to_tsvector('japanese', architectJa));
CREATE INDEX idx_architects_name_en ON architects_table USING gin(to_tsvector('english', architectEn));

-- 関連テーブル用インデックス
CREATE INDEX idx_building_architects_building ON building_architects(building_id);
CREATE INDEX idx_building_architects_architect ON building_architects(architect_id);
CREATE INDEX idx_architect_websites_architect ON architect_websites_3(architect_id);
```

#### 複合インデックス
```sql
-- 複合検索用インデックス
CREATE INDEX idx_buildings_search ON buildings_table_2(prefectures, completion_years, lat, lng);
CREATE INDEX idx_buildings_type_location ON buildings_table_2(buildingTypes, lat, lng);
```

### 2. テーブル最適化

#### データ型の最適化
```sql
-- 文字列フィールドの最適化
ALTER TABLE buildings_table_2 
ALTER COLUMN title TYPE VARCHAR(500),
ALTER COLUMN prefectures TYPE VARCHAR(100),
ALTER COLUMN areas TYPE VARCHAR(100);

-- 数値フィールドの最適化
ALTER TABLE buildings_table_2 
ALTER COLUMN completion_years TYPE SMALLINT,
ALTER COLUMN likes TYPE INTEGER;

-- 座標フィールドの最適化
ALTER TABLE buildings_table_2 
ALTER COLUMN lat TYPE DECIMAL(10, 8),
ALTER COLUMN lng TYPE DECIMAL(11, 8);
```

#### 不要データの削除
```sql
-- 空のレコード削除
DELETE FROM buildings_table_2 
WHERE title IS NULL OR title = '' OR lat IS NULL OR lng IS NULL;

-- 重複データの削除
DELETE FROM buildings_table_2 
WHERE building_id NOT IN (
  SELECT MIN(building_id) 
  FROM buildings_table_2 
  GROUP BY title, lat, lng
);
```

### 3. クエリ最適化

#### 効率的な検索クエリ
```sql
-- 全文検索の最適化
SELECT * FROM buildings_table_2 
WHERE to_tsvector('japanese', title || ' ' || architect_details) @@ plainto_tsquery('japanese', $1)
ORDER BY ts_rank(to_tsvector('japanese', title || ' ' || architect_details), plainto_tsquery('japanese', $1)) DESC;

-- 距離検索の最適化
SELECT *, 
  ST_Distance(
    ST_MakePoint(lng, lat), 
    ST_MakePoint($1, $2)
  ) as distance
FROM buildings_table_2 
WHERE ST_DWithin(
  ST_MakePoint(lng, lat), 
  ST_MakePoint($1, $2), 
  $3
)
ORDER BY distance;
```

#### ページネーション最適化
```sql
-- カーソルベースページネーション
SELECT * FROM buildings_table_2 
WHERE building_id > $1 
ORDER BY building_id 
LIMIT 10;

-- オフセットベースページネーション（小規模データ用）
SELECT * FROM buildings_table_2 
ORDER BY building_id 
LIMIT 10 OFFSET $1;
```

## アプリケーション最適化

### 1. React最適化

#### コンポーネント最適化
```typescript
// メモ化による再レンダリング防止
const BuildingCard = React.memo(({ building }: { building: Building }) => {
  return (
    <div className="building-card">
      <h3>{building.title}</h3>
      <p>{building.architectDetails}</p>
    </div>
  );
});

// カスタムフックの最適化
const useOptimizedBuildings = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchBuildings = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const result = await supabaseApi.getBuildings(page, 10);
      setBuildings(prev => [...prev, ...result.buildings]);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { buildings, loading, fetchBuildings };
};
```

#### 状態管理最適化
```typescript
// Context最適化
const AppContext = createContext<AppState | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  const memoizedState = useMemo(() => state, [state]);
  const memoizedDispatch = useCallback(dispatch, []);
  
  return (
    <AppContext.Provider value={{ state: memoizedState, dispatch: memoizedDispatch }}>
      {children}
    </AppContext.Provider>
  );
};
```

### 2. データフェッチング最適化

#### キャッシュ戦略
```typescript
// React Queryによるキャッシュ
const useBuildings = (page: number) => {
  return useQuery({
    queryKey: ['buildings', page],
    queryFn: () => supabaseApi.getBuildings(page, 10),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    cacheTime: 10 * 60 * 1000, // 10分間キャッシュ
  });
};

// プリフェッチング
const prefetchNextPage = (currentPage: number) => {
  queryClient.prefetchQuery({
    queryKey: ['buildings', currentPage + 1],
    queryFn: () => supabaseApi.getBuildings(currentPage + 1, 10),
  });
};
```

#### 遅延読み込み
```typescript
// 画像の遅延読み込み
const LazyImage = ({ src, alt, ...props }: ImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <div className="lazy-image">
      {!isLoaded && !error && <div className="skeleton" />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        style={{ display: isLoaded ? 'block' : 'none' }}
        {...props}
      />
    </div>
  );
};
```

### 3. バンドル最適化

#### コード分割
```typescript
// 動的インポートによるコード分割
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const DataMigration = lazy(() => import('./components/DataMigration'));

// ルートベースのコード分割
const BuildingDetailPage = lazy(() => import('./components/pages/BuildingDetailPage'));
const ArchitectPage = lazy(() => import('./components/pages/ArchitectPage'));
```

#### 依存関係最適化
```json
// package.json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.53.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "vite": "^5.4.2",
    "typescript": "^5.5.3"
  }
}
```

## パフォーマンス監視

### 1. メトリクス監視

#### フロントエンド監視
```typescript
// パフォーマンス監視
const usePerformanceMonitor = () => {
  useEffect(() => {
    // Core Web Vitals監視
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      });
    }
  }, []);
};

// エラー監視
const useErrorMonitor = () => {
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Application error:', error);
      // エラー報告サービスに送信
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
};
```

#### バックエンド監視
```sql
-- クエリパフォーマンス監視
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%buildings_table_2%'
ORDER BY total_time DESC;

-- インデックス使用状況監視
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'buildings_table_2';
```

### 2. ログ分析

#### エラーログ
```typescript
// 構造化ログ
const logError = (error: Error, context: string) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    stack: error.stack,
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  
  console.error('Application Error:', logEntry);
  // ログサービスに送信
};
```

#### パフォーマンスログ
```typescript
// クエリ実行時間監視
const measureQueryTime = async <T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await queryFn();
    const end = performance.now();
    
    console.log(`${queryName} executed in ${end - start}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`${queryName} failed after ${end - start}ms:`, error);
    throw error;
  }
};
```

## コスト最適化

### 1. データベースコスト

#### ストレージ最適化
```sql
-- テーブル圧縮
ALTER TABLE buildings_table_2 SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- 不要なデータ削除
DELETE FROM buildings_table_2 
WHERE created_at < NOW() - INTERVAL '1 year'
AND likes = 0;
```

#### クエリ最適化
```sql
-- 効率的な集計クエリ
SELECT 
  prefectures,
  COUNT(*) as building_count,
  AVG(completion_years) as avg_completion_year
FROM buildings_table_2 
GROUP BY prefectures
HAVING COUNT(*) > 10;
```

### 2. 外部APIコスト

#### 画像API最適化
```typescript
// 画像キャッシュ戦略
const useImageCache = () => {
  const cache = useMemo(() => new Map<string, string>(), []);
  
  const getImage = useCallback(async (query: string) => {
    if (cache.has(query)) {
      return cache.get(query);
    }
    
    const imageUrl = await fetchImageFromAPI(query);
    cache.set(query, imageUrl);
    return imageUrl;
  }, [cache]);
  
  return { getImage };
};
```

## 最適化チェックリスト

### データベース最適化
- [ ] 適切なインデックスが作成されている
- [ ] 不要なデータが削除されている
- [ ] クエリが最適化されている
- [ ] テーブル構造が最適化されている

### アプリケーション最適化
- [ ] React.memoが適切に使用されている
- [ ] useMemo/useCallbackが適切に使用されている
- [ ] コード分割が実装されている
- [ ] 画像の遅延読み込みが実装されている

### パフォーマンス監視
- [ ] Core Web Vitalsが監視されている
- [ ] エラーログが記録されている
- [ ] クエリパフォーマンスが監視されている
- [ ] ユーザー体験が測定されている

### コスト最適化
- [ ] データベースストレージが最適化されている
- [ ] 外部APIコストが最適化されている
- [ ] 不要なリソースが削除されている
- [ ] 効率的なキャッシュ戦略が実装されている

---

**最終更新**: 2024年12月19日  
**バージョン**: 2.2.0  
**プロジェクト**: PocketNavi