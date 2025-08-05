# Changelog

## [1.0.0] - 2024-01-XX

### Added
- 建築物検索・表示機能
- 地図表示機能（Leaflet使用）
- 多言語対応（日本語・英語）
- レスポンシブデザイン
- Supabaseデータベース統合
- 建築家・建築種別フィルタリング
- 現在地からの距離検索
- 建築物詳細モーダル表示
- 管理者パネル（CRUD操作）
- データ移行ツール（MySQL → PostgreSQL）

### Technical
- React 18 + TypeScript
- Vite ビルドツール
- Tailwind CSS + shadcn/ui
- Supabase PostgreSQL
- React Router DOM
- Leaflet Maps

### Database Schema
- buildings_table_2: 建築物データ
- architects_table: 建築家データ
- building_architects: 関連テーブル
- architect_websites_3: ウェブサイト情報

### Features
- 検索フィルタリング
- 地図マーカー表示
- 建築物詳細表示
- いいね機能
- 検索履歴
- データインポート/エクスポート