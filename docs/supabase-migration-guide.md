# Supabaseデータ移行ガイド

## 概要
_shinkenchiku_db.sql（42MB）をSupabaseに移行する手順

## 前提条件
- Supabaseアカウント作成済み
- プロジェクト作成済み
- 環境変数設定済み

## 移行手順

### Step 1: SQLファイル変換
1. アプリの「データ移行」ボタンをクリック
2. _shinkenchiku_db.sql ファイルを選択
3. 「PostgreSQL変換」ボタンをクリック
4. 変換されたSQLファイルをダウンロード

### Step 2: Supabaseでのインポート

#### 2-1. Supabaseダッシュボードにアクセス
```
https://supabase.com/dashboard
```

#### 2-2. SQL Editorを開く
- 左メニューから「SQL Editor」を選択
- 「New query」をクリック

#### 2-3. SQLファイルをインポート
```sql
-- 変換されたSQLファイルの内容をコピー&ペースト
-- 実行ボタンをクリック
```

#### 2-4. 段階的インポート（推奨）
大容量ファイルの場合、以下の順序でインポート：

1. **テーブル構造のみ**
```sql
-- CREATE TABLE文のみ実行
CREATE TABLE buildings (...);
CREATE TABLE architects (...);
-- etc.
```

2. **基本データ**
```sql
-- 重要なデータから順次インポート
INSERT INTO buildings VALUES (...);
-- 100-200件ずつ実行
```

3. **残りのデータ**
```sql
-- 残りのデータを段階的にインポート
```

### Step 3: データ検証

#### 3-1. テーブル確認
```sql
-- テーブル一覧
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- データ件数確認
SELECT COUNT(*) FROM buildings;
SELECT COUNT(*) FROM architects;
```

#### 3-2. サンプルデータ確認
```sql
-- サンプルデータ表示
SELECT * FROM buildings LIMIT 5;
```

### Step 4: アプリケーション設定

#### 4-1. 環境変数更新
```env
VITE_USE_SUPABASE=true
```

#### 4-2. 動作確認
- アプリを再起動
- 検索機能をテスト
- データ表示を確認

## トラブルシューティング

### エラー1: 容量制限
```
Error: Database size limit exceeded
```
**対策**: 不要なデータを削除、画像を外部化

### エラー2: 構文エラー
```
Error: syntax error at or near "..."
```
**対策**: MySQL固有の構文を手動修正

### エラー3: 文字エンコーディング
```
Error: invalid byte sequence
```
**対策**: UTF-8エンコーディングで保存し直し

## 容量最適化

### 画像データの外部化
```sql
-- 画像URLを外部CDNに変更
UPDATE buildings 
SET thumbnail_url = REPLACE(thumbnail_url, 'data:image', 'https://cdn.example.com/');
```

### 不要データの削除
```sql
-- 空のレコード削除
DELETE FROM buildings WHERE title IS NULL OR title = '';
```

### テキストデータの最適化
```sql
-- 長すぎる説明文を切り詰め
UPDATE buildings 
SET architect_details = LEFT(architect_details, 1000) 
WHERE LENGTH(architect_details) > 1000;
```

## 成功確認

✅ チェックリスト:
- [ ] 全テーブルが作成されている
- [ ] データ件数が正しい
- [ ] アプリで検索できる
- [ ] 地図表示が正常
- [ ] 画像が表示される

## 次のステップ

1. **パフォーマンス最適化**
   - インデックス追加
   - クエリ最適化

2. **セキュリティ設定**
   - RLS（Row Level Security）設定
   - API制限設定

3. **バックアップ設定**
   - 定期バックアップ
   - 復旧手順確認