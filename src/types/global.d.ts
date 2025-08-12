/// <reference types="vite/client" />

// デバッグ用のグローバル関数
declare global {
  interface Window {
    debugSession: () => void;
    clearSearchHistory: () => void;
    showTime: () => void;
  }
}
