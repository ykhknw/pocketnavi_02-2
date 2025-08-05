# Supabase設定ガイド

## 1. 環境変数の設定

プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下の内容を追加してください：

```env
# Supabase設定
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# その他のAPI設定
VITE_USE_API=false
VITE_USE_PLANETSCALE=false
VITE_API_URL=http://localhost:3001
```

## 2. Supabaseプロジェクトの設定

### 2.1 Supabaseプロジェクトの作成
1. [Supabase](https://supabase.com) にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAPIキーを取得

### 2.2 データベーステーブルの作成

以下のSQLを実行してテーブルを作成してください：

```sql
-- 建築物テーブル
CREATE TABLE buildings_table_2 (
  building_id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  titleEn VARCHAR(500),
  thumbnailUrl TEXT,
  youtubeUrl TEXT,
  completionYears VARCHAR(10),
  parentBuildingTypes TEXT,
  parentBuildingTypesEn TEXT,
  buildingTypes TEXT,
  buildingTypesEn TEXT,
  parentStructures TEXT,
  parentStructuresEn TEXT,
  structures TEXT,
  structuresEn TEXT,
  prefectures VARCHAR(100),
  prefecturesEn VARCHAR(100),
  areas VARCHAR(100),
  areasEn VARCHAR(100),
  location TEXT,
  locationEn_from_datasheetChunkEn TEXT,
  architectDetails TEXT,
  datasheetChunkEn TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 建築家テーブル
CREATE TABLE architects_table (
  architect_id SERIAL PRIMARY KEY,
  architectJa VARCHAR(255) NOT NULL,
  architectEn VARCHAR(255)
);

-- 建築物-建築家関連テーブル
CREATE TABLE building_architects (
  building_id INTEGER REFERENCES buildings_table_2(building_id),
  architect_id INTEGER REFERENCES architects_table(architect_id),
  architect_order INTEGER DEFAULT 1,
  PRIMARY KEY (building_id, architect_id)
);

-- 建築家ウェブサイトテーブル
CREATE TABLE architect_websites_3 (
  website_id SERIAL PRIMARY KEY,
  architect_id INTEGER REFERENCES architects_table(architect_id),
  url TEXT,
  architectJa VARCHAR(255) NOT NULL,
  architectEn VARCHAR(255),
  invalid BOOLEAN DEFAULT FALSE,
  title VARCHAR(500)
);

-- 写真テーブル
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES buildings_table_2(building_id),
  url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 RLS（Row Level Security）の設定

```sql
-- RLSを有効化
ALTER TABLE buildings_table_2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE architects_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_architects ENABLE ROW LEVEL SECURITY;
ALTER TABLE architect_websites_3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーに読み取り権限を付与
CREATE POLICY "Allow anonymous read access" ON buildings_table_2 FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON architects_table FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON building_architects FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON architect_websites_3 FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access" ON photos FOR SELECT USING (true);
```

## 3. データのインポート

### 3.1 サンプルデータの挿入

```sql
-- 建築家データの挿入
INSERT INTO architects_table (architectJa, architectEn) VALUES
('安藤忠雄', 'Tadao Ando'),
('黒川紀章', 'Kisho Kurokawa'),
('隈研吾', 'Kengo Kuma'),
('丹下健三', 'Kenzo Tange');

-- 建築物データの挿入（サンプル）
INSERT INTO buildings_table_2 (
  uid, title, titleEn, completionYears, prefectures, areas, location, lat, lng
) VALUES
('building_001', '21_21 DESIGN SIGHT', '21_21 DESIGN SIGHT', '2007', '東京都', '港区', '東京都港区赤坂9-7-6', 35.6762, 139.7263),
('building_002', '国立新美術館', 'The National Art Center Tokyo', '2007', '東京都', '港区', '東京都港区六本木7-22-2', 35.6655, 139.7277);
```

## 4. 動作確認

1. 開発サーバーを起動：`npm run dev`
2. ブラウザでアプリケーションにアクセス
3. コンソールでSupabase接続のログを確認
4. 建築物リストが表示されることを確認

## 5. トラブルシューティング

### 5.1 環境変数が読み込まれない場合
- `.env` ファイルがプロジェクトルートにあることを確認
- ファイル名が正確に `.env` であることを確認
- 開発サーバーを再起動

### 5.2 Supabase接続エラー
- URLとAPIキーが正しいことを確認
- ネットワーク接続を確認
- Supabaseプロジェクトが有効であることを確認

### 5.3 データが表示されない場合
- データベースにデータが挿入されていることを確認
- RLSポリシーが正しく設定されていることを確認
- テーブル名が正しいことを確認 