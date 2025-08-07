// scripts/analyze-slugs.cjs
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

// Slug生成関数（元のスクリプトと同じ）
function generateSlug(titleEn, buildingId) {
  if (!titleEn || titleEn.trim() === '') {
    return `building-${buildingId}`;
  }

  return titleEn
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // 英数字、スペース、ハイフンのみ残す
    .replace(/\s+/g, '-') // スペースをハイフンに変換
    .replace(/-+/g, '-') // 連続するハイフンを1つに
    .replace(/^-|-$/g, '') // 先頭と末尾のハイフンを削除
    .substring(0, 100); // 最大100文字に制限
}

// 分析関数
async function analyzeSlugs() {
  console.log('🔍 Slug分析を開始します...\n');

  try {
    // 1. データ総数を確認
    console.log('📊 データ総数を確認中...');
    const { count, error: countError } = await supabase
      .from('buildings_table_2')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error('データ総数取得エラー: ' + countError.message);
    }

    console.log(`�� 総データ数: ${count}件\n`);

    // 2. 全データを取得して分析
    const BATCH_SIZE = 1000; // 大きなバッチサイズで効率化
    const totalBatches = Math.ceil(count / BATCH_SIZE);
    
    let totalRecords = 0;
    let emptyTitleEnCount = 0;
    let invalidTitleEnCount = 0;
    let validTitleEnCount = 0;
    let examples = [];

    console.log(`�� ${totalBatches}バッチで分析中...`);

    for (let batchNumber = 1; batchNumber <= totalBatches; batchNumber++) {
      const offset = (batchNumber - 1) * BATCH_SIZE;

      // バッチデータを取得
      const { data: buildings, error: fetchError } = await supabase
        .from('buildings_table_2')
        .select('building_id, titleEn')
        .range(offset, offset + BATCH_SIZE - 1)
        .order('building_id');

      if (fetchError) {
        console.error(`❌ バッチ ${batchNumber} データ取得エラー:`, fetchError);
        continue;
      }

      if (!buildings || buildings.length === 0) {
        continue;
      }

      // 各レコードを分析
      buildings.forEach(building => {
        totalRecords++;
        const titleEn = building.titleEn;
        const generatedSlug = generateSlug(titleEn, building.building_id);

        if (!titleEn || titleEn.trim() === '') {
          emptyTitleEnCount++;
          if (examples.length < 5) {
            examples.push({
              building_id: building.building_id,
              titleEn: titleEn || '(空)',
              generatedSlug: generatedSlug,
              reason: 'titleEnが空'
            });
          }
        } else {
          // titleEnが存在する場合、生成されたslugがフォールバック形式かチェック
          const expectedSlug = `building-${building.building_id}`;
          if (generatedSlug === expectedSlug) {
            invalidTitleEnCount++;
            if (examples.length < 5) {
              examples.push({
                building_id: building.building_id,
                titleEn: titleEn,
                generatedSlug: generatedSlug,
                reason: 'titleEnが無効（特殊文字のみなど）'
              });
            }
          } else {
            validTitleEnCount++;
          }
        }
      });

      // 進捗表示
      const progress = ((batchNumber / totalBatches) * 100).toFixed(1);
      console.log(` 進捗: ${progress}% (${totalRecords}件分析済み)`);
    }

    // 結果サマリー
    console.log('\n📋 分析結果サマリー');
    console.log('='.repeat(50));
    console.log(`📊 総データ数: ${totalRecords}件`);
    console.log(`✅ 有効なtitleEn: ${validTitleEnCount}件 (${((validTitleEnCount/totalRecords)*100).toFixed(1)}%)`);
    console.log(`❌ 空のtitleEn: ${emptyTitleEnCount}件 (${((emptyTitleEnCount/totalRecords)*100).toFixed(1)}%)`);
    console.log(`⚠️  無効なtitleEn: ${invalidTitleEnCount}件 (${((invalidTitleEnCount/totalRecords)*100).toFixed(1)}%)`);
    console.log(`�� フォールバック使用: ${emptyTitleEnCount + invalidTitleEnCount}件 (${(((emptyTitleEnCount + invalidTitleEnCount)/totalRecords)*100).toFixed(1)}%)`);

    if (examples.length > 0) {
      console.log('\n📝 サンプル例:');
      examples.forEach((example, index) => {
        console.log(`${index + 1}. building_id: ${example.building_id}`);
        console.log(`   titleEn: "${example.titleEn}"`);
        console.log(`   generatedSlug: "${example.generatedSlug}"`);
        console.log(`   reason: ${example.reason}`);
        console.log('');
      });
    }

    // 詳細分析
    console.log('\n🔍 詳細分析');
    console.log('='.repeat(30));
    
    if (emptyTitleEnCount > 0) {
      console.log(`�� titleEnが空のレコード: ${emptyTitleEnCount}件`);
      console.log(`   → building-{id}形式のslugが生成されます`);
    }
    
    if (invalidTitleEnCount > 0) {
      console.log(`📊 titleEnが無効なレコード: ${invalidTitleEnCount}件`);
      console.log(`   → 特殊文字のみ、または英数字以外の文字のみの場合`);
    }

    console.log('\n💡 推奨アクション');
    console.log('='.repeat(30));
    console.log('1. 空のtitleEnレコードの確認と修正');
    console.log('2. 無効なtitleEnレコードの確認と修正');
    console.log('3. 必要に応じて手動でslugを設定');

  } catch (error) {
    console.error('💥 分析中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
analyzeSlugs().catch(console.error);