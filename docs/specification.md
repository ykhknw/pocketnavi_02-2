# 建築作品データベース 仕様書

## 1. プロジェクト概要

### 1.1 プロジェクト名
建築作品データベース (Architectural Works Database)

### 1.2 バージョン
2.2.0

### 1.3 概要
現代建築の作品を検索・閲覧できるWebアプリケーション。建築家、建物タイプ、地域などでフィルタリングが可能で、地図上での位置確認もできる。

### 1.4 技術スタック
- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS + shadcn/ui
- **地図**: Leaflet
- **データベース**: Supabase (PostgreSQL)
- **画像API**: Unsplash API, Pexels API
- **ルーティング**: React Router DOM
- **状態管理**: React Context + Custom Hooks

## 2. システム構成

### 2.1 アーキテクチャ
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Supabase      │    │   External APIs │
│                 │◄──►│   PostgreSQL    │    │   (Unsplash,    │
│   - Components  │    │   - buildings   │    │    Pexels)      │
│   - Hooks       │    │   - architects  │    │                 │
│   - Services    │    │   - photos      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 ディレクトリ構造
```
src/
├── components/           # Reactコンポーネント
│   ├── layout/         # レイアウトコンポーネント
│   │   ├── AppHeader.tsx
│   │   ├── Footer.tsx
│   │   ├── MainContent.tsx
│   │   └── Sidebar.tsx
│   ├── pages/          # ページコンポーネント
│   │   ├── HomePage.tsx
│   │   └── BuildingDetailPage.tsx
│   ├── providers/      # Context Provider
│   │   └── AppProvider.tsx
│   ├── ui/            # UIコンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── AdminPanel.tsx
│   ├── BuildingCard.tsx
│   ├── BuildingDetail.tsx
│   ├── DataMigration.tsx
│   ├── ErrorBoundary.tsx
│   ├── LikedBuildings.tsx
│   ├── LoginModal.tsx
│   ├── Map.tsx
│   ├── SearchForm.tsx
│   └── SearchHistory.tsx
├── hooks/              # カスタムフック
│   ├── useAppState.ts    # 状態管理
│   ├── useAppActions.ts  # アクション管理
│   ├── useAppHandlers.ts # イベントハンドラー
│   ├── useAppEffects.ts  # 副作用管理
│   ├── useBuildings.ts
│   ├── useGeolocation.ts
│   ├── useLanguage.ts
│   ├── useOptimizedBuildings.ts
│   ├── usePagination.ts
│   ├── usePlanetScaleBuildings.ts
│   ├── usePlanetScaleToggle.ts
│   ├── useSupabaseBuildings.ts
│   └── useSupabaseToggle.ts
├── services/           # APIサービス
│   ├── api.ts
│   ├── image-search.ts
│   ├── marker-service.ts
│   ├── planetscale-api.ts
│   └── supabase-api.ts
├── utils/              # ユーティリティ関数
│   ├── database-import.ts
│   ├── debug-supabase.ts
│   ├── distance.ts
│   ├── error-handling.ts
│   ├── mysql-to-postgresql.ts
│   ├── pexels.ts
│   ├── photo-checker.ts
│   ├── search.ts
│   ├── translations.ts
│   ├── type-guards.ts
│   ├── unsplash.ts
│   ├── utils.ts
│   └── validation.ts
├── types/              # TypeScript型定義
│   ├── app.ts
│   └── index.ts
├── data/               # 静的データ
│   ├── mockData.ts
│   └── searchData.ts
├── lib/                # ライブラリ設定
│   ├── supabase.ts
│   └── utils.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 3. データモデル

### 3.1 主要エンティティ

#### Building (建築物)
```typescript
interface Building {
  id: number;
  uid: string;
  title: string;
  titleEn: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  completionYears: number;
  parentBuildingTypes: string[];
  buildingTypes: string[];
  parentStructures: string[];
  structures: string[];
  prefectures: string;
  areas: string;
  location: string;
  locationEn?: string;
  buildingTypesEn?: string[];
  architectDetails: string;
  lat: number;
  lng: number;
  architects: Architect[];
  photos: Photo[];
  likes: number;
  distance?: number;
  created_at: string;
  updated_at: string;
}
```

#### Architect (建築家)
```typescript
interface Architect {
  architect_id: number;
  architectJa: string;
  architectEn: string;
  websites: Website[];
}
```

#### Photo (写真)
```typescript
interface Photo {
  id: number;
  building_id: number;
  url: string;
  thumbnail_url: string;
  likes: number;
  created_at: string;
}
```

#### User (ユーザー)
```typescript
interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}
```

### 3.2 検索フィルター
```typescript
interface SearchFilters {
  query: string;
  radius: number;
  architects?: string[];
  buildingTypes: string[];
  prefectures: string[];
  areas: string[];
  hasPhotos: boolean;
  hasVideos: boolean;
  currentLocation: { lat: number; lng: number } | null;
}
```

## 4. 機能仕様

### 4.1 主要機能

#### 4.1.1 建築作品検索
- **キーワード検索**: 建築物名、建築家名での検索
- **フィルタリング**: 
  - 建築家による絞り込み
  - 建物タイプによる絞り込み
  - 地域（都道府県・エリア）による絞り込み
  - 写真・動画の有無による絞り込み
- **距離検索**: 現在地からの半径指定による検索
- **ページネーション**: 10件ずつのページ分割表示

#### 4.1.2 地図表示
- **インタラクティブマップ**: Leafletを使用した地図表示
- **マーカー表示**: 建築物の位置をマーカーで表示
- **詳細情報**: マーカークリックで建築物詳細表示
- **現在地表示**: ユーザーの現在位置を表示

#### 4.1.3 建築物詳細表示
- **基本情報**: 建築物名、建築家、完成年、所在地
- **写真ギャラリー**: 建築物の写真一覧
- **動画**: YouTube動画の埋め込み表示
- **いいね機能**: 建築物・写真へのいいね機能
- **関連情報**: 建築家の詳細情報、ウェブサイトリンク

#### 4.1.4 多言語対応
- **対応言語**: 日本語・英語
- **動的切り替え**: 言語切り替えボタン
- **翻訳データ**: 建築物名、建築家名、建物タイプ等

#### 4.1.5 ユーザー機能
- **お気に入り**: 建築物のお気に入り登録・管理
- **検索履歴**: 過去の検索履歴の保存・表示
- **人気検索**: 人気の検索キーワード表示

### 4.2 管理者機能

#### 4.2.1 管理者パネル
- **CRUD操作**: 建築物データの作成・編集・削除
- **データ一覧**: 全建築物データの一覧表示
- **検索・フィルタ**: 管理者向けの詳細検索機能

#### 4.2.2 データ移行ツール
- **MySQL → PostgreSQL**: データベース移行機能
- **データ検証**: 移行データの整合性チェック
- **エラーハンドリング**: 移行エラーの詳細表示

### 4.3 パフォーマンス最適化

#### 4.3.1 React最適化
- **React.memo**: 不要な再レンダリングの防止
- **useMemo/useCallback**: 重い計算処理のメモ化
- **動的インポート**: コード分割による初期読み込み速度向上

#### 4.3.2 画像最適化
- **遅延読み込み**: LazyImageコンポーネント
- **エラーハンドリング**: 画像読み込み失敗時のフォールバック
- **サムネイル表示**: 軽量なサムネイル画像の使用

## 5. API仕様

### 5.1 Supabase API

#### 5.1.1 建築物取得
```typescript
// 全建築物取得
GET /buildings_table_2
Parameters: page, limit
Response: { buildings: Building[], total: number }

// 建築物詳細取得
GET /buildings_table_2/{id}
Response: Building

// 建築物検索
POST /buildings_table_2/search
Body: SearchFilters
Response: { buildings: Building[], total: number }
```

#### 5.1.2 建築家取得
```typescript
// 建築家一覧取得
GET /architects_table
Response: Architect[]

// 建築家詳細取得
GET /architects_table/{id}
Response: Architect
```

#### 5.1.3 いいね機能
```typescript
// 建築物いいね
POST /buildings_table_2/{id}/like
Response: { likes: number }

// 写真いいね
POST /photos/{id}/like
Response: { likes: number }
```

### 5.2 外部API

#### 5.2.1 Unsplash API
- **用途**: 建築物の高品質画像取得
- **エンドポイント**: `https://api.unsplash.com/search/photos`
- **認証**: API Key認証

#### 5.2.2 Pexels API
- **用途**: 追加の画像ソース
- **エンドポイント**: `https://api.pexels.com/v1/search`
- **認証**: API Key認証

## 6. データベース設計

### 6.1 テーブル構造

#### buildings_table_2 (建築物テーブル)
```sql
CREATE TABLE buildings_table_2 (
  building_id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE,
  title VARCHAR(500),
  titleEn VARCHAR(500),
  thumbnailUrl TEXT,
  youtubeUrl TEXT,
  completionYears INTEGER,
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

#### architects_table (建築家テーブル)
```sql
CREATE TABLE architects_table (
  architect_id SERIAL PRIMARY KEY,
  architectJa VARCHAR(255),
  architectEn VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### building_architects (関連テーブル)
```sql
CREATE TABLE building_architects (
  building_id INTEGER REFERENCES buildings_table_2(building_id),
  architect_id INTEGER REFERENCES architects_table(architect_id),
  PRIMARY KEY (building_id, architect_id)
);
```

#### architect_websites_3 (ウェブサイトテーブル)
```sql
CREATE TABLE architect_websites_3 (
  website_id SERIAL PRIMARY KEY,
  architect_id INTEGER REFERENCES architects_table(architect_id),
  url TEXT,
  title VARCHAR(255),
  invalid BOOLEAN DEFAULT FALSE,
  architectJa VARCHAR(255),
  architectEn VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 7. セキュリティ

### 7.1 認証・認可
- **Supabase Auth**: ユーザー認証
- **Row Level Security (RLS)**: データベースレベルでのセキュリティ
- **API Key管理**: 環境変数による安全な管理

### 7.2 データ保護
- **入力検証**: クライアント・サーバー両方での入力検証
- **SQLインジェクション対策**: パラメータ化クエリの使用
- **XSS対策**: 出力エスケープの実装

## 8. エラーハンドリング

### 8.1 エラーバウンダリ
- **React Error Boundary**: 予期しないエラーのキャッチ
- **ユーザーフレンドリーなエラー表示**: エラーID生成による追跡
- **開発環境での詳細情報**: デバッグ情報の表示

### 8.2 型安全性
- **TypeScript strict mode**: 厳密な型チェック
- **型ガード関数**: ランタイム型検証
- **カスタムエラークラス**: 構造化されたエラー処理

## 9. パフォーマンス指標

### 9.1 目標値
- **バンドルサイズ**: 500KB以下 (gzip: 150KB以下)
- **初期読み込み時間**: 3秒以下
- **レンダリング回数**: 最大80%削減
- **画像読み込み**: 遅延読み込みによる最適化

### 9.2 監視項目
- **バンドルサイズ**: ビルド時の自動チェック
- **レンダリング回数**: React DevToolsで監視
- **メモリ使用量**: ブラウザ開発者ツールで確認

## 10. デプロイメント

### 10.1 環境変数
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
VITE_PEXELS_API_KEY=your_pexels_api_key
```

### 10.2 ビルド・デプロイ
```bash
# 開発環境
npm run dev

# プロダクションビルド
npm run build

# プレビュー
npm run preview
```

### 10.3 推奨デプロイ先
- **Vercel**: Vite対応、自動デプロイ
- **Netlify**: 静的サイトホスティング
- **GitHub Pages**: 無料ホスティング

## 11. 開発ガイドライン

### 11.1 コーディング規約
- **TypeScript**: 厳密な型定義
- **React Hooks**: カスタムフックの活用
- **パフォーマンス**: 最適化の継続
- **エラーハンドリング**: 包括的な対応

### 11.2 テスト戦略
- **型チェック**: TypeScriptによる静的解析
- **リンター**: ESLintによるコード品質チェック
- **手動テスト**: 主要機能の動作確認

## 12. 今後の拡張予定

### 12.1 機能拡張
- **ユーザー認証**: 完全なログイン・登録機能
- **コメント機能**: 建築物へのコメント投稿
- **評価機能**: 建築物の評価・レビュー
- **ソーシャル機能**: シェア・フォロー機能

### 12.2 技術的改善
- **PWA対応**: オフライン対応
- **SEO最適化**: メタデータの充実
- **アクセシビリティ**: WCAG準拠
- **国際化**: 多言語対応の拡張

---

**作成日**: 2024年12月19日  
**最終更新**: 2024年12月19日  
**ステータス**: Production Ready ✅ 