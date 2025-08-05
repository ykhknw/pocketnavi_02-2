import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './components/providers/AppProvider';
import { HomePage } from './components/pages/HomePage';
import { BuildingDetailPage } from './components/pages/BuildingDetailPage';

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/building/:slug" element={<BuildingDetailPage />} />
      </Routes>
    </AppProvider>
  );
}

export default App; 