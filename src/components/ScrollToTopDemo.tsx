import React from 'react';
import { ScrollToTopButton } from './ScrollToTopButton';

export function ScrollToTopDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          スクロールトップボタン デモ
        </h1>
        
        <div className="space-y-8">
          {/* スタイル1: FAB */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-blue-600">
              1. フローティングアクションボタン（FAB）スタイル
            </h2>
            <p className="text-gray-600 mb-4">
              最も一般的で使いやすいデザイン。Material DesignのFABスタイルを採用。
            </p>
            <div className="bg-gray-100 p-4 rounded">
              <code className="text-sm">
                {`<ScrollToTopButton variant="fab" />`}
              </code>
            </div>
          </div>

          {/* スタイル2: 丸いボタン */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-green-600">
              2. 右下固定の丸いボタン
            </h2>
            <p className="text-gray-600 mb-4">
              シンプルで目立つデザイン。白い背景にグレーのボーダー。
            </p>
            <div className="bg-gray-100 p-4 rounded">
              <code className="text-sm">
                {`<ScrollToTopButton variant="round" />`}
              </code>
            </div>
          </div>

          {/* スタイル3: 角丸ボタン */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-purple-600">
              3. 右下固定の角丸ボタン
            </h2>
            <p className="text-gray-600 mb-4">
              モダンで洗練されたデザイン。グラデーション背景と角丸デザイン。
            </p>
            <div className="bg-gray-100 p-4 rounded">
              <code className="text-sm">
                {`<ScrollToTopButton variant="rounded" />`}
              </code>
            </div>
          </div>

          {/* 使用方法 */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-3 text-blue-800">使用方法</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p>1. コンポーネントをインポート</p>
              <p>2. ページの最下部に配置</p>
              <p>3. variantプロパティでスタイルを選択</p>
              <p>4. スクロール300px以上で自動表示</p>
            </div>
          </div>
        </div>

        {/* 長いコンテンツ（スクロールテスト用） */}
        <div className="mt-12 space-y-4">
          <h3 className="text-xl font-semibold">スクロールテスト用コンテンツ</h3>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="bg-white p-4 rounded border">
              <h4 className="font-medium">セクション {i + 1}</h4>
              <p className="text-gray-600">
                このセクションはスクロールトップボタンの動作をテストするためのものです。
                下にスクロールすると、右下にボタンが表示されます。
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3つのスタイルのボタンをすべて表示 */}
      <ScrollToTopButton variant="fab" />
      <ScrollToTopButton variant="round" />
      <ScrollToTopButton variant="rounded" />
    </div>
  );
}
