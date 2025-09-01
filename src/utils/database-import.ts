// データベースインポート用ユーティリティ
import { supabase } from '../lib/supabase';

export interface ImportConfig {
  batchSize: number;
  skipDuplicates: boolean;
  optimizeImages: boolean;
  maxTextLength: number;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  data?: {
    individualArchitects: number;
    architectCompositions: number;
  };
}

export class DatabaseImporter {
  private config: ImportConfig;

  constructor(config: ImportConfig = {
    batchSize: 100,
    skipDuplicates: true,
    optimizeImages: true,
    maxTextLength: 1000
  }) {
    this.config = config;
  }

  // SQLファイルの前処理
  async preprocessSQL(sqlContent: string): Promise<string> {
    let processed = sqlContent;

    // 1. 不要なデータ削除
    processed = this.removeEmptyRecords(processed);
    
    // 2. 文字列長制限
    processed = this.truncateTextFields(processed);
    
    // 3. 重複削除
    processed = this.removeDuplicates(processed);
    
    // 4. 画像URL最適化
    processed = this.optimizeImageUrls(processed);

    return processed;
  }

  private removeEmptyRecords(sql: string): string {
    // 空のタイトルや必須フィールドが空のレコードを除外
    const lines = sql.split('\n');
    return lines.filter(line => {
      if (line.includes('INSERT INTO')) {
        // 空のタイトルをチェック
        return !line.includes("''") && !line.includes('NULL');
      }
      return true;
    }).join('\n');
  }

  private truncateTextFields(sql: string): string {
    // 長すぎるテキストフィールドを切り詰め
    return sql.replace(
      /'([^']{1000,})'/g, 
      (match, content) => `'${content.substring(0, this.config.maxTextLength)}...'`
    );
  }

  private removeDuplicates(sql: string): string {
    const insertStatements = new Set<string>();
    const lines = sql.split('\n');
    
    return lines.filter(line => {
      if (line.includes('INSERT INTO buildings')) {
        // タイトルと位置で重複チェック
        const titleMatch = line.match(/'([^']+)'/);
        const locationMatch = line.match(/,\s*'([^']+)',.*lat/);
        
        if (titleMatch && locationMatch) {
          const key = `${titleMatch[1]}_${locationMatch[1]}`;
          if (insertStatements.has(key)) {
            return false; // 重複を除外
          }
          insertStatements.add(key);
        }
      }
      return true;
    }).join('\n');
  }

  private optimizeImageUrls(sql: string): string {
    // 画像URLを外部CDNに変更（実際のURLに置換）
    return sql.replace(
      /https:\/\/example\.com\/images\/([^']+)/g,
      'https://images.pexels.com/photos/$1'
    );
  }

  // バッチインポート
  async importInBatches(sqlContent: string, supabase: Record<string, unknown>): Promise<void> {
    const processed = await this.preprocessSQL(sqlContent);
    const statements = this.extractInsertStatements(processed);
    
    console.log(`Total statements: ${statements.length}`);
    
    for (let i = 0; i < statements.length; i += this.config.batchSize) {
      const batch = statements.slice(i, i + this.config.batchSize);
      
      try {
        await this.executeBatch(batch, supabase);
        console.log(`Imported batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(statements.length / this.config.batchSize)}`);
      } catch (error) {
        console.error(`Error in batch ${i}-${i + this.config.batchSize}:`, error);
      }
    }
  }

  private extractInsertStatements(sql: string): string[] {
    return sql.split('\n').filter(line => 
      line.trim().startsWith('INSERT INTO')
    );
  }

  private async executeBatch(statements: string[], supabase: Record<string, unknown>): Promise<void> {
    // Supabaseでは直接SQL実行が制限されているため、
    // パースしてJavaScriptオブジェクトに変換してからinsert
    for (const statement of statements) {
      const data = this.parseInsertStatement(statement);
      if (data) {
        await supabase.from(data.table).insert(data.values);
      }
    }
  }

  private parseInsertStatement(statement: string): { table: string; values: Record<string, unknown> } | null {
    // INSERT文をパースしてオブジェクトに変換
    // 実装は複雑になるため、実際の使用時に詳細化
    const tableMatch = statement.match(/INSERT INTO (\w+)/);
    if (!tableMatch) return null;

    return {
      table: tableMatch[1],
      values: {} // 実際のパース処理
    };
  }
}

// 使用例
export async function importShinkenchikuDB(supabase: Record<string, unknown>) {
  const importer = new DatabaseImporter({
    batchSize: 50,
    skipDuplicates: true,
    optimizeImages: true,
    maxTextLength: 500
  });

  // SQLファイルを読み込み（実際の実装では fetch等を使用）
  const sqlContent = ''; // SQLファイルの内容
  
  await importer.importInBatches(sqlContent, supabase);
}

/**
 * 移行状況の確認
 */
export async function checkMigrationStatus(): Promise<MigrationResult> {
  try {
    console.log('🔍 checkMigrationStatus: 開始');
    
    // 方法1: count: 'exact'を使用
    const { data: individualCount, error: individualError, count: individualExactCount } = await supabase
      .from('individual_architects')
      .select('individual_architect_id', { count: 'exact' });

    console.log('🔍 individual_architects クエリ結果:', { 
      data: individualCount, 
      error: individualError, 
      count: individualExactCount,
      dataLength: individualCount?.length || 0
    });

    if (individualError) {
      console.error('❌ individual_architectsテーブル確認エラー:', individualError);
      return {
        success: false,
        message: `individual_architectsテーブル確認エラー: ${individualError.message}`
      };
    }

    // 方法2: データの長さも確認
    const individualCountValue = individualExactCount || individualCount?.length || 0;

    const { data: compositionCount, error: compositionError, count: compositionExactCount } = await supabase
      .from('architect_compositions')
      .select('architect_id', { count: 'exact' });

    console.log('🔍 architect_compositions クエリ結果:', { 
      data: compositionCount, 
      error: compositionError, 
      count: compositionExactCount,
      dataLength: compositionCount?.length || 0
    });

    if (compositionError) {
      console.error('❌ architect_compositionsテーブル確認エラー:', compositionError);
      return {
        success: false,
        message: `architect_compositionsテーブル確認エラー: ${compositionError.message}`
      };
    }

    // 方法2: データの長さも確認
    const compositionCountValue = compositionExactCount || compositionCount?.length || 0;

    const result = {
      success: true,
      message: '移行状況確認完了',
      data: {
        individualArchitects: individualCountValue,
        architectCompositions: compositionCountValue
      }
    };

    console.log('✅ checkMigrationStatus: 完了', result);
    return result;

  } catch (error) {
    console.error('❌ checkMigrationStatus: 予期しないエラー:', error);
    return {
      success: false,
      message: `予期しないエラー: ${error}`
    };
  }
}