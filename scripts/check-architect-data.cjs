const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabaseクライアント設定
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL または Service Role Key が設定されていません');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 建築家データの確認
async function checkArchitectData() {
  console.log('🔍 建築家データの詳細確認中...\n');

  try {
    // 1. 全角スペースが含まれているレコードを検索
    console.log('📋 全角スペースが含まれているレコードを検索中...');
    const { data: architects, error: architectsError } = await supabase
      .from('architects_table')
      .select('architect_id, architectJa, architectEn, slug')
      .order('architect_id');

    if (architectsError) {
      throw new Error('建築家データ取得エラー: ' + architectsError.message);
    }

    // 全角スペースが含まれているレコードをフィルタリング
    const recordsWithFullWidthSpace = architects.filter(architect => 
      architect.architectJa && architect.architectJa.includes('　')
    );

    console.log(`✅ 全角スペースが含まれているレコード: ${recordsWithFullWidthSpace.length}件\n`);

    // 2. 各レコードの詳細を表示
    recordsWithFullWidthSpace.forEach((architect, index) => {
      console.log(`${index + 1}. ID: ${architect.architect_id}`);
      console.log(`   建築家名: "${architect.architectJa}"`);
      console.log(`   英語名: "${architect.architectEn}"`);
      console.log(`   スラッグ: "${architect.slug}"`);
      
      // 全角スペースで分割した結果を表示
      const splitNames = architect.architectJa.split('　').filter(name => name.trim());
      console.log(`   分割結果: [${splitNames.map(name => `"${name}"`).join(', ')}]`);
      console.log(`   分割数: ${splitNames.length}`);
      console.log('');
    });

    // 3. 正規化データとの比較
    console.log('📋 正規化データとの比較中...');
    const { data: normalizedNames, error: namesError } = await supabase
      .from('architect_names')
      .select('name_id, architect_name, slug')
      .order('name_id');

    if (namesError) {
      throw new Error('正規化データ取得エラー: ' + namesError.message);
    }

    const { data: relations, error: relationsError } = await supabase
      .from('architect_name_relations')
      .select('relation_id, architect_id, name_id')
      .order('relation_id');

    if (relationsError) {
      throw new Error('関連付けデータ取得エラー: ' + relationsError.message);
    }

    // 関連付けマップを作成
    const relationMap = new Map();
    relations.forEach(rel => {
      if (!relationMap.has(rel.architect_id)) {
        relationMap.set(rel.architect_id, []);
      }
      relationMap.get(rel.architect_id).push(rel.name_id);
    });

    const normalizedNameMap = new Map();
    normalizedNames.forEach(name => {
      normalizedNameMap.set(name.name_id, name);
    });

    console.log('\n📊 正規化処理の結果確認:');
    recordsWithFullWidthSpace.forEach((architect, index) => {
      const nameIds = relationMap.get(architect.architect_id) || [];
      const normalizedData = nameIds.map(nameId => normalizedNameMap.get(nameId)).filter(Boolean);
      
      console.log(`${index + 1}. ID: ${architect.architect_id} - "${architect.architectJa}"`);
      console.log(`   正規化処理済み: ${normalizedData.length > 0 ? '✅' : '❌'}`);
      console.log(`   正規化名: ${normalizedData.map(n => n.architect_name).join(' | ') || 'なし'}`);
      console.log(`   正規化スラッグ: ${normalizedData.map(n => n.slug).join(' | ') || 'なし'}`);
      console.log('');
    });

    // 4. 問題のあるレコードの特定
    const problematicRecords = recordsWithFullWidthSpace.filter(architect => {
      const nameIds = relationMap.get(architect.architect_id) || [];
      return nameIds.length === 0;
    });

    if (problematicRecords.length > 0) {
      console.log('⚠️ 正規化処理されていないレコード:');
      problematicRecords.forEach((architect, index) => {
        console.log(`${index + 1}. ID: ${architect.architect_id} - "${architect.architectJa}"`);
      });
      console.log('');
    }

    // 5. 統計情報
    console.log('📈 統計情報:');
    console.log(`   - 総建築家数: ${architects.length}件`);
    console.log(`   - 全角スペース含む: ${recordsWithFullWidthSpace.length}件`);
    console.log(`   - 正規化処理済み: ${recordsWithFullWidthSpace.length - problematicRecords.length}件`);
    console.log(`   - 正規化未処理: ${problematicRecords.length}件`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
checkArchitectData();
