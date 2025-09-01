# PocketNavi - Windows PostgreSQLセットアップガイド

## 概要
PocketNaviアプリケーション開発のためのWindows環境でのPostgreSQLセットアップガイド

## 前提条件
- Windows 10/11
- 管理者権限
- インターネット接続

## PostgreSQLのインストール

### 1. PostgreSQLのダウンロード

#### 公式サイトからのダウンロード
1. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)にアクセス
2. **Download the installer**をクリック
3. 最新版（PostgreSQL 15以上）をダウンロード

#### 代替方法：Chocolateyを使用
```powershell
# Chocolateyがインストールされていない場合
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# PostgreSQLのインストール
choco install postgresql
```

### 2. PostgreSQLのインストール手順

#### インストーラーの実行
1. ダウンロードしたインストーラーを実行
2. **Next**をクリック
3. インストールディレクトリを選択（デフォルト推奨）
4. コンポーネント選択：
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4
   - ✅ Stack Builder
   - ✅ Command Line Tools

#### データディレクトリの設定
1. データディレクトリを選択（デフォルト推奨）
2. パスワードを設定（重要：忘れないように記録）
3. ポート番号：5432（デフォルト）
4. ロケール設定：Default locale

### 3. インストール後の設定

#### 環境変数の確認
```powershell
# システム環境変数に以下が追加されているか確認
echo $env:PATH
# 以下が含まれていることを確認
# C:\Program Files\PostgreSQL\15\bin
```

#### サービスの確認
```powershell
# PostgreSQLサービスの状態確認
Get-Service postgresql*

# サービスの開始（必要に応じて）
Start-Service postgresql-x64-15
```

## pgAdmin 4の設定

### 1. pgAdmin 4の起動

#### 初回起動
1. スタートメニューから**pgAdmin 4**を起動
2. マスターパスワードを設定
3. ブラウザが自動で開く

#### サーバーの追加
1. **Servers**を右クリック
2. **Register** → **Server**
3. 設定：
   - **Name**: PocketNavi Local
   - **Host**: localhost
   - **Port**: 5432
   - **Database**: postgres
   - **Username**: postgres
   - **Password**: インストール時に設定したパスワード

### 2. データベースの作成

#### PocketNavi用データベースの作成
```sql
-- pgAdmin 4のQuery Toolで実行
CREATE DATABASE pocketnavi_db;
CREATE USER pocketnavi_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE pocketnavi_db TO pocketnavi_user;
```

## コマンドラインでの操作

### 1. psqlの使用

#### psqlへの接続
```cmd
# システムユーザーとして接続
psql -U postgres -d postgres

# PocketNaviユーザーとして接続
psql -U pocketnavi_user -d pocketnavi_db -h localhost
```

#### 基本的なコマンド
```sql
-- データベース一覧
\l

-- テーブル一覧
\dt

-- データベース切り替え
\c pocketnavi_db

-- ヘルプ
\?
```

### 2. データベース操作

#### テーブルの作成
```sql
-- PocketNavi用テーブルの作成
CREATE TABLE buildings_table_2 (
  building_id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE,
  title VARCHAR(500),
  titleEn VARCHAR(500),
  thumbnailUrl TEXT,
  youtubeUrl TEXT,
  completionYears SMALLINT,
  parentBuildingTypes TEXT,
  buildingTypes TEXT,
  parentStructures TEXT,
  structures TEXT,
  prefectures VARCHAR(100),
  areas VARCHAR(100),
  location TEXT,
  buildingTypesEn TEXT,
  architectDetails TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE architects_table (
  architect_id SERIAL PRIMARY KEY,
  architectJa VARCHAR(255),
  architectEn VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE building_architects (
  building_id INTEGER REFERENCES buildings_table_2(building_id),
  architect_id INTEGER REFERENCES architects_table(architect_id),
  architect_order INTEGER DEFAULT 0,
  PRIMARY KEY (building_id, architect_id)
);
```

## PocketNaviアプリケーションとの連携

### 1. 環境変数の設定

#### .envファイルの作成
```env
# ローカル開発用
VITE_USE_SUPABASE=false
VITE_LOCAL_POSTGRES_URL=postgresql://pocketnavi_user:your_secure_password@localhost:5432/pocketnavi_db
```

### 2. データベース接続の確認

#### 接続テスト
```typescript
// src/lib/local-postgres.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.VITE_LOCAL_POSTGRES_URL,
});

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connected:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};
```

## トラブルシューティング

### 1. よくある問題

#### ポート5432が使用中
```powershell
# ポートの使用状況確認
netstat -an | findstr :5432

# 他のプロセスを停止
taskkill /F /PID <process_id>
```

#### パスワード認証エラー
```sql
-- pg_hba.confの設定確認
-- C:\Program Files\PostgreSQL\15\data\pg_hba.conf
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
```

#### サービスが起動しない
```powershell
# サービスの詳細確認
Get-Service postgresql* | Format-List

# ログの確認
Get-EventLog -LogName Application -Source "postgresql*" -Newest 10
```

### 2. パフォーマンス最適化

#### メモリ設定
```sql
-- postgresql.confの設定
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
```

#### インデックスの作成
```sql
-- PocketNavi用インデックス
CREATE INDEX idx_buildings_title ON buildings_table_2(title);
CREATE INDEX idx_buildings_location ON buildings_table_2(lat, lng);
CREATE INDEX idx_buildings_architect ON buildings_table_2(architectDetails);
CREATE INDEX idx_buildings_completion_year ON buildings_table_2(completionYears);
```

## バックアップと復元

### 1. データベースのバックアップ

#### pg_dumpを使用
```cmd
# データベース全体のバックアップ
pg_dump -U postgres -d pocketnavi_db > pocketnavi_backup.sql

# 特定のテーブルのみバックアップ
pg_dump -U postgres -d pocketnavi_db -t buildings_table_2 > buildings_backup.sql
```

#### pgAdmin 4でのバックアップ
1. データベースを右クリック
2. **Backup**を選択
3. ファイル名とオプションを設定
4. **Backup**を実行

### 2. データベースの復元

#### psqlを使用
```cmd
# データベースの復元
psql -U postgres -d pocketnavi_db < pocketnavi_backup.sql
```

#### pgAdmin 4での復元
1. データベースを右クリック
2. **Restore**を選択
3. バックアップファイルを選択
4. **Restore**を実行

## セキュリティ設定

### 1. ファイアウォール設定

#### Windows Defender ファイアウォール
1. **コントロールパネル** → **システムとセキュリティ** → **Windows Defender ファイアウォール**
2. **詳細設定**
3. **受信の規則** → **新しい規則**
4. **ポート** → **TCP** → **特定のローカルポート** → **5432**
5. **接続を許可する**
6. **ドメイン、プライベート、パブリック**を選択
7. **名前**: PostgreSQL

### 2. ユーザー権限の管理

#### 最小権限の原則
```sql
-- 読み取り専用ユーザーの作成
CREATE USER pocketnavi_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE pocketnavi_db TO pocketnavi_readonly;
GRANT USAGE ON SCHEMA public TO pocketnavi_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO pocketnavi_readonly;
```

## 監視とメンテナンス

### 1. ログの監視

#### ログ設定
```sql
-- postgresql.confの設定
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
```

### 2. 定期メンテナンス

#### 自動VACUUM設定
```sql
-- postgresql.confの設定
autovacuum = on
autovacuum_vacuum_scale_factor = 0.2
autovacuum_analyze_scale_factor = 0.1
```

#### 統計情報の更新
```sql
-- 手動での統計情報更新
ANALYZE buildings_table_2;
ANALYZE architects_table;
```

## 開発環境の最適化

### 1. 開発用設定

#### 開発環境の設定
```sql
-- 開発用の設定
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();
```

### 2. テストデータの準備

#### サンプルデータの挿入
```sql
-- テスト用データの挿入
INSERT INTO buildings_table_2 (title, titleEn, lat, lng, completionYears) VALUES
('東京スカイツリー', 'Tokyo Skytree', 35.7100, 139.8107, 2012),
('東京タワー', 'Tokyo Tower', 35.6586, 139.7454, 1958);

INSERT INTO architects_table (architectJa, architectEn) VALUES
('安藤忠雄', 'Tadao Ando'),
('隈研吾', 'Kengo Kuma');
```

---

**最終更新**: 2024年12月19日  
**バージョン**: 2.2.0  
**プロジェクト**: PocketNavi