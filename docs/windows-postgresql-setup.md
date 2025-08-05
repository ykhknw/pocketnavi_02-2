# Windows PostgreSQLクライアント導入ガイド

## **方法1: PostgreSQL公式インストーラー（推奨）**

### **1. ダウンロード**
1. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/)にアクセス
2. 「Download the installer」をクリック
3. 最新版をダウンロード（例：postgresql-16.1-1-windows-x64.exe）

### **2. インストール**
1. ダウンロードしたファイルを実行
2. インストール画面で以下を選択：
   - ✅ PostgreSQL Server
   - ✅ **pgAdmin 4**（GUI管理ツール）
   - ✅ **Command Line Tools**（psqlコマンド）
   - ✅ Stack Builder
3. パスワード設定（覚えておく）
4. ポート：5432（デフォルト）
5. インストール完了

### **3. 環境変数設定**
1. Windowsキー + R → `sysdm.cpl`
2. 「詳細設定」→「環境変数」
3. システム環境変数の「Path」を編集
4. 以下を追加：
   ```
   C:\Program Files\PostgreSQL\16\bin
   ```

### **4. 動作確認**
```cmd
# コマンドプロンプトを開く
psql --version
```

## **方法2: Chocolatey（簡単）**

### **1. Chocolateyインストール**
管理者権限でPowerShellを開き：
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### **2. PostgreSQLクライアントインストール**
```cmd
choco install postgresql
```

## **方法3: Scoop（軽量）**

### **1. Scoopインストール**
PowerShellで：
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### **2. PostgreSQLクライアントインストール**
```cmd
scoop install postgresql
```

## **Supabaseへの接続方法**

### **1. 接続文字列の準備**
Supabaseダッシュボードから接続文字列をコピー：
```
postgresql://postgres:[YOUR-PASSWORD]@db.srxtuknonqejalqcymt.supabase.co:5432/postgres
```

### **2. 接続テスト**
```cmd
psql "postgresql://postgres:[YOUR-PASSWORD]@db.srxtuknonqejalqcymt.supabase.co:5432/postgres"
```

### **3. SQLファイル実行**
```cmd
# 方法A: ファイルを直接実行
psql "postgresql://postgres:[YOUR-PASSWORD]@db.srxtuknonqejalqcymt.supabase.co:5432/postgres" < converted.sql

# 方法B: 接続後に実行
psql "postgresql://postgres:[YOUR-PASSWORD]@db.srxtuknonqejalqcymt.supabase.co:5432/postgres"
postgres=> \i C:\path\to\converted.sql
```

## **GUI方法: pgAdmin 4**

### **1. pgAdmin 4を起動**
- スタートメニューから「pgAdmin 4」を検索

### **2. サーバー追加**
1. 左パネルで「Servers」を右クリック
2. 「Register」→「Server」
3. 設定：
   - **Name**: Supabase
   - **Host**: db.srxtuknonqejalqcymt.supabase.co
   - **Port**: 5432
   - **Database**: postgres
   - **Username**: postgres
   - **Password**: [YOUR-PASSWORD]

### **3. SQLファイル実行**
1. 接続後、「Tools」→「Query Tool」
2. ファイルアイコンをクリック
3. 変換済みSQLファイルを選択
4. 実行ボタンをクリック

## **トラブルシューティング**

### **エラー: 'psql' is not recognized**
- 環境変数Pathの設定を確認
- コマンドプロンプトを再起動

### **接続エラー**
- パスワードを確認
- ファイアウォール設定を確認
- インターネット接続を確認

### **大容量ファイルの処理**
```cmd
# タイムアウト設定を延長
psql "postgresql://..." -c "SET statement_timeout = 0;" < converted.sql
```

## **推奨手順**

1. **PostgreSQL公式インストーラー**でインストール
2. **pgAdmin 4**でGUI接続
3. **大容量SQLファイル**を一括実行

これでWindows環境から簡単にSupabaseに大容量データをインポートできます！