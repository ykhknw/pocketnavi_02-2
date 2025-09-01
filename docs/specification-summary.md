# PocketNavi - 建築物ナビゲーションアプリ 仕様書要約

## プロジェクト概要

**プロジェクト名**: PocketNavi - 建築物ナビゲーションアプリ  
**バージョン**: 2.2.0  
**作成日**: 2024年12月19日  
**ステータス**: Production Ready ✅

日本の建築物を検索・閲覧できるWebアプリケーション。建築家、建物タイプ、地域などでフィルタリングが可能で、地図上での位置確認もできる。多言語対応（日本語・英語）とレスポンシブデザインを提供。

## 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS + shadcn/ui + Radix UI
- **地図**: Leaflet
- **データベース**: Supabase (PostgreSQL)
- **画像API**: Unsplash API, Pexels API
- **ルーティング**: React Router DOM v7
- **状態管理**: React Context + Custom Hooks
- **テスト**: Vitest + Testing Library
- **UIコンポーネント**: Radix UI (Dialog, Select, Checkbox等)

## 主要機能

### 1. 建築物検索・閲覧
- キーワード検索（建築物名、建築家名）
- フィルタリング（建築家、建物タイプ、地域、写真・動画の有無、完成年、住宅除外オプション）
- 距離検索（現在地からの半径指定）
- ページネーション（10件ずつ）

### 2. 地図表示
- Leafletを使用したインタラクティブマップ
- 建築物の位置をマーカーで表示
- マーカークリックで詳細表示
- 現在地表示機能
- 検索結果の地図表示

### 3. 建築物詳細表示
- 基本情報（建築物名、建築家、完成年、所在地）
- 写真ギャラリー
- YouTube動画の埋め込み表示
- いいね機能（建築物・写真）
- 建築家の詳細情報・ウェブサイトリンク

### 4. 多言語対応
- 日本語・英語の動的切り替え
- 建築物名、建築家名、建物タイプ等の翻訳
- UI全体の多言語化

### 5. ユーザー機能
- お気に入り登録・管理
- 検索履歴の保存・表示
- 人気検索キーワード表示

### 6. スクロールトップボタン
- 3つのスタイルバリエーション（FAB、丸いボタン、角丸ボタン）
- 自動表示（スクロール300px以上）
- スムーズスクロール機能
- アクセシビリティ対応

## 管理者機能

### 管理者パネル
- CRUD操作（建築物データの作成・編集・削除）
- 全建築物データの一覧表示
- 管理者向けの詳細検索機能

### データ移行ツール
- MySQL → PostgreSQL移行機能
- SQL構文変換（MySQL → PostgreSQL）
- データ整合性チェック
- エラーハンドリング

## データモデル

### 主要エンティティ

**Building (建築物)**
- 基本情報（id, title, titleEn, location等）
- 建築タイプ・構造情報
- 座標情報（lat, lng）
- 建築家・写真の関連データ
- いいね数・距離情報
- slug（URL用識別子）

**Architect (建築家)**
- 日本語・英語名
- ウェブサイト情報
- slug（URL用識別子）

**IndividualArchitect (個別建築家)**
- 個別建築家の基本情報
- 名前（日本語・英語）
- slug（URL用識別子）

**Photo (写真)**
- 画像URL・サムネイル
- いいね数・作成日

**User (ユーザー)**
- 基本情報（email, name）
- 作成日

## API仕様

### Supabase API
- 建築物取得・検索（`getBuildings`, `searchBuildings`）
- 建築家情報取得（`getArchitects`, `getArchitectBySlug`）
- いいね機能（`likeBuilding`, `unlikeBuilding`）
- 写真取得（`getPhotos`）

### 外部API
- Unsplash API（高品質画像）
- Pexels API（追加画像ソース）
- 建築物名に基づく画像検索

## データベース設計

### 主要テーブル
- **buildings_table_2**: 建築物データ（メインテーブル）
- **architects_table**: 建築家データ
- **individual_architects**: 個別建築家データ
- **architect_compositions**: 建築家構成データ
- **building_architects**: 建築物-建築家関連テーブル
- **architect_websites_3**: ウェブサイト情報
- **photos**: 写真データ
- **users**: ユーザーデータ

### インデックス設計
```sql
CREATE INDEX idx_buildings_location ON buildings_table_2(lat, lng);
CREATE INDEX idx_buildings_title ON buildings_table_2(title);
CREATE INDEX idx_buildings_architect ON buildings_table_2(architect_details);
CREATE INDEX idx_buildings_completion_year ON buildings_table_2(completion_years);
```

## パフォーマンス最適化

### React最適化
- React.memoによる不要な再レンダリング防止
- useMemo/useCallbackによる重い計算処理のメモ化
- 動的インポートによるコード分割
- 仮想化による大量データの効率的表示

### 画像最適化
- 遅延読み込み（LazyImage）
- エラーハンドリング付きフォールバック
- 軽量サムネイル表示
- WebP対応

### データベース最適化
- 効率的なSQLクエリ設計
- 適切なインデックス設定
- 大量データの段階的読み込み
- 頻繁にアクセスされるデータのキャッシュ

## セキュリティ・エラーハンドリング

### セキュリティ
- Supabase Authによるユーザー認証
- Row Level Security (RLS)
- 環境変数によるAPI Key管理
- 入力検証・SQLインジェクション対策
- 適切なCORS設定

### エラーハンドリング
- React Error Boundary
- TypeScript strict mode
- 型ガード関数・カスタムエラークラス
- エラーログの記録・分析

## パフォーマンス指標

### 目標値
- バンドルサイズ: 500KB以下 (gzip: 150KB以下)
- 初期読み込み時間: 3秒以下
- レンダリング回数: 最大80%削減
- Core Web Vitals:
  - LCP (Largest Contentful Paint): 2.5秒以下
  - FID (First Input Delay): 100ms以下
  - CLS (Cumulative Layout Shift): 0.1以下

### 監視項目
- ページ読み込み速度（Lighthouse スコア）
- メモリ使用量・メモリリーク
- API応答時間・データベースクエリ最適化
- ユーザー体験（エラー率・離脱率）

## デプロイメント

### 環境変数
```
# Supabase設定
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 外部API設定
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
VITE_PEXELS_API_KEY=your_pexels_api_key

# アプリ設定
VITE_USE_SUPABASE=true
VITE_APP_ENV=production
```

### 推奨デプロイ先
- Vercel（Vite対応、自動デプロイ、エッジ関数）
- Netlify（静的サイトホスティング、フォーム機能）
- GitHub Pages（無料ホスティング、CI/CD連携）

### CI/CD設定
- GitHub Actionsによる自動デプロイ
- ビルド・テスト・デプロイの自動化
- 環境別の設定管理

## 今後の拡張予定

### 機能拡張
- 完全なユーザー認証（ログイン・登録機能の強化）
- コメント・評価機能（建築物へのレビュー機能）
- ソーシャル機能（シェア・フォロー）
- AR機能（建築物のAR表示）
- 音声ガイド（建築物の音声解説）

### 技術的改善
- PWA対応（オフライン対応・プッシュ通知）
- SEO最適化（メタタグ・構造化データ）
- アクセシビリティ（WCAG 2.1 AA準拠）
- 国際化拡張（多言語対応の拡張）
- パフォーマンスのさらなる最適化

### データ拡張
- より多くの建築物情報
- 詳細な建築家プロフィール
- 高品質なメディアコンテンツ
- 建築物の歴史情報

---

**文字数**: 約2500文字  
**最終更新**: 2024年12月19日  
**バージョン**: 2.2.0  
**ステータス**: Production Ready ✅ 