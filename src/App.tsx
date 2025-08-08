import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './components/providers/AppProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './components/pages/HomePage';
import { BuildingDetailPage } from './components/pages/BuildingDetailPage';

import { Routes, Route } from 'react-router-dom';
import { useLanguage } from './hooks/useLanguage';

// エラーバウンダリでラップされたルートコンポーネント
function AppRoutes() {
  const { language } = useLanguage();
  
  return (
    <ErrorBoundary language={language}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/building/:slug" element={<BuildingDetailPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;