// MySQL → PostgreSQL 変換ユーティリティ

export interface ConversionOptions {
  preserveAutoIncrement: boolean;
  convertCharset: boolean;
  handleForeignKeys: boolean;
  batchSize: number;
}

export class MySQLToPostgreSQLConverter {
  private options: ConversionOptions;

  constructor(options: ConversionOptions = {
    preserveAutoIncrement: true,
    convertCharset: true,
    handleForeignKeys: true,
    batchSize: 1000
  }) {
    this.options = options;
  }

  // メイン変換関数
  convertSQL(mysqlSQL: string): string {
    let converted = mysqlSQL;

    // 1. CREATE TABLE文の変換
    converted = this.convertCreateTables(converted);
    
    // 2. INSERT文の変換
    converted = this.convertInsertStatements(converted);
    
    // 3. データ型の変換
    converted = this.convertDataTypes(converted);
    
    // 4. 構文の変換
    converted = this.convertSyntax(converted);
    
    // 5. 文字セット関連の削除
    converted = this.removeCharsetDeclarations(converted);

    return converted;
  }

  // SQLファイルの前処理
  async preprocessSQL(sqlContent: string): Promise<string> {
    // Unicode正規化とBOM削除
    let processed = sqlContent
      .replace(/^\uFEFF/, '') // BOM削除
      .replace(/\u200B/g, '') // Zero Width Space削除
      .replace(/\u00A0/g, ' ') // Non-breaking spaceを通常スペースに
      .normalize('NFC'); // Unicode正規化

    // 1. 不要なデータ削除
    processed = this.removeEmptyRecords(processed);

    return processed;
  }

  // CREATE TABLE文の変換
  private convertCreateTables(sql: string): string {
    return sql.replace(
      /CREATE TABLE `([^`]+)`/g,
      'CREATE TABLE $1'
    ).replace(
      /`([^`]+)`/g,
      '$1'
    );
  }

  // データ型変換
  private convertDataTypes(sql: string): string {
    const typeMap: Record<string, string> = {
      // 整数型
      'INT AUTO_INCREMENT': 'SERIAL',
      'BIGINT AUTO_INCREMENT': 'BIGSERIAL',
      'INT UNSIGNED': 'INTEGER',
      'BIGINT UNSIGNED': 'BIGINT',
      
      // 日時型
      'DATETIME': 'TIMESTAMP',
      'TIMESTAMP': 'TIMESTAMP WITH TIME ZONE',
      
      // 文字列型（基本的に互換）
      'VARCHAR': 'VARCHAR',
      'TEXT': 'TEXT',
      'LONGTEXT': 'TEXT',
      
      // 数値型
      'DECIMAL': 'DECIMAL',
      'FLOAT': 'REAL',
      'DOUBLE': 'DOUBLE PRECISION'
    };

    let converted = sql;
    Object.entries(typeMap).forEach(([mysql, postgresql]) => {
      const regex = new RegExp(mysql, 'gi');
      converted = converted.replace(regex, postgresql);
    });

    return converted;
  }

  // INSERT文の変換
  private convertInsertStatements(sql: string): string {
    // MySQLの複数行INSERT → PostgreSQL対応
    return sql.replace(
      /INSERT INTO `([^`]+)`/g,
      'INSERT INTO $1'
    ).replace(
      /VALUES\s*\(/g,
      'VALUES ('
    );
  }

  // 構文変換
  private convertSyntax(sql: string): string {
    return sql
      // バッククォートを削除
      .replace(/`([^`]+)`/g, '$1')
      // ENGINE指定を削除
      .replace(/ENGINE=\w+/gi, '')
      // DEFAULT CHARSET指定を削除
      .replace(/DEFAULT CHARSET=\w+/gi, '')
      // COLLATE指定を削除
      .replace(/COLLATE=\w+/gi, '')
      // AUTO_INCREMENT値指定を削除
      .replace(/AUTO_INCREMENT=\d+/gi, '');
  }

  // 文字セット宣言の削除
  private removeCharsetDeclarations(sql: string): string {
    return sql
      .replace(/SET NAMES \w+;/gi, '')
      .replace(/SET CHARACTER SET \w+;/gi, '')
      .replace(/\/\*!40101 SET.*?\*\//gi, '')
      .replace(/\/\*!40000 ALTER TABLE.*?ENABLE KEYS \*\/;/gi, '');
  }

  // 外部キー制約の処理
  private handleForeignKeys(sql: string): string {
    // PostgreSQLでは外部キー制約の構文が若干異なる場合がある
    return sql.replace(
      /FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)` \(`([^`]+)`\)/g,
      'FOREIGN KEY ($1) REFERENCES $2 ($3)'
    );
  }

  // バッチ処理でのINSERT分割
  splitInsertStatements(sql: string): string[] {
    const statements = sql.split(';').filter(stmt => stmt.trim());
    const batches: string[] = [];
    let currentBatch: string[] = [];

    statements.forEach(statement => {
      if (statement.trim().startsWith('INSERT INTO')) {
        currentBatch.push(statement.trim());
        
        if (currentBatch.length >= this.options.batchSize) {
          batches.push(currentBatch.join(';\n') + ';');
          currentBatch = [];
        }
      } else {
        // CREATE TABLE等の構造定義
        if (currentBatch.length > 0) {
          batches.push(currentBatch.join(';\n') + ';');
          currentBatch = [];
        }
        batches.push(statement.trim() + ';');
      }
    });

    if (currentBatch.length > 0) {
      batches.push(currentBatch.join(';\n') + ';');
    }

    return batches;
  }

  // SQLファイルを小さなバッチに分割
  splitSQLIntoBatches(sql: string, maxBatchSize: number = 500): string[] {
    const lines = sql.split('\n').filter(line => line.trim());
    const batches: string[] = [];
    let currentBatch: string[] = [];
    let currentBatchSize = 0;

    for (const line of lines) {
      // CREATE TABLE文は単独で実行
      if (line.trim().startsWith('CREATE TABLE')) {
        if (currentBatch.length > 0) {
          batches.push(currentBatch.join('\n'));
          currentBatch = [];
          currentBatchSize = 0;
        }
        batches.push(line);
        continue;
      }

      // INSERT文をバッチ化
      if (line.trim().startsWith('INSERT INTO')) {
        currentBatch.push(line);
        currentBatchSize++;

        if (currentBatchSize >= maxBatchSize) {
          batches.push(currentBatch.join('\n'));
          currentBatch = [];
          currentBatchSize = 0;
        }
      } else if (line.trim()) {
        // その他のSQL文
        if (currentBatch.length > 0) {
          batches.push(currentBatch.join('\n'));
          currentBatch = [];
          currentBatchSize = 0;
        }
        batches.push(line);
      }
    }

    // 残りのバッチを追加
    if (currentBatch.length > 0) {
      batches.push(currentBatch.join('\n'));
    }

    return batches.filter(batch => batch.trim());
  }

  // バッチファイルをZIPでダウンロード
  async createBatchFiles(sql: string): Promise<Blob> {
    const batches = this.splitSQLIntoBatches(sql, 50);
    
    // 簡易的なファイル作成（実際のZIP作成は複雑なため、個別ファイルとして提供）
    const batchContents = batches.map((batch, index) => {
      const filename = `batch_${String(index + 1).padStart(3, '0')}.sql`;
      const content = `-- Batch ${index + 1}/${batches.length}\n-- Execute this in Supabase SQL Editor\n\n${batch}`;
      return { filename, content };
    });

    // 実行順序の説明ファイル
    const readmeContent = `# Supabase インポート手順

## 実行順序
${batchContents.map((file, index) => `${index + 1}. ${file.filename}`).join('\n')}

## 実行方法
1. Supabase SQL Editor を開く
2. 各ファイルの内容をコピー&ペースト
3. 順番通りに実行
4. エラーが出た場合は次のバッチに進む前に解決

## 注意事項
- 必ず順番通りに実行してください
- CREATE TABLE文から先に実行されます
- INSERT文は50件ずつに分割されています
`;

    // 全ファイルを結合したテキストとして返す（簡易版）
    const allContent = `${readmeContent}\n\n${'='.repeat(50)}\n\n` + 
      batchContents.map(file => `-- ${file.filename}\n${file.content}\n\n${'='.repeat(50)}\n`).join('\n');
    
    return new Blob([allContent], { type: 'text/plain' });
  }
}

// 使用例
export async function convertMySQLFile(mysqlContent: string): Promise<string> {
  const converter = new MySQLToPostgreSQLConverter();
  
  console.log('Converting MySQL to PostgreSQL...');
  const converted = converter.convertSQL(mysqlContent);
  
  console.log('Conversion completed');
  return converted;
}

// ファイル処理用のヘルパー
export function downloadConvertedSQL(content: string, filename: string = 'converted_postgresql.sql') {
  const blob = new Blob([content], { type: 'text/sql' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}