# 建築家.com - 建築作品データベース

日本の建築作品を検索・閲覧できるWebアプリケーションです。

## 機能

- 建築物の検索・フィルタリング
- 地図表示による位置確認
- 建築家・建築種別での絞り込み
- 現在地からの距離検索
- 多言語対応（日本語・英語）
- レスポンシブデザイン

## 技術スタック

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Maps**: Leaflet
- **State Management**: React Hooks
- **Routing**: React Router DOM

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下を設定：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_USE_SUPABASE=true
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

## Supabaseデータベース構造

### テーブル

- `buildings_table_2` - 建築物データ
- `architects_table` - 建築家データ
- `building_architects` - 建築物と建築家の関連
- `architect_websites_3` - 建築家のウェブサイト情報

### 主要カラム

#### buildings_table_2
- `building_id` - 建築物ID
- `title` - 建築物名（日本語）
- `titleEn` - 建築物名（英語）
- `lat`, `lng` - 緯度・経度
- `completionYears` - 完成年
- `buildingTypes` - 建築種別
- `prefectures` - 都道府県

## 主要コンポーネント

- `App.tsx` - メインアプリケーション
- `SearchForm.tsx` - 検索フォーム
- `BuildingCard.tsx` - 建築物カード表示
- `BuildingDetail.tsx` - 建築物詳細モーダル
- `Map.tsx` - 地図表示
- `Header.tsx` - ヘッダーナビゲーション

## API統合

- `src/services/supabase-api.ts` - Supabase API クライアント
- `src/hooks/useSupabaseBuildings.ts` - 建築物データ取得フック
- `src/lib/supabase.ts` - Supabase クライアント設定

## ビルド

```bash
npm run build
```

## ライセンス

MIT License

## 開発者

- GitHub: https://github.com/ykhknw/pocketnavi_02.git