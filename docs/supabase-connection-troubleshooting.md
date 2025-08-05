# Supabase接続エラー解決ガイド

## **エラー: ホスト名をアドレスに変換できません**

### **原因**
- ネットワーク接続の問題
- DNS解決の問題
- ファイアウォールの制限
- プロキシ設定の影響

## **解決手順**

### **1. ネットワーク接続確認**
```cmd
# インターネット接続テスト
ping google.com

# Supabaseホスト名の解決テスト
nslookup db.srxtxukhonqejalqcymt.supabase.co
```

### **2. 正しい接続文字列の確認**
Supabaseダッシュボードで最新の接続文字列を確認：

1. **Supabaseダッシュボード**にログイン
2. **Settings** → **Database**
3. **Connection string**をコピー

### **3. 代替接続方法**

#### **A. IPv4アドレス直接指定**
```cmd
# ホスト名をIPアドレスに変換して接続
nslookup db.srxtxukhonqejalqcymt.supabase.co
# 結果のIPアドレスを使用
psql "postgresql://postgres:kKoJiuoijn2KG@[IP_ADDRESS]:5432/postgres"
```

#### **B. 別のDNSサーバー使用**
```cmd
# Google DNSを使用
nslookup db.srxtxukhonqejalqcymt.supabase.co 8.8.8.8
```

### **4. ファイアウォール設定**

#### **Windows Defender ファイアウォール**
1. **コントロールパネル** → **システムとセキュリティ** → **Windows Defender ファイアウォール**
2. **詳細設定**
3. **送信の規則** → **新しい規則**
4. **ポート** → **TCP** → **5432**を許可

#### **企業ネットワークの場合**
- IT部門にPostgreSQL接続（ポート5432）の許可を依頼
- プロキシ設定の確認

### **5. 代替接続方法: pgAdmin**

#### **pgAdminを使用**
1. **pgAdmin 4**を起動
2. **サーバー追加**：
   - **Name**: Supabase
   - **Host**: db.srxtxukhonqejalqcymt.supabase.co
   - **Port**: 5432
   - **Database**: postgres
   - **Username**: postgres
   - **Password**: kKoJiuoijn2KG

### **6. Supabase SQL Editorの使用**

#### **ブラウザ経由でのインポート**
Direct connectionが使えない場合：

1. **Supabaseダッシュボード** → **SQL Editor**
2. **分割版SQLファイル**を使用
3. **500件ずつ**段階的にインポート

## **トラブルシューティング**

### **エラーパターン別対処法**

#### **"Name or service not known"**
```cmd
# DNS設定確認
ipconfig /all
ipconfig /flushdns
```

#### **"Connection timed out"**
```cmd
# ファイアウォール確認
netsh advfirewall show allprofiles
```

#### **"Authentication failed"**
- パスワードの再確認
- Supabaseダッシュボードでパスワードリセット

### **最終手段: ブラウザ経由**

Direct connectionが全く使えない場合：
1. **変換済みSQLファイル**を**分割版**でダウンロード
2. **Supabase SQL Editor**で段階的実行
3. **約60バッチ**を順次実行

## **推奨順序**

1. ✅ **ネットワーク接続確認**
2. ✅ **正しい接続文字列確認**
3. ✅ **pgAdmin使用**
4. ✅ **ファイアウォール設定**
5. ✅ **分割版SQLでブラウザ実行**

まずはネットワーク接続の確認から始めてください！