// scripts/update-slugs.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

// Supabaseクライアント設定
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL または Service Role Key が設定されていません');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Slug生成関数
function generateSlug(titleEn: string, id: number): string {
  if (!titleEn || titleEn.trim() === '') {
    return `building-${id}`;
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

// 重複解決機能
async function resolveDuplicateSlugs(slugs: string[]): Promise<string[]> {
  const resolvedSlugs: string[] = [];
  const slugCount: { [key: string]: number } = {};

  for (const slug of slugs) {
    if (!slugCount[slug]) {
      slugCount[slug] = 1;
      resolvedSlugs.push(slug);
    } else {
      slugCount[slug]++;
      const newSlug = `${slug}-${slugCount[slug]}`;
      resolvedSlugs.push(newSlug);
    }
  }

  return resolvedSlugs;
}

// バッチ処理関数
async function updateBatch(
  buildings: any[], 
  batchNumber: number, 
  totalBatches: number
): Promise<{ success: number; errors: any[] }> {
  console.log(`\n🔄 バッチ ${batchNumber}/${totalBatches} を処理中...`);
  
  const results = [];
  const errors = [];

  // Slugを生成
  const slugs = buildings.map(building => 
    generateSlug(building.titleEn, building.id)
  );

  // 重複を解決
  const resolvedSlugs = await resolveDuplicateSlugs(slugs);

  // 更新データを準備
  const updates = buildings.map((building, index) => ({
    id: building.id,
    slug: resolvedSlugs[index]
  }));

  try {
    // バッチ更新を実行
    const { data, error } = await supabase
      .from('buildings_table_2')
      .upsert(updates, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`❌ バッチ ${batchNumber} でエラー:`, error);
      errors.push({ batch: batchNumber, error });
      return { success: 0, errors };
    }

    console.log(`✅ バッチ ${batchNumber} 完了: ${buildings.length}件更新`);
    return { success: buildings.length, errors: [] };

  } catch (error) {
    console.error(`❌ バッチ ${batchNumber} で例外:`, error);
    errors.push({ batch: batchNumber, error });
    return { success: 0, errors };
  }
}

// メイン実行関数
async function updateAllSlugs() {
  console.log('🚀 Slug更新プロセスを開始します...');
  console.log('⚠️  必ず事前にバックアップを取得してください！\n');

  try {
    // 1. データ総数を確認
    console.log('📊 データ総数を確認中...');
    const { count, error: countError } = await supabase
      .from('buildings_table_2')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`データ総数取得エラー: ${countError.message}`);
    }

    console.log(`📈 総データ数: ${count}件`);

    // 2. 全データを取得（段階的に）
    const BATCH_SIZE = 100;
    const totalBatches = Math.ceil(count! / BATCH_SIZE);
    let totalSuccess = 0;
    let totalErrors: any[] = [];

    console.log(`�� ${totalBatches}バッチに分けて処理します（バッチサイズ: ${BATCH_SIZE}件）`);

    for (let batchNumber = 1; batchNumber <= totalBatches; batchNumber++) {
      const offset = (batchNumber - 1) * BATCH_SIZE;

      // バッチデータを取得
      const { data: buildings, error: fetchError } = await supabase
        .from('buildings_table_2')
        .select('id, titleEn')
        .range(offset, offset + BATCH_SIZE - 1)
        .order('id');

      if (fetchError) {
        console.error(`❌ バッチ ${batchNumber} データ取得エラー:`, fetchError);
        totalErrors.push({ batch: batchNumber, error: fetchError });
        continue;
      }

      if (!buildings || buildings.length === 0) {
        console.log(`⚠️  バッチ ${batchNumber}: データなし`);
        continue;
      }

      // バッチ処理実行
      const result = await updateBatch(buildings, batchNumber, totalBatches);
      totalSuccess += result.success;
      totalErrors.push(...result.errors);

      // 進捗表示
      const progress = ((batchNumber / totalBatches) * 100).toFixed(1);
      console.log(`�� 進捗: ${progress}% (${totalSuccess}件成功)`);

      // レート制限対策: バッチ間に待機
      if (batchNumber < totalBatches) {
        console.log('⏳ 次のバッチまで待機中...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
      }
    }

    // 結果サマリー
    console.log('\n📋 処理完了サマリー');
    console.log('='.repeat(50));
    console.log(`✅ 成功: ${totalSuccess}件`);
    console.log(`❌ エラー: ${totalErrors.length}件`);
    
    if (totalErrors.length > 0) {
      console.log('\n⚠️  エラー詳細:');
      totalErrors.forEach((error, index) => {
        console.log(`${index + 1}. バッチ ${error.batch}: ${error.error.message || error.error}`);
      });
    }

    console.log('\n🎉 処理が完了しました！');
    console.log('📝 データ検証を必ず実行してください。');

  } catch (error) {
    console.error('💥 致命的なエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  updateAllSlugs().catch(console.error);
}

export { updateAllSlugs, generateSlug, resolveDuplicateSlugs };