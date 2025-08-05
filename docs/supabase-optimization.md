# Supabase容量最適化戦略

## データ最適化

### 1. 文字列フィールドの最適化
```sql
-- 長い説明文は別テーブルに分離
CREATE TABLE building_details (
    building_id BIGINT REFERENCES buildings(id),
    architect_details TEXT,
    description TEXT
);

-- メインテーブルは必須項目のみ
ALTER TABLE buildings DROP COLUMN architect_details;
```

### 2. 画像・動画の外部化
```sql
-- 画像URLのみ保存（実際の画像はCloudinary等）
CREATE TABLE photos (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT REFERENCES buildings(id),
    cloudinary_url TEXT NOT NULL,  -- 外部URL
    thumbnail_url TEXT NOT NULL,   -- 外部URL
    likes INTEGER DEFAULT 0
);
```

### 3. インデックス最適化
```sql
-- 必要最小限のインデックスのみ作成
CREATE INDEX idx_buildings_location ON buildings(prefectures, areas);
CREATE INDEX idx_buildings_completion ON buildings(completion_years);
-- 不要なインデックスは削除
```

## API呼び出し最適化

### 1. フロントエンドキャッシュ
```typescript
// React Query使用例
import { useQuery } from '@tanstack/react-query';

const useBuildings = () => {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: fetchBuildings,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    cacheTime: 10 * 60 * 1000, // 10分間保持
  });
};
```

### 2. ページネーション
```typescript
// 大量データの分割取得
const { data, fetchNextPage } = useInfiniteQuery({
  queryKey: ['buildings'],
  queryFn: ({ pageParam = 0 }) => 
    supabase
      .from('buildings')
      .select('*')
      .range(pageParam, pageParam + 19), // 20件ずつ
  getNextPageParam: (lastPage, pages) => 
    lastPage.length === 20 ? pages.length * 20 : undefined,
});
```

### 3. 選択的データ取得
```typescript
// 必要なフィールドのみ取得
const { data } = await supabase
  .from('buildings')
  .select('id, title, title_en, lat, lng, likes') // 必要最小限
  .limit(20);
```

## 段階的スケーリング計画

### Phase 1: 無料プラン（現在）
- データ: 500MB以下
- API: 50万回/月以下
- 対象: MVP・個人利用

### Phase 2: Pro プラン（$25/月）
- データ: 8GB
- API: 500万回/月
- 対象: 小規模商用

### Phase 3: 外部移行
- 自前サーバー
- 他のDBaaS
- 対象: 大規模商用