# PocketNavi - Supabase接続トラブルシューティング

## 概要
PocketNaviアプリケーションでSupabase接続時に発生する問題の解決方法

## 前提条件
- PocketNaviプロジェクトが設定済み
- Supabaseプロジェクトが作成済み
- 環境変数が設定済み

## よくある問題と解決方法

### 1. 環境変数の問題

#### 問題: 環境変数が読み込まれない
```
Error: Supabase URL is not defined
Error: Supabase anon key is not defined
```

**解決方法:**
1. `.env`ファイルの確認
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

2. 環境変数の再読み込み
```bash
# 開発サーバーを再起動
npm run dev
```

3. 環境変数の確認
```javascript
// src/lib/supabase.tsで確認
console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

#### 問題: 本番環境で環境変数が設定されていない
**解決方法:**
- Vercel: プロジェクト設定 → Environment Variables
- Netlify: Site settings → Environment variables
- GitHub Pages: リポジトリ設定 → Secrets and variables

### 2. Supabaseクライアントの初期化問題

#### 問題: Supabaseクライアントが初期化されない
```javascript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**解決方法:**
1. 環境変数の存在確認
2. Supabaseプロジェクトの設定確認
3. ネットワーク接続の確認

### 3. データベース接続の問題

#### 問題: データベースに接続できない
```
Error: connection failed
Error: timeout
```

**解決方法:**
1. Supabaseダッシュボードでデータベースの状態確認
2. ネットワーク接続の確認
3. ファイアウォール設定の確認

#### 問題: テーブルが見つからない
```
Error: relation "buildings_table_2" does not exist
```

**解決方法:**
1. テーブルが作成されているか確認
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

2. テーブル名の確認
```sql
-- 正しいテーブル名を確認
\d buildings_table_2
```

### 4. 認証の問題

#### 問題: 認証エラー
```
Error: JWT expired
Error: Invalid JWT
```

**解決方法:**
1. Supabaseプロジェクトの設定確認
2. JWT設定の確認
3. 認証トークンの更新

#### 問題: RLS（Row Level Security）エラー
```
Error: new row violates row-level security policy
```

**解決方法:**
1. RLSポリシーの確認
```sql
-- RLSポリシーの確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'buildings_table_2';
```

2. 一時的にRLSを無効化（開発時のみ）
```sql
ALTER TABLE buildings_table_2 DISABLE ROW LEVEL SECURITY;
```

### 5. クエリの問題

#### 問題: クエリが遅い
**解決方法:**
1. インデックスの確認
```sql
-- インデックスの確認
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'buildings_table_2';
```

2. クエリの最適化
```sql
-- クエリの実行計画確認
EXPLAIN ANALYZE SELECT * FROM buildings_table_2 
WHERE title ILIKE '%建築%';
```

#### 問題: 複雑なクエリでエラー
```
Error: too many arguments for function
```

**解決方法:**
1. クエリの簡素化
2. 段階的なクエリ実行
3. パラメータの型確認

### 6. 画像・ファイルの問題

#### 問題: 画像が表示されない
**解決方法:**
1. 画像URLの確認
2. CORS設定の確認
3. 画像ファイルの存在確認

#### 問題: ファイルアップロードエラー
```
Error: file upload failed
```

**解決方法:**
1. ファイルサイズ制限の確認
2. ファイル形式の確認
3. ストレージバケットの設定確認

## デバッグ方法

### 1. ブラウザ開発者ツールでの確認
```javascript
// コンソールでSupabase接続を確認
console.log('Supabase client:', supabase);
console.log('Supabase auth:', supabase.auth);
```

### 2. ネットワークタブでの確認
- Supabase APIリクエストの確認
- レスポンスステータスの確認
- エラーレスポンスの確認

### 3. Supabaseダッシュボードでの確認
- ログの確認
- データベースの状態確認
- 認証の状態確認

## 予防策

### 1. エラーハンドリングの実装
```javascript
// src/services/supabase-api.ts
try {
  const { data, error } = await supabase
    .from('buildings_table_2')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message);
  }
  
  return data;
} catch (error) {
  console.error('API error:', error);
  throw error;
}
```

### 2. 接続状態の監視
```javascript
// 接続状態の確認
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session);
});
```

### 3. 定期的なヘルスチェック
```javascript
// ヘルスチェック関数
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('buildings_table_2')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection check failed:', error);
      return false;
    }
    
    console.log('Connection check successful');
    return true;
  } catch (error) {
    console.error('Connection check error:', error);
    return false;
  }
}
```

## ログとモニタリング

### 1. エラーログの設定
```javascript
// エラーログの記録
function logError(error, context) {
  console.error('Error in', context, ':', error);
  
  // エラー報告サービスに送信（例：Sentry）
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      tags: { context }
    });
  }
}
```

### 2. パフォーマンス監視
```javascript
// クエリ実行時間の監視
async function measureQueryPerformance(queryFn) {
  const start = performance.now();
  
  try {
    const result = await queryFn();
    const end = performance.now();
    
    console.log(`Query executed in ${end - start}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`Query failed after ${end - start}ms:`, error);
    throw error;
  }
}
```

## 緊急時の対応

### 1. 接続が完全に切れた場合
1. Supabaseダッシュボードでサービス状態確認
2. 代替データソースの準備
3. オフライン機能の実装

### 2. データが破損した場合
1. バックアップからの復旧
2. データ整合性チェック
3. 影響範囲の特定

### 3. セキュリティ問題が発生した場合
1. アクセストークンの無効化
2. セキュリティログの確認
3. 必要に応じてデータベースの再作成

## サポート

### 1. Supabaseサポート
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Discord](https://discord.supabase.com/)

### 2. PocketNaviプロジェクト
- プロジェクトのREADME.mdを確認
- 開発チームに連絡
- GitHub Issuesで問題を報告

---

**最終更新**: 2024年12月19日  
**バージョン**: 2.2.0  
**プロジェクト**: PocketNavi