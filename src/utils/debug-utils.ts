import { sessionManager } from './session-manager';

/**
 * セッション管理のデバッグ情報を表示
 */
export function debugSessionManager(): void {
  console.group('🔍 セッション管理デバッグ情報');
  console.log('セッションID:', sessionManager.getSessionId());
  console.log('検索履歴:', sessionManager.getSearchHistory());
  console.groupEnd();
}

/**
 * 検索履歴をクリア（デバッグ用）
 */
export function clearSearchHistory(): void {
  sessionManager.clearSearchHistory();
  console.log('✅ 検索履歴をクリアしました');
}

/**
 * 現在時刻を表示（デバッグ用）
 */
export function showCurrentTime(): void {
  console.log('現在時刻:', new Date().toISOString());
}

/**
 * ブラウザのコンソールで実行可能なデバッグコマンドを設定
 */
export function setupDebugCommands(): void {
  // @ts-ignore
  window.debugSession = debugSessionManager;
  // @ts-ignore
  window.clearSearchHistory = clearSearchHistory;
  // @ts-ignore
  window.showTime = showCurrentTime;
  
  console.log('🔧 デバッグコマンドを設定しました:');
  console.log('  - debugSession(): セッション情報を表示');
  console.log('  - clearSearchHistory(): 検索履歴をクリア');
  console.log('  - showTime(): 現在時刻を表示');
}
