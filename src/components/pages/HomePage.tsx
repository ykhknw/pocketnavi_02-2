import React from 'react';
import { useAppContext } from '../providers/AppProvider';
import { AppHeader } from '../layout/AppHeader';
import { MainContent } from '../layout/MainContent';
import { Sidebar } from '../layout/Sidebar';
import { LoginModal } from '../LoginModal';
import { AdminPanel } from '../AdminPanel';
import { DataMigration } from '../DataMigration';
import { Button } from '../ui/button';

export function HomePage() {
  const {
    // 状態
    selectedBuilding,
    showDetail,
    showAdminPanel,
    showDataMigration,
    isAuthenticated,
    currentUser,
    likedBuildings,
    searchHistory,
    showLoginModal,
    currentPage,
    filters,
    
    // アクション
    setSelectedBuilding,
    setShowDetail,
    setShowAdminPanel,
    setShowDataMigration,
    setIsAuthenticated,
    setCurrentUser,
    setLikedBuildings,
    setSearchHistory,
    setShowLoginModal,
    setCurrentPage,
    setFilters,
    
    // ハンドラー
    handleBuildingSelect,
    handleLike,
    handlePhotoLike,
    handleLogin,
    handleRegister,
    handleLogout,
    handleAddBuilding,
    handleUpdateBuilding,
    handleDeleteBuilding,
    handleSearchFromHistory,
    handleLikedBuildingClick,
    handleSearchAround,
    handlePageChange,
    
    // その他の状態
    language,
    toggleLanguage,
    getCurrentLocation,
    locationLoading,
    locationError,
    buildingsLoading,
    buildingsError,
    buildings,
    filteredBuildings,
    currentBuildings,
    totalBuildings,
    totalPages,
    startIndex,
    itemsPerPage,
    useApi,
    apiStatus,
    isSupabaseConnected,
    popularSearches,
    getPaginationRange,
  } = useAppContext();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onAdminClick={() => setShowAdminPanel(true)}
        language={language}
        onLanguageToggle={toggleLanguage}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <MainContent
            selectedBuilding={selectedBuilding}
            buildingsLoading={buildingsLoading}
            buildingsError={buildingsError}
            currentBuildings={currentBuildings}
            filteredBuildings={filteredBuildings}
            totalBuildings={totalBuildings}
            totalPages={totalPages}
            startIndex={startIndex}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            useApi={useApi}
            apiStatus={apiStatus}
            isSupabaseConnected={isSupabaseConnected}
            showDataMigration={showDataMigration}
            setShowDataMigration={setShowDataMigration}
            filters={filters}
            setFilters={setFilters}
            locationLoading={locationLoading}
            locationError={locationError}
            getCurrentLocation={getCurrentLocation}
            language={language}
            handleBuildingSelect={handleBuildingSelect}
            handleLike={handleLike}
            handlePhotoLike={handlePhotoLike}
            handleSearchAround={handleSearchAround}
            handlePageChange={handlePageChange}
            getPaginationRange={getPaginationRange}
          />

          <Sidebar
            buildings={currentBuildings}
            selectedBuilding={selectedBuilding}
            onBuildingSelect={handleBuildingSelect}
            currentLocation={filters.currentLocation}
            language={language}
            startIndex={startIndex}
            onSearchAround={handleSearchAround}
            likedBuildings={likedBuildings}
            onLikedBuildingClick={handleLikedBuildingClick}
            recentSearches={searchHistory}
            popularSearches={popularSearches}
            onSearchClick={handleSearchFromHistory}
          />
        </div>
      </main>

      <footer className="bg-background border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-muted-foreground">
            &copy; 2024-{new Date().getFullYear()} {language === 'ja' ? '建築家.com - 建築作品データベース' : 'kenchikuka.com - Architectural Works Database'}
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        language={language}
      />

      {isAuthenticated && (
        <AdminPanel
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
          buildings={filteredBuildings}
          onAddBuilding={handleAddBuilding}
          onUpdateBuilding={handleUpdateBuilding}
          onDeleteBuilding={handleDeleteBuilding}
          language={language}
        />
      )}

      {showDataMigration && (
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
      )}
    </div>
  );
} 