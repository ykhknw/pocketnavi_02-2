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

// スラッグ生成関数
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // 英数字、スペース、ハイフンのみ残す
    .replace(/\s+/g, '-') // スペースをハイフンに変換
    .replace(/-+/g, '-') // 連続するハイフンを1つに
    .replace(/^-|-$/g, '') // 先頭と末尾のハイフンを削除
    .substring(0, 100); // 最大100文字に制限
}

// 日本語名からスラッグ生成（日本語対応版）
function generateJapaneseSlug(name) {
  // 基本的な変換ルール
  const conversions = {
    '三菱地所': 'mitsubishi-jisho',
    '三島設計事務所': 'mishima-design',
    '日本設計': 'nihon-sekkei',
    '日建設計': 'nikken-sekkei',
    '鹿島建設': 'kajima-kensetsu',
    '大成建設': 'taisei-kensetsu',
    '清水建設': 'shimizu-kensetsu',
    '竹中工務店': 'takenaka-komuten',
    '大林組': 'obayashi-gumi',
    '安藤忠雄': 'tadao-ando',
    '隈研吾': 'kengo-kuma',
    '伊東豊雄': 'toyo-ito',
    '妹島和世': 'kazuyo-sejima',
    '西沢立衛': 'ryue-nishizawa',
    '坂茂': 'shigeru-ban',
    '藤本壮介': 'sou-fujimoto',
    '石上純也': 'junya-ishigami',
    '平田晃久': 'akihisa-hirata',
    '藤森照信': 'terunobu-fujimori',
    '原広司': 'hiroshi-hara',
    '槇文彦': 'fumihiko-maki',
    '丹下健三': 'kenzo-tange',
    '黒川紀章': 'kisho-kurokawa',
    '磯崎新': 'arata-isozaki',
    '谷口吉生': 'yoshio-taniguchi',
    '安藤忠雄建築研究所': 'tadao-ando-architectural-institute',
    '隈研吾建築都市設計事務所': 'kengo-kuma-associates',
    '伊東豊雄建築設計事務所': 'toyo-ito-associates',
    'SANAA': 'sanaa',
    '妹島和世+西沢立衛建築設計事務所': 'sanaa',
    '坂茂建築設計': 'shigeru-ban-architects',
    '藤本壮介建築設計事務所': 'sou-fujimoto-architects',
    '石上純也建築設計事務所': 'junya-ishigami-associates',
    '平田晃久建築設計事務所': 'akihisa-hirata-architects',
    '藤森照信建築設計事務所': 'terunobu-fujimori-architects',
    '原広司+アトリエファイ建築研究所': 'hiroshi-hara-atelier-fai',
    '槇総合計画事務所': 'maki-associates',
    '丹下都市建築設計': 'tange-associates',
    '黒川紀章建築都市設計事務所': 'kisho-kurokawa-architects',
    '磯崎新アトリエ': 'arata-isozaki-atelier',
    '谷口吉生建築設計事務所': 'yoshio-taniguchi-associates'
  };

  // 既知の変換ルールをチェック
  if (conversions[name]) {
    return conversions[name];
  }

  // 一般的な変換ルール
  let slug = name
    .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\uF900-\uFAFF\u3300-\u33FF\uFE30-\uFE4F\uFF00-\uFFEFa-zA-Z0-9\s-]/g, '') // 日本語文字、英数字、スペース、ハイフンのみ残す
    .replace(/\s+/g, '-') // スペースをハイフンに変換
    .replace(/-+/g, '-') // 連続するハイフンを1つに
    .replace(/^-|-$/g, '') // 先頭と末尾のハイフンを削除
    .substring(0, 100); // 最大100文字に制限

  // 日本語文字が含まれている場合は、ローマ字変換を試みる
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(slug)) {
    // 簡易的なローマ字変換（より高度な変換が必要な場合は外部ライブラリを使用）
    slug = slug
      .replace(/あ|ア/g, 'a').replace(/い|イ/g, 'i').replace(/う|ウ/g, 'u').replace(/え|エ/g, 'e').replace(/お|オ/g, 'o')
      .replace(/か|カ/g, 'ka').replace(/き|キ/g, 'ki').replace(/く|ク/g, 'ku').replace(/け|ケ/g, 'ke').replace(/こ|コ/g, 'ko')
      .replace(/さ|サ/g, 'sa').replace(/し|シ/g, 'shi').replace(/す|ス/g, 'su').replace(/せ|セ/g, 'se').replace(/そ|ソ/g, 'so')
      .replace(/た|タ/g, 'ta').replace(/ち|チ/g, 'chi').replace(/つ|ツ/g, 'tsu').replace(/て|テ/g, 'te').replace(/と|ト/g, 'to')
      .replace(/な|ナ/g, 'na').replace(/に|ニ/g, 'ni').replace(/ぬ|ヌ/g, 'nu').replace(/ね|ネ/g, 'ne').replace(/の|ノ/g, 'no')
      .replace(/は|ハ/g, 'ha').replace(/ひ|ヒ/g, 'hi').replace(/ふ|フ/g, 'fu').replace(/へ|ヘ/g, 'he').replace(/ほ|ホ/g, 'ho')
      .replace(/ま|マ/g, 'ma').replace(/み|ミ/g, 'mi').replace(/む|ム/g, 'mu').replace(/め|メ/g, 'me').replace(/も|モ/g, 'mo')
      .replace(/や|ヤ/g, 'ya').replace(/ゆ|ユ/g, 'yu').replace(/よ|ヨ/g, 'yo')
      .replace(/ら|ラ/g, 'ra').replace(/り|リ/g, 'ri').replace(/る|ル/g, 'ru').replace(/れ|レ/g, 're').replace(/ろ|ロ/g, 'ro')
      .replace(/わ|ワ/g, 'wa').replace(/を|ヲ/g, 'wo').replace(/ん|ン/g, 'n')
      .replace(/が|ガ/g, 'ga').replace(/ぎ|ギ/g, 'gi').replace(/ぐ|グ/g, 'gu').replace(/げ|ゲ/g, 'ge').replace(/ご|ゴ/g, 'go')
      .replace(/ざ|ザ/g, 'za').replace(/じ|ジ/g, 'ji').replace(/ず|ズ/g, 'zu').replace(/ぜ|ゼ/g, 'ze').replace(/ぞ|ゾ/g, 'zo')
      .replace(/だ|ダ/g, 'da').replace(/ぢ|ヂ/g, 'ji').replace(/づ|ヅ/g, 'zu').replace(/で|デ/g, 'de').replace(/ど|ド/g, 'do')
      .replace(/ば|バ/g, 'ba').replace(/び|ビ/g, 'bi').replace(/ぶ|ブ/g, 'bu').replace(/べ|ベ/g, 'be').replace(/ぼ|ボ/g, 'bo')
      .replace(/ぱ|パ/g, 'pa').replace(/ぴ|ピ/g, 'pi').replace(/ぷ|プ/g, 'pu').replace(/ぺ|ペ/g, 'pe').replace(/ぽ|ポ/g, 'po')
      .replace(/きゃ|キャ/g, 'kya').replace(/きゅ|キュ/g, 'kyu').replace(/きょ|キョ/g, 'kyo')
      .replace(/しゃ|シャ/g, 'sha').replace(/しゅ|シュ/g, 'shu').replace(/しょ|ショ/g, 'sho')
      .replace(/ちゃ|チャ/g, 'cha').replace(/ちゅ|チュ/g, 'chu').replace(/ちょ|チョ/g, 'cho')
      .replace(/にゃ|ニャ/g, 'nya').replace(/にゅ|ニュ/g, 'nyu').replace(/にょ|ニョ/g, 'nyo')
      .replace(/ひゃ|ヒャ/g, 'hya').replace(/ひゅ|ヒュ/g, 'hyu').replace(/ひょ|ヒョ/g, 'hyo')
      .replace(/みゃ|ミャ/g, 'mya').replace(/みゅ|ミュ/g, 'myu').replace(/みょ|ミョ/g, 'myo')
      .replace(/りゃ|リャ/g, 'rya').replace(/りゅ|リュ/g, 'ryu').replace(/りょ|リョ/g, 'ryo')
      .replace(/ぎゃ|ギャ/g, 'gya').replace(/ぎゅ|ギュ/g, 'gyu').replace(/ぎょ|ギョ/g, 'gyo')
      .replace(/じゃ|ジャ/g, 'ja').replace(/じゅ|ジュ/g, 'ju').replace(/じょ|ジョ/g, 'jo')
      .replace(/びゃ|ビャ/g, 'bya').replace(/びゅ|ビュ/g, 'byu').replace(/びょ|ビョ/g, 'byo')
      .replace(/ぴゃ|ピャ/g, 'pya').replace(/ぴゅ|ピュ/g, 'pyu').replace(/ぴょ|ピョ/g, 'pyo');
  }

  return slug;
}

// 建築家名の正規化とデータ移行
async function normalizeArchitectNames() {
  console.log('🏗️ 建築家名の正規化を開始します...\n');

  try {
    // 1. 既存のarchitects_tableからデータを取得
    console.log('📋 既存の建築家データを取得中...');
    const { data: architects, error: architectsError } = await supabase
      .from('architects_table')
      .select('architect_id, architectJa')
      .order('architect_id');

    if (architectsError) {
      throw new Error('建築家データ取得エラー: ' + architectsError.message);
    }

    console.log(`✅ ${architects.length}件の建築家データを取得しました。\n`);

    // 2. 既存のarchitect_namesデータを確認
    console.log('🔍 既存の正規化データを確認中...');
    const { data: existingNames, error: namesError } = await supabase
      .from('architect_names')
      .select('name_id, architect_name, slug');

    if (namesError) {
      throw new Error('正規化データ確認エラー: ' + namesError.message);
    }

    const existingNameMap = new Map();
    existingNames.forEach(name => {
      existingNameMap.set(name.architect_name, name);
    });

    console.log(`✅ 既存の正規化データ: ${existingNames.length}件\n`);

    // 3. 建築家名を分割・正規化
    const processedNames = new Set();
    const nameRelations = [];

    for (const architect of architects) {
      const architectName = architect.architectJa;
      if (!architectName) continue;

      // 全角スペースで分割
      const names = architectName.split('　').filter(name => name.trim());
      
      for (const name of names) {
        const trimmedName = name.trim();
        if (!trimmedName || processedNames.has(trimmedName)) continue;

        processedNames.add(trimmedName);

        // 既存の正規化データをチェック
        if (existingNameMap.has(trimmedName)) {
          const existingName = existingNameMap.get(trimmedName);
          nameRelations.push({
            architect_id: architect.architect_id,
            name_id: existingName.name_id
          });
          continue;
        }

        // 新しい正規化データを作成
        const slug = generateJapaneseSlug(trimmedName);
        
        console.log(`➕ 新しい建築家名を追加: "${trimmedName}" → "${slug}"`);
        
        const { data: newName, error: insertError } = await supabase
          .from('architect_names')
          .insert({ 
            architect_name: trimmedName, 
            slug: slug 
          })
          .select()
          .single();

        if (insertError) {
          console.error(`❌ 建築家名追加エラー (${trimmedName}):`, insertError.message);
          continue;
        }

        // 関連付けを作成
        nameRelations.push({
          architect_id: architect.architect_id,
          name_id: newName.name_id
        });
      }
    }

    // 4. 関連付けデータを一括挿入
    console.log('\n🔗 関連付けデータを作成中...');
    
    // 既存の関連付けを確認
    const { data: existingRelations, error: relationsError } = await supabase
      .from('architect_name_relations')
      .select('architect_id, name_id');

    if (relationsError) {
      throw new Error('関連付けデータ確認エラー: ' + relationsError.message);
    }

    const existingRelationSet = new Set();
    existingRelations.forEach(rel => {
      existingRelationSet.add(`${rel.architect_id}-${rel.name_id}`);
    });

    // 新しい関連付けのみをフィルタリング
    const newRelations = nameRelations.filter(rel => {
      return !existingRelationSet.has(`${rel.architect_id}-${rel.name_id}`);
    });

    if (newRelations.length > 0) {
      console.log(`➕ ${newRelations.length}件の新しい関連付けを作成中...`);
      
      const { error: batchInsertError } = await supabase
        .from('architect_name_relations')
        .insert(newRelations);

      if (batchInsertError) {
        throw new Error('関連付けデータ挿入エラー: ' + batchInsertError.message);
      }

      console.log('✅ 関連付けデータの作成が完了しました。');
    } else {
      console.log('ℹ️ 新しい関連付けデータはありません。');
    }

    // 5. 結果の確認
    console.log('\n📊 処理結果の確認中...');
    
    const { data: finalNames, error: finalNamesError } = await supabase
      .from('architect_names')
      .select('name_id, architect_name, slug')
      .order('name_id');

    const { data: finalRelations, error: finalRelationsError } = await supabase
      .from('architect_name_relations')
      .select('relation_id, architect_id, name_id')
      .order('relation_id');

    if (finalNamesError || finalRelationsError) {
      throw new Error('最終確認エラー: ' + (finalNamesError?.message || finalRelationsError?.message));
    }

    console.log(`\n🎉 正規化処理が完了しました！`);
    console.log(`📈 正規化された建築家名: ${finalNames.length}件`);
    console.log(`🔗 関連付けデータ: ${finalRelations.length}件`);

    // サンプルデータを表示
    console.log('\n📝 サンプルデータ:');
    finalNames.slice(0, 10).forEach((name, index) => {
      console.log(`${index + 1}. ${name.architect_name} → ${name.slug}`);
    });

    if (finalNames.length > 10) {
      console.log(`... 他 ${finalNames.length - 10}件`);
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
normalizeArchitectNames();
