// scripts/resolve-slug-duplicates.cjs
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

// 重複するslugを取得する関数
async function getDuplicatedSlugs() {
  console.log('🔍 重複するslugを検索中...');
  
  const { data: allSlugs, error } = await supabase
    .from('buildings_table_2')
    .select('slug')
    .not('slug', 'is', null);

  if (error) {
    throw new Error('slug取得エラー: ' + error.message);
  }

  // 重複をカウント
  const slugCounts = {};
  allSlugs.forEach(item => {
    slugCounts[item.slug] = (slugCounts[item.slug] || 0) + 1;
  });

  // 重複があるslugのみ返す
  const duplicatedSlugs = Object.keys(slugCounts).filter(slug => slugCounts[slug] > 1);
  
  console.log(`📊 重複するslug: ${duplicatedSlugs.length}件`);
  
  return duplicatedSlugs;
}

// 単一のslugの重複を解決する関数
async function resolveSingleSlugDuplicate(slug) {
  console.log(`\n🔄 "${slug}" の重複解決中...`);
  
  // 該当するすべての建築物を取得（building_idでソート）
  const { data: buildings, error } = await supabase
    .from('buildings_table_2')
    .select('building_id, title, slug')
    .eq('slug', slug)
    .order('building_id', { ascending: true });

  if (error) {
    console.error(`❌ "${slug}" の建築物取得エラー:`, error);
    return;
  }

  if (!buildings || buildings.length <= 1) {
    console.log(`⚠️  "${slug}" は重複していません。スキップ。`);
    return;
  }

  console.log(`�� ${buildings.length}件の重複を発見`);

  // 最初の建築物はそのまま、2番目以降に番号を付与
  for (let i = 1; i < buildings.length; i++) {
    const building = buildings[i];
    const newSlug = `${slug}-${i + 1}`;  // 2, 3, 4...

    console.log(`  building_id ${building.building_id}: "${slug}" → "${newSlug}"`);
    console.log(`    タイトル: ${building.title}`);

    const { error: updateError } = await supabase
      .from('buildings_table_2')
      .update({ slug: newSlug })
      .eq('building_id', building.building_id);

    if (updateError) {
      console.error(`    ❌ 更新エラー:`, updateError);
    } else {
      console.log(`    ✅ 更新完了`);
    }

    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// メイン実行関数
async function resolveSlugDuplicates() {
  console.log('�� Slug重複解決プロセスを開始します...\n');

  try {
    // 1. 重複するslugを取得
    const duplicatedSlugs = await getDuplicatedSlugs();

    if (duplicatedSlugs.length === 0) {
      console.log('✅ 重複するslugは見つかりませんでした。');
      return;
    }

    // 2. 重複の詳細を表示
    console.log('\n�� 重複するslug一覧:');
    duplicatedSlugs.forEach((slug, index) => {
      console.log(`${index + 1}. ${slug}`);
    });

    // 3. 各重複slugを処理
    console.log('\n🔄 重複解決を開始します...');
    let processedCount = 0;

    for (const slug of duplicatedSlugs) {
      await resolveSingleSlugDuplicate(slug);
      processedCount++;
      
      // 進捗表示
      const progress = ((processedCount / duplicatedSlugs.length) * 100).toFixed(1);
      console.log(`�� 進捗: ${progress}% (${processedCount}/${duplicatedSlugs.length})`);
    }

    // 4. 結果確認
    console.log('\n📋 処理完了サマリー');
    console.log('='.repeat(50));
    console.log(`✅ 処理完了: ${duplicatedSlugs.length}件の重複slug`);

    // 5. 最終確認
    console.log('\n🔍 最終確認中...');
    const finalDuplicatedSlugs = await getDuplicatedSlugs();
    
    if (finalDuplicatedSlugs.length === 0) {
      console.log('✅ すべての重複が解決されました！');
    } else {
      console.log(`⚠️  まだ ${finalDuplicatedSlugs.length}件の重複が残っています。`);
      console.log('残りの重複slug:', finalDuplicatedSlugs);
    }

  } catch (error) {
    console.error('💥 致命的なエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
console.log('=== Slug重複解決スクリプト開始 ===');
resolveSlugDuplicates()
  .then(() => console.log('=== 処理完了 ==='))
  .catch(error => console.error('=== エラー発生 ===', error));