# PocketNavi - Supabaseデータ移行ガイド

## 概要
PocketNaviアプリケーションで_shinkenchiku_db.sql（42MB）をSupabaseに移行する手順

## 前提条件
- Supabaseアカウント作成済み
- PocketNaviプロジェクト作成済み
- 環境変数設定済み（VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY）

## 移行手順

### Step 1: SQLファイル変換
1. PocketNaviアプリの「データ移行」ボタンをクリック
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
CREATE TABLE buildings_table_2 (...);
CREATE TABLE architects_table (...);
CREATE TABLE individual_architects (...);
CREATE TABLE architect_compositions (...);
CREATE TABLE building_architects (...);
CREATE TABLE architect_websites_3 (...);
CREATE TABLE photos (...);
CREATE TABLE users (...);
```

2. **基本データ**
```sql
-- 重要なデータから順次インポート
INSERT INTO buildings_table_2 VALUES (...);
INSERT INTO architects_table VALUES (...);
-- 100-200件ずつ実行
```

3. **関連データ**
```sql
-- 関連テーブルのデータをインポート
INSERT INTO building_architects VALUES (...);
INSERT INTO architect_websites_3 VALUES (...);
```

4. **残りのデータ**
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
SELECT COUNT(*) FROM buildings_table_2;
SELECT COUNT(*) FROM architects_table;
SELECT COUNT(*) FROM individual_architects;
SELECT COUNT(*) FROM building_architects;
```

#### 3-2. サンプルデータ確認
```sql
-- サンプルデータ表示
SELECT * FROM buildings_table_2 LIMIT 5;
SELECT * FROM architects_table LIMIT 5;
```

#### 3-3. 関連データ確認
```sql
-- 建築物と建築家の関連確認
SELECT b.title, a.architectJa 
FROM buildings_table_2 b
JOIN building_architects ba ON b.building_id = ba.building_id
JOIN architects_table a ON ba.architect_id = a.architect_id
LIMIT 10;
```

### Step 4: アプリケーション設定

#### 4-1. 環境変数更新
```env
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4-2. 動作確認
- PocketNaviアプリを再起動
- 検索機能をテスト
- 地図表示を確認
- 建築物詳細ページを確認
- 多言語切り替えを確認

## トラブルシューティング

### エラー1: 容量制限
```
Error: Database size limit exceeded
```
**対策**: 
- 不要なデータを削除
- 画像を外部CDNに移行
- データベースプランのアップグレード

### エラー2: 構文エラー
```
Error: syntax error at or near "..."
```
**対策**: 
- MySQL固有の構文を手動修正
- AUTO_INCREMENT → SERIAL
- LIMIT句の調整
- 文字列エスケープの修正

### エラー3: 文字エンコーディング
```
Error: invalid byte sequence
```
**対策**: 
- UTF-8エンコーディングで保存し直し
- 文字化けデータの修正

### エラー4: 外部キー制約
```
Error: insert or update on table violates foreign key constraint
```
**対策**: 
- 依存関係のあるテーブルを正しい順序でインポート
- 外部キー制約を一時的に無効化

## 容量最適化

### 画像データの外部化
```sql
-- 画像URLを外部CDNに変更
UPDATE buildings_table_2 
SET thumbnail_url = REPLACE(thumbnail_url, 'data:image', 'https://cdn.example.com/');
```

### 不要データの削除
```sql
-- 空のレコード削除
DELETE FROM buildings_table_2 WHERE title IS NULL OR title = '';
DELETE FROM architects_table WHERE architectJa IS NULL OR architectJa = '';
```

### テキストデータの最適化
```sql
-- 長すぎる説明文を切り詰め
UPDATE buildings_table_2 
SET architect_details = LEFT(architect_details, 1000) 
WHERE LENGTH(architect_details) > 1000;
```

### インデックス最適化
```sql
-- 検索パフォーマンス向上のためのインデックス
CREATE INDEX idx_buildings_location ON buildings_table_2(lat, lng);
CREATE INDEX idx_buildings_title ON buildings_table_2(title);
CREATE INDEX idx_buildings_architect ON buildings_table_2(architect_details);
CREATE INDEX idx_buildings_completion_year ON buildings_table_2(completion_years);
CREATE INDEX idx_architects_name ON architects_table(architectJa);
```

## データ整合性チェック

### 座標データの確認
```sql
-- 座標が正しく設定されているか確認
SELECT COUNT(*) FROM buildings_table_2 
WHERE lat IS NULL OR lng IS NULL;

-- 座標範囲の確認（日本国内）
SELECT COUNT(*) FROM buildings_table_2 
WHERE lat < 24 OR lat > 46 OR lng < 122 OR lng > 154;
```

### 建築家データの確認
```sql
-- 建築家名の重複確認
SELECT architectJa, COUNT(*) 
FROM architects_table 
GROUP BY architectJa 
HAVING COUNT(*) > 1;
```

### 関連データの確認
```sql
-- 孤立した建築物の確認
SELECT b.building_id, b.title 
FROM buildings_table_2 b
LEFT JOIN building_architects ba ON b.building_id = ba.building_id
WHERE ba.building_id IS NULL;
```

## 成功確認

✅ チェックリスト:
- [ ] 全テーブルが作成されている
- [ ] データ件数が正しい
- [ ] PocketNaviアプリで検索できる
- [ ] 地図表示が正常
- [ ] 画像が表示される
- [ ] 多言語切り替えが動作
- [ ] 建築物詳細ページが表示される
- [ ] スクロールトップボタンが動作
- [ ] 管理者パネルが利用可能

## パフォーマンス最適化

### クエリ最適化
```sql
-- 検索クエリの最適化
EXPLAIN ANALYZE SELECT * FROM buildings_table_2 
WHERE title ILIKE '%建築%' OR architect_details ILIKE '%建築%';

-- インデックスの効果確認
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'buildings_table_2';
```

### キャッシュ設定
```sql
-- 統計情報の更新
ANALYZE buildings_table_2;
ANALYZE architects_table;
ANALYZE building_architects;
```

## 次のステップ

1. **パフォーマンス最適化**
   - インデックス追加
   - クエリ最適化
   - キャッシュ戦略の実装

2. **セキュリティ設定**
   - RLS（Row Level Security）設定
   - API制限設定
   - 認証・認可の設定

3. **バックアップ設定**
   - 定期バックアップ
   - 復旧手順確認
   - データ整合性チェック

4. **監視設定**
   - パフォーマンス監視
   - エラー監視
   - 使用量監視

---

**最終更新**: 2024年12月19日  
**バージョン**: 2.2.0  
**プロジェクト**: PocketNavi