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

// CSV出力用のヘルパー関数
function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function arrayToCsvValue(array) {
  if (!Array.isArray(array)) return escapeCsvValue(array);
  return escapeCsvValue(array.join(' | '));
}

// 正規化結果の確認
async function verifyArchitectNormalization() {
  console.log('🔍 建築家名の正規化結果を確認中...\n');

  try {
    // 1. 元のarchitects_tableデータを取得
    console.log('📋 元の建築家データを取得中...');
    const { data: architects, error: architectsError } = await supabase
      .from('architects_table')
      .select('architect_id, architectJa, architectEn, slug')
      .order('architect_id');

    if (architectsError) {
      throw new Error('建築家データ取得エラー: ' + architectsError.message);
    }

    // 2. 正規化されたデータを取得
    console.log('📋 正規化データを取得中...');
    const { data: normalizedNames, error: namesError } = await supabase
      .from('architect_names')
      .select('name_id, architect_name, slug')
      .order('name_id');

    if (namesError) {
      throw new Error('正規化データ取得エラー: ' + namesError.message);
    }

    // 3. 関連付けデータを取得
    console.log('📋 関連付けデータを取得中...');
    const { data: relations, error: relationsError } = await supabase
      .from('architect_name_relations')
      .select('relation_id, architect_id, name_id')
      .order('relation_id');

    if (relationsError) {
      throw new Error('関連付けデータ取得エラー: ' + relationsError.message);
    }

    console.log(`✅ データ取得完了:`);
    console.log(`   - 元の建築家: ${architects.length}件`);
    console.log(`   - 正規化名: ${normalizedNames.length}件`);
    console.log(`   - 関連付け: ${relations.length}件\n`);

    // 4. データを整理
    const normalizedNameMap = new Map();
    normalizedNames.forEach(name => {
      normalizedNameMap.set(name.name_id, name);
    });

    const relationMap = new Map();
    relations.forEach(rel => {
      if (!relationMap.has(rel.architect_id)) {
        relationMap.set(rel.architect_id, []);
      }
      relationMap.get(rel.architect_id).push(rel.name_id);
    });

    // 5. 結果を構築
    const results = [];
    
    for (const architect of architects) {
      const nameIds = relationMap.get(architect.architect_id) || [];
      const normalizedData = nameIds.map(nameId => normalizedNameMap.get(nameId)).filter(Boolean);
      
      results.push({
        architect_id: architect.architect_id,
        architectJa: architect.architectJa,
        architectEn: architect.architectEn,
        original_slug: architect.slug,
        split_count: normalizedData.length,
        normalized_names: normalizedData.map(n => n.architect_name),
        normalized_slugs: normalizedData.map(n => n.slug),
        name_ids: nameIds
      });
    }

    // 6. 統計情報を表示
    console.log('📊 統計情報:');
    const splitCounts = results.map(r => r.split_count);
    const avgSplit = splitCounts.reduce((a, b) => a + b, 0) / splitCounts.length;
    const maxSplit = Math.max(...splitCounts);
    const minSplit = Math.min(...splitCounts);
    
    console.log(`   - 平均分割数: ${avgSplit.toFixed(2)}`);
    console.log(`   - 最大分割数: ${maxSplit}`);
    console.log(`   - 最小分割数: ${minSplit}`);
    console.log(`   - 分割されていない建築家: ${results.filter(r => r.split_count === 1).length}件`);
    console.log(`   - 複数に分割された建築家: ${results.filter(r => r.split_count > 1).length}件\n`);

    // 7. CSVファイルを生成
    console.log('📄 CSVファイルを生成中...');
    
    // 詳細版CSV
    const detailedCsv = [
      'architect_id,architectJa,architectEn,original_slug,split_count,normalized_names,normalized_slugs,name_ids'
    ];
    
    results.forEach(result => {
      detailedCsv.push([
        result.architect_id,
        escapeCsvValue(result.architectJa),
        escapeCsvValue(result.architectEn),
        escapeCsvValue(result.original_slug),
        result.split_count,
        arrayToCsvValue(result.normalized_names),
        arrayToCsvValue(result.normalized_slugs),
        arrayToCsvValue(result.name_ids)
      ].join(','));
    });

    // 簡易版CSV（分割されたもののみ）
    const splitOnlyCsv = [
      'architect_id,architectJa,split_count,normalized_names,normalized_slugs'
    ];
    
    results.filter(r => r.split_count > 1).forEach(result => {
      splitOnlyCsv.push([
        result.architect_id,
        escapeCsvValue(result.architectJa),
        result.split_count,
        arrayToCsvValue(result.normalized_names),
        arrayToCsvValue(result.normalized_slugs)
      ].join(','));
    });

    // 8. ファイルに保存
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const detailedPath = path.join(outputDir, 'architect-normalization-detailed.csv');
    const splitOnlyPath = path.join(outputDir, 'architect-normalization-split-only.csv');
    
    fs.writeFileSync(detailedPath, detailedCsv.join('\n'), 'utf8');
    fs.writeFileSync(splitOnlyPath, splitOnlyCsv.join('\n'), 'utf8');

    console.log(`✅ CSVファイルを生成しました:`);
    console.log(`   - 詳細版: ${detailedPath}`);
    console.log(`   - 分割のみ: ${splitOnlyPath}\n`);

    // 9. サンプル表示
    console.log('📝 サンプルデータ（分割されたもの）:');
    results.filter(r => r.split_count > 1).slice(0, 10).forEach((result, index) => {
      console.log(`${index + 1}. ID: ${result.architect_id}`);
      console.log(`   元の名前: ${result.architectJa}`);
      console.log(`   分割数: ${result.split_count}`);
      console.log(`   正規化名: ${result.normalized_names.join(' | ')}`);
      console.log(`   スラッグ: ${result.normalized_slugs.join(' | ')}`);
      console.log('');
    });

    if (results.filter(r => r.split_count > 1).length > 10) {
      console.log(`... 他 ${results.filter(r => r.split_count > 1).length - 10}件`);
    }

    // 10. 正規化名の一覧も生成
    console.log('\n📄 正規化名一覧を生成中...');
    const normalizedCsv = [
      'name_id,architect_name,slug,usage_count'
    ];
    
    const usageCounts = new Map();
    relations.forEach(rel => {
      const nameId = rel.name_id;
      usageCounts.set(nameId, (usageCounts.get(nameId) || 0) + 1);
    });
    
    normalizedNames.forEach(name => {
      normalizedCsv.push([
        name.name_id,
        escapeCsvValue(name.architect_name),
        name.slug,
        usageCounts.get(name.name_id) || 0
      ].join(','));
    });
    
    const normalizedPath = path.join(outputDir, 'architect-names-normalized.csv');
    fs.writeFileSync(normalizedPath, normalizedCsv.join('\n'), 'utf8');
    
    console.log(`✅ 正規化名一覧: ${normalizedPath}`);
    console.log(`   - 総正規化名数: ${normalizedNames.length}件`);
    console.log(`   - 使用回数1回: ${Array.from(usageCounts.values()).filter(count => count === 1).length}件`);
    console.log(`   - 使用回数2回以上: ${Array.from(usageCounts.values()).filter(count => count > 1).length}件`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
verifyArchitectNormalization();
