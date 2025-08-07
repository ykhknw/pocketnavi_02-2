# 建築作品データベース 仕様書要約

## プロジェクト概要

**プロジェクト名**: 建築作品データベース (Architectural Works Database)  
**バージョン**: 2.2.0  
**作成日**: 2024年12月19日  
**ステータス**: Production Ready ✅

現代建築の作品を検索・閲覧できるWebアプリケーション。建築家、建物タイプ、地域などでフィルタリングが可能で、地図上での位置確認もできる。

## 技術スタック

- **フロントエンド**: React 18 + TypeScript + Vite
- **スタイリング**: Tailwind CSS + shadcn/ui
- **地図**: Leaflet
- **データベース**: Supabase (PostgreSQL)
- **画像API**: Unsplash API, Pexels API
- **ルーティング**: React Router DOM
- **状態管理**: React Context + Custom Hooks

## 主要機能

### 1. 建築作品検索
- キーワード検索（建築物名、建築家名）
- フィルタリング（建築家、建物タイプ、地域、写真・動画の有無）
- 距離検索（現在地からの半径指定）
- ページネーション（10件ずつ）

### 2. 地図表示
- Leafletを使用したインタラクティブマップ
- 建築物の位置をマーカーで表示
- マーカークリックで詳細表示
- 現在地表示機能

### 3. 建築物詳細表示
- 基本情報（建築物名、建築家、完成年、所在地）
- 写真ギャラリー
- YouTube動画の埋め込み表示
- いいね機能（建築物・写真）
- 建築家の詳細情報・ウェブサイトリンク

### 4. 多言語対応
- 日本語・英語の動的切り替え
- 建築物名、建築家名、建物タイプ等の翻訳

### 5. ユーザー機能
- お気に入り登録・管理
- 検索履歴の保存・表示
- 人気検索キーワード表示

## 管理者機能

### 管理者パネル
- CRUD操作（建築物データの作成・編集・削除）
- 全建築物データの一覧表示
- 管理者向けの詳細検索機能

### データ移行ツール
- MySQL → PostgreSQL移行機能
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

**Architect (建築家)**
- 日本語・英語名
- ウェブサイト情報

**Photo (写真)**
- 画像URL・サムネイル
- いいね数・作成日

**User (ユーザー)**
- 基本情報（email, name）
- 作成日

## API仕様

### Supabase API
- 建築物取得・検索
- 建築家情報取得
- いいね機能

### 外部API
- Unsplash API（高品質画像）
- Pexels API（追加画像ソース）

## データベース設計

### 主要テーブル
- **buildings_table_2**: 建築物データ
- **architects_table**: 建築家データ
- **building_architects**: 関連テーブル
- **architect_websites_3**: ウェブサイト情報

## パフォーマンス最適化

### React最適化
- React.memoによる不要な再レンダリング防止
- useMemo/useCallbackによる重い計算処理のメモ化
- 動的インポートによるコード分割

### 画像最適化
- 遅延読み込み（LazyImage）
- エラーハンドリング付きフォールバック
- 軽量サムネイル表示

## セキュリティ・エラーハンドリング

### セキュリティ
- Supabase Authによるユーザー認証
- Row Level Security (RLS)
- 環境変数によるAPI Key管理
- 入力検証・SQLインジェクション対策

### エラーハンドリング
- React Error Boundary
- TypeScript strict mode
- 型ガード関数・カスタムエラークラス

## パフォーマンス指標

### 目標値
- バンドルサイズ: 500KB以下 (gzip: 150KB以下)
- 初期読み込み時間: 3秒以下
- レンダリング回数: 最大80%削減

## デプロイメント

### 環境変数
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
VITE_PEXELS_API_KEY=your_pexels_api_key
```

### 推奨デプロイ先
- Vercel（Vite対応、自動デプロイ）
- Netlify（静的サイトホスティング）
- GitHub Pages（無料ホスティング）

## 今後の拡張予定

### 機能拡張
- 完全なユーザー認証
- コメント・評価機能
- ソーシャル機能（シェア・フォロー）

### 技術的改善
- PWA対応（オフライン対応）
- SEO最適化
- アクセシビリティ（WCAG準拠）
- 国際化拡張

---

**文字数**: 約2000文字  
**最終更新**: 2024年12月19日 