import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupDebugCommands } from './utils/debug-utils';

// 開発環境でのみデバッグコマンドを設定
if (import.meta.env.DEV) {
  setupDebugCommands();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
