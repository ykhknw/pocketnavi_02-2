# PocketNavi - 建築物ナビゲーションアプリ

## 概要
PocketNaviは、日本の建築物を検索・閲覧できるWebアプリケーションです。建築家、用途、地域など様々な条件で建築物を検索できます。

## 機能
- 建築物の検索・閲覧
- 地図表示
- お気に入り機能
- 多言語対応（日本語・英語）
- レスポンシブデザイン

## スクロールトップボタン

### 概要
ページの下部から一番上まで滑らかにスクロールする機能を持つボタンを提供しています。

### 3つのスタイルバリエーション

#### 1. フローティングアクションボタン（FAB）スタイル
- **特徴**: 最も一般的で使いやすいデザイン
- **デザイン**: Material DesignのFABスタイルを採用
- **使用例**: `<ScrollToTopButton variant="fab" />`

#### 2. 右下固定の丸いボタン
- **特徴**: シンプルで目立つデザイン
- **デザイン**: 白い背景にグレーのボーダー
- **使用例**: `<ScrollToTopButton variant="round" />`

#### 3. 右下固定の角丸ボタン
- **特徴**: モダンで洗練されたデザイン
- **デザイン**: グラデーション背景と角丸デザイン
- **使用例**: `<ScrollToTopButton variant="rounded" />`

### 使用方法

```tsx
import { ScrollToTopButton } from './components/ScrollToTopButton';

// 基本的な使用
<ScrollToTopButton />

// スタイルを指定
<ScrollToTopButton variant="fab" />
<ScrollToTopButton variant="round" />
<ScrollToTopButton variant="rounded" />

// 言語を指定
<ScrollToTopButton variant="fab" language="ja" />
<ScrollToTopButton variant="fab" language="en" />

// カスタムクラスを追加
<ScrollToTopButton variant="fab" className="custom-class" />
```

### 機能
- **自動表示**: スクロール300px以上で自動表示
- **スムーズスクロール**: `behavior: 'smooth'`で滑らかなスクロール
- **ツールチップ**: ホバー時に説明テキストを表示
- **アクセシビリティ**: `aria-label`と`title`属性でスクリーンリーダー対応
- **レスポンシブ**: モバイル・タブレット・デスクトップに対応

### カスタマイズ
各スタイルは以下のプロパティでカスタマイズ可能です：
- `variant`: ボタンのスタイル（'fab', 'round', 'rounded'）
- `language`: 表示言語（'ja', 'en'）
- `className`: 追加のCSSクラス

## セットアップ

### 必要な環境
- Node.js 18以上
- npm または yarn

### インストール
```bash
npm install
```

### 開発サーバーの起動
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

## 技術スタック
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Supabase
- React Router

## ライセンス
MIT License