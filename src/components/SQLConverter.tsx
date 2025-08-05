import React, { useState } from 'react';
import { Upload, Download, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MySQLToPostgreSQLConverter, downloadConvertedSQL } from '../utils/mysql-to-postgresql';

export function SQLConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.sql')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('SQLファイルを選択してください');
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError(null);

    try {
      const content = await file.text();
      const converter = new MySQLToPostgreSQLConverter();
      const convertedSQL = converter.convertSQL(content);
      
      setConverted(convertedSQL);
    } catch (err) {
      setError(`変換エラー: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (converted) {
      downloadConvertedSQL(converted, 'postgresql_converted.sql');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          MySQL → PostgreSQL 変換ツール
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ファイル選択 */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            MySQLのSQLファイルをドラッグ&ドロップまたは選択
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
              ファイルを選択
            </label>
          </Button>
        </div>

        {/* 選択されたファイル情報 */}
        {file && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-gray-500">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* 変換ボタン */}
        <Button
          onClick={handleConvert}
          disabled={!file || converting}
          className="w-full"
        >
          {converting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              変換中...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              PostgreSQL形式に変換
            </>
          )}
        </Button>

        {/* 変換完了・ダウンロード */}
        {converted && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">変換完了</span>
              </div>
              <Button onClick={handleDownload} size="sm">
                <Download className="h-4 w-4 mr-2" />
                ダウンロード
              </Button>
            </div>
            <p className="text-sm text-green-700 mt-2">
              PostgreSQL形式のSQLファイルが生成されました。
              SupabaseのSQL Editorで実行できます。
            </p>
          </div>
        )}

        {/* 変換内容の説明 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">変換される内容:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• バッククォート (`) の削除</li>
            <li>• AUTO_INCREMENT → SERIAL/BIGSERIAL</li>
            <li>• DATETIME → TIMESTAMP</li>
            <li>• ENGINE, CHARSET指定の削除</li>
            <li>• 外部キー制約の調整</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}