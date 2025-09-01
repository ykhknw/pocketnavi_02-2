import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Slugを生成する関数
 * @param {string} text - 英語名
 * @param {Set} existingSlugs - 既存のslug一覧
 * @returns {string} - ユニークなslug
 */
function generateUniqueSlug(text, existingSlugs) {
  if (!text || text.trim() === '') {
    return '';
  }

  // 基本的な正規化
  let baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/[・＆]/g, '-')           // 全角中点、全角アンパサンドをハイフンに
    .replace(/\s*[&+]\s*/g, '-')      // &, + をハイフンに（前後のスペース除去）
    .replace(/\s+/g, '-')             // 複数スペースをハイフンに
    .replace(/[φΦ]/g, 'phi')          // ファイをphiに変換
    .replace(/[^a-z0-9-]/g, '')       // 英数字とハイフンのみ残す
    .replace(/-+/g, '-')              // 連続するハイフンを1つに
    .replace(/^-|-$/g, '');           // 先頭末尾のハイフン除去

  if (baseSlug === '') {
    baseSlug = 'architect';
  }

  // 重複チェックと連番付与
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  existingSlugs.add(slug);
  return slug;
}

/**
 * メインの処理関数
 * @param {string} inputFilePath - 入力TSVファイルのパス
 */
async function processArchitectData(inputFilePath) {
  try {
    // ファイル読み込み（ES moduleではreadFileSyncをそのまま使用）
    const data = fs.readFileSync(inputFilePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    console.log(`読み込み行数: ${lines.length}`);
    
    // 個別建築家のマップ（重複除去用）
    const individualArchitectsMap = new Map();
    const existingSlugs = new Set();
    
    // 重複分析用のマップ
    const nameJaDuplicates = new Map();  // 日本語名 → 出現回数と詳細
    const nameEnDuplicates = new Map();  // 英語名 → 出現回数と詳細
    const allIndividuals = [];           // 全個別建築家のリスト
    
    // 構成データ
    const compositions = [];
    
    // エラーリスト
    const errors = [];
    
    let individualArchitectId = 1;
    
    // 各行を処理
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split('\t');
      if (columns.length < 3) {
        errors.push({
          line: i + 1,
          error: 'カラム数不足',
          data: line
        });
        continue;
      }
      
//      const [architectId, architectJa, architectEn] = columns;
      const [architectId, architectJa, architectEn_ORG, dummy, architectEn] = columns;
      
      // パイプで分割
      const jaElements = architectJa.split('|')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      const enElements = architectEn.split('|')
        .map(item => item.trim())
        .filter(item => item !== '');
      
      // 要素数チェック
      if (jaElements.length !== enElements.length) {
        errors.push({
          line: i + 1,
          architectId: architectId,
          error: '日英要素数不一致',
          jaCount: jaElements.length,
          enCount: enElements.length,
          jaElements: jaElements,
          enElements: enElements
        });
        continue;
      }
      
      // 各個別建築家を処理
      for (let j = 0; j < jaElements.length; j++) {
        const nameJa = jaElements[j];
        const nameEn = enElements[j];
        
        // 重複分析用のデータ収集
        const individualInfo = {
          nameJa: nameJa,
          nameEn: nameEn,
          sourceArchitectId: architectId,
          sourceLine: i + 1
        };
        
        allIndividuals.push(individualInfo);
        
        // 日本語名の重複カウント
        if (!nameJaDuplicates.has(nameJa)) {
          nameJaDuplicates.set(nameJa, []);
        }
        nameJaDuplicates.get(nameJa).push(individualInfo);
        
        // 英語名の重複カウント
        if (!nameEnDuplicates.has(nameEn)) {
          nameEnDuplicates.set(nameEn, []);
        }
        nameEnDuplicates.get(nameEn).push(individualInfo);
        
        // より厳密な既存チェック用のキー（日本語名+英語名の組み合わせで判定）
        const key = `${nameJa}|||${nameEn}`;  // 区切り文字として|||を使用
        
        let currentIndividualId;
        
        if (individualArchitectsMap.has(key)) {
          // 既存の場合は既存IDを使用
          currentIndividualId = individualArchitectsMap.get(key).id;
        } else {
          // 新規の場合はslugを生成して登録
          const slug = generateUniqueSlug(nameEn, existingSlugs);
          
          individualArchitectsMap.set(key, {
            id: individualArchitectId,
            nameJa: nameJa,
            nameEn: nameEn,
            slug: slug
          });
          
          currentIndividualId = individualArchitectId;
          individualArchitectId++;
        }
        
        // 構成データに追加
        compositions.push({
          architectId: parseInt(architectId),
          individualArchitectId: currentIndividualId,
          orderIndex: j + 1
        });
      }
    }
    
    // 重複分析の実行
    console.log('\n' + '='.repeat(60));
    console.log('重複分析結果');
    console.log('='.repeat(60));
    
    const duplicateAnalysisResult = await analyzeDuplicates(nameJaDuplicates, nameEnDuplicates, allIndividuals);
    
    // 結果出力
    console.log('\n' + '='.repeat(40));
    console.log('処理結果サマリー');
    console.log('='.repeat(40));
    console.log(`全個別建築家（延べ数）: ${allIndividuals.length}`);
    console.log(`ユニークな個別建築家数: ${individualArchitectsMap.size}`);
    console.log(`構成関係数: ${compositions.length}`);
    console.log(`エラー数: ${errors.length}`);
    
    // エラー表示
    if (errors.length > 0) {
      console.log('\n' + '='.repeat(40));
      console.log('エラー詳細');
      console.log('='.repeat(40));
      errors.forEach(error => {
        console.log(`行${error.line}: ${error.error}`);
        if (error.jaCount !== undefined) {
          console.log(`  日本語要素数: ${error.jaCount}, 英語要素数: ${error.enCount}`);
          console.log(`  日本語要素: [${error.jaElements.join(', ')}]`);
          console.log(`  英語要素: [${error.enElements.join(', ')}]`);
        }
        console.log(`  データ: ${error.data}`);
        console.log('');
      });
    }
    
    // ファイル生成の確認
    console.log('\n' + '='.repeat(40));
    console.log('ファイル生成について');
    console.log('='.repeat(40));
    console.log('上記の分析結果を確認してください。');
    console.log('問題がなければ、SQLファイルとCSVファイルを生成しますか？');
    console.log('');
    
    // 処理結果を返す（ファイル生成用）
    return {
      individualArchitectsMap,
      compositions,
      errors,
      duplicateAnalysis: duplicateAnalysisResult
    };
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    return null;
  }
}

/**
 * 重複分析の実行
 */
async function analyzeDuplicates(nameJaDuplicates, nameEnDuplicates, allIndividuals) {
  
  // 日本語名の重複分析
  console.log('\n📋 日本語名（name_ja）の重複分析:');
  console.log('-'.repeat(40));
  
  const jaDuplicates = Array.from(nameJaDuplicates.entries())
    .filter(([name, occurrences]) => occurrences.length > 1)
    .sort(([,a], [,b]) => b.length - a.length); // 出現回数で降順ソート
  
  if (jaDuplicates.length === 0) {
    console.log('✅ 日本語名に重複はありません');
  } else {
    console.log(`❌ 重複している日本語名: ${jaDuplicates.length}件`);
    console.log('');
    
    jaDuplicates.slice(0, 10).forEach(([name, occurrences]) => {
      console.log(`"${name}" (${occurrences.length}回出現):`);
      occurrences.forEach(info => {
        console.log(`  └ 英語名: "${info.nameEn}" (architect_id: ${info.sourceArchitectId}, 行: ${info.sourceLine})`);
      });
      console.log('');
    });
    
    if (jaDuplicates.length > 10) {
      console.log(`... 他 ${jaDuplicates.length - 10}件の重複あり`);
    }
  }
  
  // 英語名の重複分析
  console.log('\n🔤 英語名（name_en）の重複分析:');
  console.log('-'.repeat(40));
  
  const enDuplicates = Array.from(nameEnDuplicates.entries())
    .filter(([name, occurrences]) => occurrences.length > 1)
    .sort(([,a], [,b]) => b.length - a.length); // 出現回数で降順ソート
  
  if (enDuplicates.length === 0) {
    console.log('✅ 英語名に重複はありません');
  } else {
    console.log(`❌ 重複している英語名: ${enDuplicates.length}件`);
    console.log('');
    
    enDuplicates.slice(0, 10).forEach(([name, occurrences]) => {
      console.log(`"${name}" (${occurrences.length}回出現):`);
      occurrences.forEach(info => {
        console.log(`  └ 日本語名: "${info.nameJa}" (architect_id: ${info.sourceArchitectId}, 行: ${info.sourceLine})`);
      });
      console.log('');
    });
    
    if (enDuplicates.length > 10) {
      console.log(`... 他 ${enDuplicates.length - 10}件の重複あり`);
    }
  }

  // 🆕 特殊ケース分析: 日本語名は重複しているが英語名が異なるケース
  console.log('\n🔄 特殊ケース分析 - 日本語名重複＋英語名異なる:');
  console.log('-'.repeat(50));
  
  const jaSameEnDifferent = jaDuplicates.filter(([jaName, occurrences]) => {
    // 同じ日本語名で、異なる英語名を持つかチェック
    const uniqueEnNames = new Set(occurrences.map(occ => occ.nameEn));
    return uniqueEnNames.size > 1;
  });

  if (jaSameEnDifferent.length === 0) {
    console.log('✅ 日本語名は同じで英語名が異なるケースはありません');
  } else {
    console.log(`⚠️  日本語名は同じで英語名が異なるケース: ${jaSameEnDifferent.length}件`);
    console.log('⚠️  これらは別々のindividual_architectとして作成されます');
    console.log('');
    
    jaSameEnDifferent.forEach(([jaName, occurrences]) => {
      console.log(`📌 日本語名: "${jaName}"`);
      const uniqueEnNames = [...new Set(occurrences.map(occ => occ.nameEn))];
      console.log(`   → ${uniqueEnNames.length}種類の異なる英語名:`);
      
      uniqueEnNames.forEach(enName => {
        const matchingOccs = occurrences.filter(occ => occ.nameEn === enName);
        console.log(`     • "${enName}" (${matchingOccs.length}回出現)`);
        matchingOccs.forEach(occ => {
          console.log(`       - architect_id: ${occ.sourceArchitectId} (行: ${occ.sourceLine})`);
        });
      });
      console.log('');
    });
  }

  // 🆕 特殊ケース分析: 英語名は重複しているが日本語名が異なるケース
  console.log('\n🔄 特殊ケース分析 - 英語名重複＋日本語名異なる:');
  console.log('-'.repeat(50));
  
  const enSameJaDifferent = enDuplicates.filter(([enName, occurrences]) => {
    // 同じ英語名で、異なる日本語名を持つかチェック
    const uniqueJaNames = new Set(occurrences.map(occ => occ.nameJa));
    return uniqueJaNames.size > 1;
  });

  if (enSameJaDifferent.length === 0) {
    console.log('✅ 英語名は同じで日本語名が異なるケースはありません');
  } else {
    console.log(`⚠️  英語名は同じで日本語名が異なるケース: ${enSameJaDifferent.length}件`);
    console.log('⚠️  これらは別々のindividual_architectとして作成されます');
    console.log('');
    
    enSameJaDifferent.forEach(([enName, occurrences]) => {
      console.log(`📌 英語名: "${enName}"`);
      const uniqueJaNames = [...new Set(occurrences.map(occ => occ.nameJa))];
      console.log(`   → ${uniqueJaNames.length}種類の異なる日本語名:`);
      
      uniqueJaNames.forEach(jaName => {
        const matchingOccs = occurrences.filter(occ => occ.nameJa === jaName);
        console.log(`     • "${jaName}" (${matchingOccs.length}回出現)`);
        matchingOccs.forEach(occ => {
          console.log(`       - architect_id: ${occ.sourceArchitectId} (行: ${occ.sourceLine})`);
        });
      });
      console.log('');
    });
  }
  
  // 重複統計
  console.log('\n📊 重複統計:');
  console.log('-'.repeat(40));
  
  const totalJaNames = nameJaDuplicates.size;
  const duplicateJaNames = jaDuplicates.length;
  const totalEnNames = nameEnDuplicates.size;
  const duplicateEnNames = enDuplicates.length;
  
  console.log(`日本語名: 全${totalJaNames}種類中、${duplicateJaNames}種類が重複 (${(duplicateJaNames/totalJaNames*100).toFixed(1)}%)`);
  console.log(`英語名: 全${totalEnNames}種類中、${duplicateEnNames}種類が重複 (${(duplicateEnNames/totalEnNames*100).toFixed(1)}%)`);
  console.log(`特殊ケース: 日本語重複・英語異なる = ${jaSameEnDifferent.length}件`);
  console.log(`特殊ケース: 英語重複・日本語異なる = ${enSameJaDifferent.length}件`);
  
  // 最も多い重複
  if (jaDuplicates.length > 0) {
    const maxJaDup = jaDuplicates[0];
    console.log(`最も多い日本語名重複: "${maxJaDup[0]}" (${maxJaDup[1].length}回)`);
  }
  
  if (enDuplicates.length > 0) {
    const maxEnDup = enDuplicates[0];
    console.log(`最も多い英語名重複: "${maxEnDup[0]}" (${maxEnDup[1].length}回)`);
  }
  
  // 重複詳細をCSVで出力
  if (jaDuplicates.length > 0 || enDuplicates.length > 0 || jaSameEnDifferent.length > 0 || enSameJaDifferent.length > 0) {
    await generateDuplicateAnalysisFiles(jaDuplicates, enDuplicates, jaSameEnDifferent, enSameJaDifferent);
    console.log('\n📄 重複詳細をCSVファイルに出力しました:');
    console.log('- duplicate_analysis_ja.csv (日本語名重複)');
    console.log('- duplicate_analysis_en.csv (英語名重複)');
    if (jaSameEnDifferent.length > 0) {
      console.log('- duplicate_ja_same_en_different.csv (日本語同・英語異)');
    }
    if (enSameJaDifferent.length > 0) {
      console.log('- duplicate_en_same_ja_different.csv (英語同・日本語異)');
    }
  }
  
  // 分析結果を返す
  return {
    jaDuplicates: jaDuplicates.length,
    enDuplicates: enDuplicates.length,
    jaSameEnDifferent: jaSameEnDifferent.length,
    enSameJaDifferent: enSameJaDifferent.length,
    totalJaNames,
    totalEnNames
  };
}

/**
 * SQLファイル生成
 */
async function generateSQLFiles(individualArchitectsMap, compositions) {
  // individual_architects テーブルのSQL
  let individualSQL = `-- individual_architects テーブル作成・データ投入
CREATE TABLE IF NOT EXISTS individual_architects (
  individual_architect_id INT PRIMARY KEY,
  name_ja VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- データ削除（再実行対応）
DELETE FROM individual_architects;

-- データ挿入
INSERT INTO individual_architects (individual_architect_id, name_ja, name_en, slug) VALUES\n`;

  const individualValues = Array.from(individualArchitectsMap.values())
    .map(arch => `(${arch.id}, '${arch.nameJa.replace(/'/g, "''")}', '${arch.nameEn.replace(/'/g, "''")}', '${arch.slug}')`)
    .join(',\n');
  
  individualSQL += individualValues + ';\n';
  
  fs.writeFileSync('individual_architects.sql', individualSQL, 'utf8');
  
  // architect_compositions テーブルのSQL
  let compositionSQL = `-- architect_compositions テーブル作成・データ投入
CREATE TABLE IF NOT EXISTS architect_compositions (
  composition_id INT AUTO_INCREMENT PRIMARY KEY,
  architect_id INT NOT NULL,
  individual_architect_id INT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (individual_architect_id) REFERENCES individual_architects(individual_architect_id),
  INDEX idx_architect_id (architect_id),
  INDEX idx_individual_architect_id (individual_architect_id)
);

-- データ削除（再実行対応）
DELETE FROM architect_compositions;

-- データ挿入
INSERT INTO architect_compositions (architect_id, individual_architect_id, order_index) VALUES\n`;

  const compositionValues = compositions
    .map(comp => `(${comp.architectId}, ${comp.individualArchitectId}, ${comp.orderIndex})`)
    .join(',\n');
  
  compositionSQL += compositionValues + ';\n';
  
  fs.writeFileSync('architect_compositions.sql', compositionSQL, 'utf8');
}

/**
 * 重複分析結果をCSVファイルに出力
 */
async function generateDuplicateAnalysisFiles(jaDuplicates, enDuplicates, jaSameEnDifferent = [], enSameJaDifferent = []) {
  // 日本語名重複のCSV
  if (jaDuplicates.length > 0) {
    let jaCSV = 'duplicate_name_ja,occurrence_count,name_en,source_architect_id,source_line\n';
    jaDuplicates.forEach(([name, occurrences]) => {
      occurrences.forEach(info => {
        jaCSV += `"${name}",${occurrences.length},"${info.nameEn}",${info.sourceArchitectId},${info.sourceLine}\n`;
      });
    });
    fs.writeFileSync('duplicate_analysis_ja.csv', jaCSV, 'utf8');
  }
  
  // 英語名重複のCSV  
  if (enDuplicates.length > 0) {
    let enCSV = 'duplicate_name_en,occurrence_count,name_ja,source_architect_id,source_line\n';
    enDuplicates.forEach(([name, occurrences]) => {
      occurrences.forEach(info => {
        enCSV += `"${name}",${occurrences.length},"${info.nameJa}",${info.sourceArchitectId},${info.sourceLine}\n`;
      });
    });
    fs.writeFileSync('duplicate_analysis_en.csv', enCSV, 'utf8');
  }

  // 🆕 特殊ケース: 日本語名同・英語名異
  if (jaSameEnDifferent.length > 0) {
    let jaSameEnDiffCSV = 'name_ja,unique_en_count,name_en,occurrence_count,source_architect_id,source_line\n';
    jaSameEnDifferent.forEach(([jaName, occurrences]) => {
      const uniqueEnNames = [...new Set(occurrences.map(occ => occ.nameEn))];
      uniqueEnNames.forEach(enName => {
        const matchingOccs = occurrences.filter(occ => occ.nameEn === enName);
        matchingOccs.forEach(occ => {
          jaSameEnDiffCSV += `"${jaName}",${uniqueEnNames.length},"${enName}",${matchingOccs.length},${occ.sourceArchitectId},${occ.sourceLine}\n`;
        });
      });
    });
    fs.writeFileSync('duplicate_ja_same_en_different.csv', jaSameEnDiffCSV, 'utf8');
  }

  // 🆕 特殊ケース: 英語名同・日本語名異
  if (enSameJaDifferent.length > 0) {
    let enSameJaDiffCSV = 'name_en,unique_ja_count,name_ja,occurrence_count,source_architect_id,source_line\n';
    enSameJaDifferent.forEach(([enName, occurrences]) => {
      const uniqueJaNames = [...new Set(occurrences.map(occ => occ.nameJa))];
      uniqueJaNames.forEach(jaName => {
        const matchingOccs = occurrences.filter(occ => occ.nameJa === jaName);
        matchingOccs.forEach(occ => {
          enSameJaDiffCSV += `"${enName}",${uniqueJaNames.length},"${jaName}",${matchingOccs.length},${occ.sourceArchitectId},${occ.sourceLine}\n`;
        });
      });
    });
    fs.writeFileSync('duplicate_en_same_ja_different.csv', enSameJaDiffCSV, 'utf8');
  }
}

/**
 * SQLファイル生成（個別関数として分離）
 */
async function generateFiles(individualArchitectsMap, compositions) {
  await generateSQLFiles(individualArchitectsMap, compositions);
  await generateCSVFiles(individualArchitectsMap, compositions);
  
  console.log('\n' + '='.repeat(40));
  console.log('ファイル生成完了');
  console.log('='.repeat(40));
  console.log('- individual_architects.sql');
  console.log('- architect_compositions.sql');
  console.log('- individual_architects.csv');
  console.log('- architect_compositions.csv');
}

/**
 * CSV確認ファイル生成
 */
async function generateCSVFiles(individualArchitectsMap, compositions) {
  // individual_architects.csv
  let individualCSV = 'individual_architect_id,name_ja,name_en,slug\n';
  individualCSV += Array.from(individualArchitectsMap.values())
    .map(arch => `${arch.id},"${arch.nameJa}","${arch.nameEn}","${arch.slug}"`)
    .join('\n');
  
  fs.writeFileSync('individual_architects.csv', individualCSV, 'utf8');
  
  // architect_compositions.csv
  let compositionCSV = 'architect_id,individual_architect_id,order_index\n';
  compositionCSV += compositions
    .map(comp => `${comp.architectId},${comp.individualArchitectId},${comp.orderIndex}`)
    .join('\n');
  
  fs.writeFileSync('architect_compositions.csv', compositionCSV, 'utf8');
}

// 使用例とメイン実行部分
console.log('建築家データ処理・重複分析スクリプト');
console.log('使用方法: node process-architect-data.js architects_table.txt');
console.log('');

// コマンドライン引数からファイルパスを取得
const inputFile = process.argv[2] || 'architects_table.txt';

if (fs.existsSync(inputFile)) {
  // 1. まず重複分析を実行
  const result = await processArchitectData(inputFile);
  
  if (result) {
    // 2. ファイル生成を実行する場合は、下記のコメントを外してください
    console.log('\n⚠️  ファイル生成を実行するには、下記をコメントアウトしてください:');
    console.log('   行番号を確認して、コメント記号 // を削除してください');
    console.log('');
    
    // ↓↓↓ ファイル生成を実行する場合は、この部分のコメントを外してください ↓↓↓
    // console.log('📁 SQLファイルとCSVファイルを生成中...');
    // await generateFiles(result.individualArchitectsMap, result.compositions);
    // console.log('✅ ファイル生成完了！');
    // ↑↑↑ ここまでのコメントを外してください ↑↑↑
    
  }
} else {
  console.error(`❌ ファイルが見つかりません: ${inputFile}`);
  console.log('TSVファイル（タブ区切り）を準備して、ファイルパスを指定してください。');
  console.log('例: node process-architect-data.js your_architects_table.txt');
}

 