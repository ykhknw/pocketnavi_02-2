import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { t } from '../utils/translations';

interface Props {
  children: ReactNode;
  language: 'ja' | 'en';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // エラーIDを生成（タイムスタンプ + ランダム文字列）
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // エラーログを記録
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // エラー情報を状態に保存
    this.setState({
      errorInfo
    });

    // エラーレポートを送信（本番環境の場合）
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorReport(error, errorInfo);
    }
  }

  private sendErrorReport = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        }
      };

      // 実際の実装では以下のようなAPI呼び出しを行う
      // fetch('/api/error-report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyError = () => {
    const errorDetails = `
Error ID: ${this.state.errorId}
Time: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error: ${this.state.error?.name}: ${this.state.error?.message}
Stack: ${this.state.error?.stack}

Component Stack: ${this.state.errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(errorDetails).then(() => {
      alert(this.props.language === 'ja' ? 'エラー詳細をコピーしました' : 'Error details copied to clipboard');
    }).catch(() => {
      // コピーに失敗した場合の処理
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                {this.props.language === 'ja' ? '予期しないエラーが発生しました' : 'An unexpected error occurred'}
              </CardTitle>
              <p className="text-gray-600 mt-2">
                {this.props.language === 'ja' 
                  ? '申し訳ございませんが、アプリケーションでエラーが発生しました。'
                  : 'We apologize, but an error occurred in the application.'
                }
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* エラーID表示 */}
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  {this.props.language === 'ja' ? 'エラーID:' : 'Error ID:'} 
                  <span className="font-mono ml-2">{this.state.errorId}</span>
                </p>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {this.props.language === 'ja' ? '再試行' : 'Retry'}
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  {this.props.language === 'ja' ? 'ホームに戻る' : 'Go Home'}
                </Button>
              </div>

              {/* 詳細情報（開発環境のみ） */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-6">
                  <details className="bg-gray-50 rounded-lg p-4">
                    <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                      {this.props.language === 'ja' ? 'エラー詳細（開発用）' : 'Error Details (Development)'}
                    </summary>
                    <div className="space-y-2">
                      <div>
                        <strong>{this.props.language === 'ja' ? 'エラー:' : 'Error:'}</strong>
                        <pre className="text-sm bg-white p-2 rounded mt-1 overflow-x-auto">
                          {this.state.error.toString()}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong>{this.props.language === 'ja' ? 'コンポーネントスタック:' : 'Component Stack:'}</strong>
                          <pre className="text-sm bg-white p-2 rounded mt-1 overflow-x-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                      <Button
                        onClick={this.handleCopyError}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        <Bug className="w-4 h-4 mr-2" />
                        {this.props.language === 'ja' ? 'エラー詳細をコピー' : 'Copy Error Details'}
                      </Button>
                    </div>
                  </details>
                </div>
              )}

              {/* サポート情報 */}
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>
                  {this.props.language === 'ja' 
                    ? '問題が解決しない場合は、エラーIDと共にサポートにお問い合わせください。'
                    : 'If the problem persists, please contact support with the Error ID.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
} 