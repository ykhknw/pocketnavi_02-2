// React import not required with JSX runtime
import { Suspense, lazy, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../providers/AppProvider';
import { AppHeader } from '../layout/AppHeader';
import { MainContent } from '../layout/MainContent';
import { Sidebar } from '../layout/Sidebar';
import { Footer } from '../layout/Footer';
import { Button } from '../ui/button';
import { Building } from '../../types';

// 重いコンポーネントを動的インポート
const LoginModal = lazy(() => import('../LoginModal').then(module => ({ default: module.LoginModal })));
const AdminPanel = lazy(() => import('../AdminPanel').then(module => ({ default: module.AdminPanel })));
const DataMigration = lazy(() => import('../DataMigration').then(module => ({ default: module.DataMigration })));

// ローディングコンポーネント
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export function HomePage() {
  const context = useAppContext();
  const navigate = useNavigate();
  
  if (!context) {
    return <div>Loading...</div>;
  }

  // 建築物選択時のURL遷移処理
  const handleBuildingSelect = useCallback((building: Building | null) => {
    if (building) {
      const slug = building.slug || building.id.toString();
      // 一覧上の表示番号を計算してstateに渡す
      const idx = context.currentBuildings.findIndex(b => b.id === building.id);
      const displayIndex = (idx >= 0 ? context.startIndex + idx + 1 : 1);
      navigate(`/building/${slug}`, {
        state: { building, displayIndex }
      });
    }
  }, [navigate, context.currentBuildings, context.startIndex]);

  const {
    isAuthenticated,
    currentUser,
    showLoginModal,
    setShowLoginModal,
    showAdminPanel,
    setShowAdminPanel,
    showDataMigration,
    setShowDataMigration,
    language,
    toggleLanguage
  } = context;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={() => {/* handle logout */}}
        onAdminClick={() => setShowAdminPanel(true)}
        language={language}
        onLanguageToggle={toggleLanguage}
      />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <MainContent
              selectedBuilding={context.selectedBuilding}
              buildingsLoading={context.buildingsLoading}
              buildingsError={context.buildingsError}
              currentBuildings={context.currentBuildings}
              filteredBuildings={context.filteredBuildings}
              totalBuildings={context.totalBuildings}
              totalPages={context.totalPages}
              startIndex={context.startIndex}
              currentPage={context.currentPage}
              itemsPerPage={context.itemsPerPage}
              useApi={context.useApi}
              apiStatus={context.apiStatus}
              isSupabaseConnected={context.isSupabaseConnected}
              showDataMigration={showDataMigration}
              setShowDataMigration={setShowDataMigration}
              filters={context.filters}
              setFilters={context.setFilters}
              locationLoading={context.locationLoading}
              locationError={context.locationError}
              getCurrentLocation={context.getCurrentLocation}
              language={language}
              handleBuildingSelect={handleBuildingSelect}
              handleLike={context.handleLike}
              handlePhotoLike={context.handlePhotoLike}
              handleSearchAround={context.handleSearchAround}
              handlePageChange={context.handlePageChange}
              handleSearchStart={context.handleSearchStart}
              getPaginationRange={context.getPaginationRange}
            />
          </div>
          
          <div className="lg:col-span-1">
            <Sidebar
              buildings={context.currentBuildings}
              selectedBuilding={context.selectedBuilding}
              onBuildingSelect={context.handleBuildingSelect}
              currentLocation={context.filters.currentLocation}
              language={language}
              startIndex={context.startIndex}
              onSearchAround={context.handleSearchAround}
              likedBuildings={context.likedBuildings}
              onLikedBuildingClick={context.handleLikedBuildingClick}
              onRemoveLikedBuilding={context.handleRemoveLikedBuilding}
              recentSearches={context.searchHistory}
              popularSearches={context.popularSearches}
              onSearchClick={context.handleSearchFromHistory}
            />
          </div>
        </div>
      </div>
      
      <Footer language={language} />

      {/* モーダルコンポーネント */}
      {showLoginModal && (
        <Suspense fallback={<LoadingSpinner />}>
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLogin={context.handleLogin}
            onRegister={context.handleRegister}
            language={language}
          />
        </Suspense>
      )}

      {isAuthenticated && showAdminPanel && (
        <Suspense fallback={<LoadingSpinner />}>
          <AdminPanel
            isOpen={showAdminPanel}
            onClose={() => setShowAdminPanel(false)}
            buildings={context.filteredBuildings}
            onAddBuilding={context.handleAddBuilding}
            onUpdateBuilding={context.handleUpdateBuilding}
            onDeleteBuilding={context.handleDeleteBuilding}
            language={language}
          />
        </Suspense>
      )}

      {showDataMigration && (
        <Suspense fallback={<LoadingSpinner />}>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Supabaseデータ移行</h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowDataMigration(false)}
                >
                  ×
                </Button>
              </div>
              <div className="p-6">
                <DataMigration />
              </div>
            </div>
          </div>
        </Suspense>
      )}
    </div>
  );
}
