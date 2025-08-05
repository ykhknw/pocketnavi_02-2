import React, { useState } from 'react';
import { Upload, Download, Database, AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MySQLToPostgreSQLConverter, downloadConvertedSQL } from '../utils/mysql-to-postgresql';
import { supabase } from '../lib/supabase';

interface MigrationStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export function DataMigration() {
  const [file, setFile] = useState<File | null>(null);
  const [convertedSQL, setConvertedSQL] = useState<string | null>(null);
  const [steps, setSteps] = useState<MigrationStep[]>([
    { id: 'upload', title: 'SQLファイルアップロード', status: 'pending' },
    { id: 'convert', title: 'MySQL→PostgreSQL変換', status: 'pending' },
    { id: 'validate', title: 'データ検証', status: 'pending' },
    { id: 'import', title: 'Supabaseインポート', status: 'pending' }
  ]);

  const updateStep = (id: string, status: MigrationStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status, message } : step
    ));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.sql')) {
      setFile(selectedFile);
      updateStep('upload', 'completed', `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
    } else {
      updateStep('upload', 'error', 'SQLファイルを選択してください');
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    updateStep('convert', 'processing');

    try {
      const content = await file.text();
      const converter = new MySQLToPostgreSQLConverter({
        preserveAutoIncrement: true,
        convertCharset: true,
        handleForeignKeys: true,
        batchSize: 1000
      });
      
      const converted = converter.convertSQL(content);
      setConvertedSQL(converted);
      
      updateStep('convert', 'completed', 'PostgreSQL形式に変換完了');
      updateStep('validate', 'processing');
      
      // 簡易検証
      const tableCount = (converted.match(/CREATE TABLE/gi) || []).length;
      const insertCount = (converted.match(/INSERT INTO/gi) || []).length;
      
      updateStep('validate', 'completed', `テーブル: ${tableCount}個, データ: ${insertCount}件`);
      
    } catch (err) {
      updateStep('convert', 'error', `変換エラー: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const handleDownloadSQL = () => {
    if (convertedSQL) {
      downloadConvertedSQL(convertedSQL, 'supabase_import.sql');
    }
  };

  const handleDownloadBatches = () => {
    if (!convertedSQL) return;

    try {
      const converter = new MySQLToPostgreSQLConverter();
      const batches = converter.splitSQLIntoBatches(convertedSQL, 500); // 50 → 500に変更
      
      // 実行手順書を作成
      const instructions = `# Supabase分割インポート手順

## 重要: 必ず順番通りに実行してください

合計 ${batches.length} 個のバッチがあります。

## 実行順序:
${batches.map((_, index) => `${index + 1}. バッチ ${index + 1}`).join('\n')}

## 各バッチの実行方法:
1. Supabase SQL Editor を開く
2. 以下のSQLをコピー&ペースト
3. 実行ボタンをクリック
4. エラーがないことを確認
5. 次のバッチに進む

${'='.repeat(80)}

`;

      // 全バッチを1つのファイルにまとめる
      const allBatches = instructions + batches.map((batch, index) => {
        return `-- ========================================
-- バッチ ${index + 1}/${batches.length}
-- ========================================

${batch}

-- バッチ ${index + 1} 完了
-- 次のバッチに進む前にエラーがないことを確認してください

`;
      }).join('\n');

      // ダウンロード実行
      const blob = new Blob([allBatches], { type: 'text/plain; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supabase_batches.sql';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`分割版SQLファイルをダウンロードしました (${batches.length}バッチ)`);
      
    } catch (error) {
      console.error('分割版SQL作成エラー:', error);
      alert('分割版SQLの作成に失敗しました。コンソールを確認してください。');
    }
  };

  const handleSupabaseImport = async () => {
    if (!convertedSQL) return;

    updateStep('import', 'processing');

    try {
      // Supabase接続テスト
      const { data, error } = await supabase
        .from('buildings')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Supabase接続エラー: ${error.message}`);
      }

      updateStep('import', 'completed', 'Supabase SQL Editorで手動インポートしてください');
      
    } catch (err) {
      updateStep('import', 'error', `インポートエラー: ${err instanceof Error ? err.message : '不明なエラー'}`);
    }
  };

  const getStepIcon = (status: MigrationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Supabaseデータマイグレーション
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* ステップ表示 */}
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    {getStepIcon(step.status)}
                    {index < steps.length - 1 && (
                      <div className="w-px h-8 bg-gray-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{step.title}</h3>
                    {step.message && (
                      <p className={`text-sm mt-1 ${
                        step.status === 'error' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {step.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ファイル選択 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                _shinkenchiku_db.sql ファイルを選択
              </p>
              <input
                type="file"
                accept=".sql"
                onChange={handleFileSelect}
                className="hidden"
                id="sql-file"
              />
              <Button asChild variant="outline">
                <label htmlFor="sql-file" className="cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  SQLファイルを選択
                </label>
              </Button>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-4">
              <Button
                onClick={handleConvert}
                disabled={!file || steps.find(s => s.id === 'convert')?.status === 'processing'}
                className="flex-1"
              >
                {steps.find(s => s.id === 'convert')?.status === 'processing' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    変換中...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    PostgreSQL変換
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownloadSQL}
                disabled={!convertedSQL}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                完全版SQL
              </Button>

              <Button
                onClick={handleDownloadBatches}
                disabled={!convertedSQL}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                分割版SQL (500件/バッチ)
              </Button>
            </div>

            {/* Supabase手順 */}
            {convertedSQL && (
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg">Supabaseインポート手順</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">1. Supabaseプロジェクトにアクセス</p>
                    <p className="text-gray-600 ml-4">
                      <a 
                        href="https://supabase.com/dashboard" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Supabaseダッシュボード
                      </a>
                      を開く
                    </p>
                    
                    <p className="font-medium">2. SQL Editorを開く</p>
                    <p className="text-gray-600 ml-4">左メニューから「SQL Editor」を選択</p>
                    
                    <p className="font-medium">3. SQLファイルをインポート</p>
                    <p className="text-gray-600 ml-4">
                      ダウンロードしたSQLファイルの内容をコピー&ペーストして実行
                    </p>
                    
                    <p className="font-medium">4. データ確認</p>
                    <p className="text-gray-600 ml-4">
                      「Table Editor」でテーブルとデータが正しくインポートされたか確認
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleSupabaseImport}
                    className="w-full mt-4"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Supabase接続テスト
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* 注意事項 */}
            <Card className="bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-2">重要な注意事項</p>
                    <ul className="space-y-1 text-yellow-700">
                      <li>• 42MBのSQLファイルは大容量です。段階的にインポートすることをお勧めします</li>
                      <li>• Supabase無料プランの容量制限（500MB）にご注意ください</li>
                      <li>• インポート前にデータのバックアップを取ることをお勧めします</li>
                      <li>• エラーが発生した場合は、SQLファイルを分割してインポートしてください</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}