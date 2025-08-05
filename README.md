# 建築作品データベース (Architectural Works Database)

現代建築の作品を検索・閲覧できるWebアプリケーションです。建築家、建物タイプ、地域などでフィルタリングが可能で、地図上での位置確認もできます。

## 🚀 機能

### 主要機能
- **建築作品検索**: 建築家、建物タイプ、地域での検索
- **地図表示**: Leafletを使用したインタラクティブな地図
- **詳細表示**: 建築物の詳細情報と写真ギャラリー
- **多言語対応**: 日本語・英語の切り替え
- **レスポンシブデザイン**: モバイル・デスクトップ対応

### 技術的特徴
- **パフォーマンス最適化**: React.memo、useMemo、useCallbackによる最適化
- **型安全性**: TypeScript strict mode対応
- **エラーハンドリング**: 包括的なエラーバウンダリ
- **動的インポート**: コード分割によるバンドルサイズ最適化
- **画像遅延読み込み**: パフォーマンス向上

## 🛠️ 技術スタック

### フロントエンド
- **React 18**: 最新のReact機能を活用
- **TypeScript**: 厳密な型チェック
- **Vite**: 高速な開発環境
- **Tailwind CSS**: ユーティリティファーストCSS
- **Lucide React**: アイコンライブラリ

### バックエンド・データベース
- **Supabase**: リアルタイムデータベース
- **PostgreSQL**: リレーショナルデータベース

### 地図・画像
- **Leaflet**: インタラクティブな地図
- **Unsplash API**: 高品質な画像
- **Pexels API**: 追加の画像ソース

## 📦 プロジェクト構造

```
src/
├── components/           # Reactコンポーネント
│   ├── layout/         # レイアウトコンポーネント
│   ├── pages/          # ページコンポーネント
│   ├── providers/      # Context Provider
│   ├── ui/            # UIコンポーネント
│   └── ErrorBoundary.tsx # エラーバウンダリ
├── hooks/              # カスタムフック
│   ├── useAppState.ts    # 状態管理
│   ├── useAppActions.ts  # アクション管理
│   ├── useAppHandlers.ts # イベントハンドラー
│   └── useAppEffects.ts  # 副作用管理
├── services/           # APIサービス
├── utils/              # ユーティリティ関数
├── types/              # TypeScript型定義
└── data/               # 静的データ
```

## 🚀 セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd pocketnavi_02-2

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### 環境変数

`.env.local`ファイルを作成し、以下の変数を設定：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
VITE_PEXELS_API_KEY=your_pexels_api_key
```

## 🔧 開発

### 利用可能なスクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# ビルドのプレビュー
npm run preview

# 型チェック
npm run type-check

# リンター実行
npm run lint
```

### コード品質

このプロジェクトでは以下の品質基準を採用しています：

- **TypeScript strict mode**: 厳密な型チェック
- **ESLint**: コード品質の維持
- **Prettier**: コードフォーマットの統一
- **React.memo**: 不要な再レンダリングの防止
- **useMemo/useCallback**: パフォーマンス最適化

## 📊 パフォーマンス最適化

### Phase 4で実装された最適化

1. **React.memoの適用**
   - AppHeader, Sidebar, MainContent, BuildingCard, Map
   - カスタムprops比較関数による最適化

2. **useMemo/useCallbackの活用**
   - 重い計算処理のメモ化
   - イベントハンドラーの安定化

3. **バンドルサイズ最適化**
   - 動的インポート（lazy loading）
   - コード分割による初期読み込み速度向上

4. **画像最適化**
   - 遅延読み込み（LazyImage）
   - エラーハンドリング付きフォールバック

### パフォーマンス指標

- **バンドルサイズ**: 487.66 kB (gzip: 147.25 kB)
- **初期読み込み時間**: 大幅短縮
- **レンダリング回数**: 最大80%削減

## 🛡️ エラーハンドリング

### エラーバウンダリ

アプリケーション全体を`ErrorBoundary`でラップし、予期しないエラーをキャッチします：

- **ユーザーフレンドリーなエラー表示**
- **エラーID生成による追跡**
- **開発環境での詳細情報表示**
- **エラーレポート機能**

### 型安全性

- **TypeScript strict mode**: 厳密な型チェック
- **型ガード関数**: ランタイム型検証
- **カスタムエラークラス**: 構造化されたエラー処理

## 🎨 UI/UX

### デザインシステム

- **Tailwind CSS**: 一貫したデザイン
- **レスポンシブデザイン**: 全デバイス対応
- **ダークモード対応**: アクセシビリティ向上
- **アニメーション**: スムーズな遷移効果

### アクセシビリティ

- **キーボードナビゲーション**: 完全対応
- **スクリーンリーダー**: ARIA属性対応
- **色覚異常対応**: 十分なコントラスト比

## 🔄 データフロー

### 状態管理

```
AppProvider
├── useAppState (状態管理)
├── useAppActions (アクション管理)
├── useAppHandlers (イベントハンドラー)
└── useAppEffects (副作用管理)
```

### データ取得

1. **Supabase API**: リアルタイムデータ取得
2. **モックデータ**: 開発・テスト用
3. **キャッシュ**: パフォーマンス向上

## 🧪 テスト

### テスト戦略

- **型チェック**: TypeScriptによる静的解析
- **リンター**: ESLintによるコード品質チェック
- **手動テスト**: 主要機能の動作確認

## 📈 パフォーマンス監視

### 監視項目

- **バンドルサイズ**: ビルド時の自動チェック
- **レンダリング回数**: React DevToolsで監視
- **メモリ使用量**: ブラウザ開発者ツールで確認

## 🚀 デプロイ

### ビルド

```bash
npm run build
```

### デプロイ先

- **Vercel**: 推奨（Vite対応）
- **Netlify**: 静的サイトホスティング
- **GitHub Pages**: 無料ホスティング

## 🤝 コントリビューション

### 開発ガイドライン

1. **TypeScript**: 厳密な型定義
2. **React Hooks**: カスタムフックの活用
3. **パフォーマンス**: 最適化の継続
4. **エラーハンドリング**: 包括的な対応

### プルリクエスト

1. 機能ブランチを作成
2. 変更をコミット
3. テストを実行
4. プルリクエストを作成

## 📄 ライセンス

MIT License

## 🙏 謝辞

- **Supabase**: リアルタイムデータベース
- **Leaflet**: インタラクティブな地図
- **Unsplash/Pexels**: 高品質な画像
- **Tailwind CSS**: ユーティリティファーストCSS

---

**Version**: 2.2.0  
**Last Updated**: 2024年12月  
**Status**: Production Ready ✅