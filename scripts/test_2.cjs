// scripts/update-cornes-house-slugs.cjs
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

async function updateCornesHouseSlugs() {
  console.log('🔄 "cornes-house" のslug更新を開始します...\n');

  try {
    // 現在のcornes-houseデータを取得（building_id順）
    const { data: buildings, error } = await supabase
      .from('buildings_table_2')
      .select('building_id, title, location, slug')
      .eq('slug', 'cornes-house')
      .order('building_id', { ascending: true });

    if (error) {
      throw new Error('データ取得エラー: ' + error.message);
    }

    if (!buildings || buildings.length === 0) {
      console.log('❌ "cornes-house" のデータが見つかりません。');
      return;
    }

    console.log(`📋 ${buildings.length}件のデータが見つかりました。\n`);

    // 現在のデータを表示
    console.log('📝 更新対象データ:');
    buildings.forEach((building, index) => {
      console.log(`${index + 1}. ID: ${building.building_id} | ${building.title} | ${building.location}`);
    });
    console.log();

    // 各レコードのslugを更新
    for (let i = 0; i < buildings.length; i++) {
      const building = buildings[i];
      const newSlug = `cornes-house-${i + 1}`;

      console.log(`🔄 更新中: building_id ${building.building_id}`);
      console.log(`   "${building.slug}" → "${newSlug}"`);
      console.log(`   タイトル: ${building.title}`);
      console.log(`   所在地: ${building.location}`);

      // slug更新実行
      const { error: updateError } = await supabase
        .from('buildings_table_2')
        .update({ slug: newSlug })
        .eq('building_id', building.building_id);

      if (updateError) {
        console.error(`   ❌ 更新エラー:`, updateError);
        continue;
      }

      console.log(`   ✅ 更新完了: ${newSlug}`);
      console.log('   ' + '-'.repeat(40));

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // 更新結果を確認
    console.log('\n🔍 更新結果を確認中...');
    
    const { data: updatedBuildings, error: verifyError } = await supabase
      .from('buildings_table_2')
      .select('building_id, title, slug')
      .in('building_id', buildings.map(b => b.building_id))
      .order('building_id', { ascending: true });

    if (verifyError) {
      console.error('確認エラー:', verifyError);
      return;
    }

    console.log('\n📋 更新後の状態:');
    updatedBuildings?.forEach((building, index) => {
      console.log(`${index + 1}. ID: ${building.building_id} | slug: ${building.slug} | ${building.title}`);
    });

    // 重複確認
    console.log('\n🔍 重複確認中...');
    const { data: duplicateCheck } = await supabase
      .from('buildings_table_2')
      .select('slug')
      .like('slug', 'cornes-house%');

    const slugCounts = {};
    duplicateCheck?.forEach(item => {
      slugCounts[item.slug] = (slugCounts[item.slug] || 0) + 1;
    });

    const duplicates = Object.keys(slugCounts).filter(slug => slugCounts[slug] > 1);
    
    if (duplicates.length === 0) {
      console.log('✅ 重複は解決されました！');
    } else {
      console.log('⚠️  以下のslugで重複が残っています:');
      duplicates.forEach(slug => {
        console.log(`   ${slug}: ${slugCounts[slug]}件`);
      });
    }

    console.log('\n🎉 "cornes-house" のslug更新が完了しました！');

  } catch (error) {
    console.error('💥 エラー発生:', error);
  }
}

// スクリプト実行
console.log('=== CORNES HOUSE slug更新スクリプト ===');
updateCornesHouseSlugs()
  .then(() => console.log('=== 処理完了 ==='))
  .catch(error => console.error('=== エラー発生 ===', error));