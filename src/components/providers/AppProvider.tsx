import React, { createContext, useContext, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppContextType } from '../../types/app';
import { Building } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useAppActions } from '../../hooks/useAppActions';
import { useAppHandlers } from '../../hooks/useAppHandlers';
import { useAppEffects } from '../../hooks/useAppEffects';

// React Queryクライアントの設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分間は新鮮とみなす
      gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持
      retry: 1, // リトライ回数を1回に制限
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効化
    },
  },
});

const AppContext = createContext<AppContextType | null>(null);

function AppProviderContent({ children }: { children: React.ReactNode }) {
  // 状態管理
  const state = useAppState();
  
  // アクション管理
  const actions = useAppActions();
  
  // イベントハンドラー
  const handlers = useAppHandlers();
  
  // 副作用管理
  const effects = useAppEffects();
  
  // Supabase建物データの取得
  const buildingsData = effects.useSupabaseBuildingsEffect(
    state.filters,
    state.currentPage,
    state.itemsPerPage,
    effects.useApi,
    effects.language
  );
  
  // URL同期効果
  effects.useURLSyncEffect(
    state.location,
    state.searchParams,
    state.setFilters,
    state.setCurrentPage,
    state.isUpdatingFromURL.current
  );
  
  // URL更新効果
  effects.useURLUpdateEffect(
    state.filters,
    state.currentPage,
    actions.updateURLWithFilters,
    state.isUpdatingFromURL.current
  );
  
  // 位置情報効果
  effects.useGeolocationEffect(
    effects.geoLocation,
    state.setFilters
  );
  
  // フィルター変更効果
  effects.useFilterChangeEffect(
    effects.useApi,
    buildingsData.buildings,
    state.filters,
    effects.setFilteredBuildings,
    state.setCurrentPage,
    state.searchHistory,
    state.setSearchHistory,
    state.prevFiltersRef,
    effects.language
  );
  
  // ページネーション計算
  const pagination = actions.calculatePagination(
    effects.useApi ? buildingsData.totalBuildings : effects.filteredBuildings.length,
    state.itemsPerPage,
    state.currentPage
  );

  // デバッグログ
  console.log('ページネーション計算:', {
    useApi: effects.useApi,
    totalBuildings: buildingsData.totalBuildings,
    filteredBuildingsLength: effects.filteredBuildings.length,
    itemsPerPage: state.itemsPerPage,
    currentPage: state.currentPage,
    totalPages: pagination.totalPages,
    startIndex: pagination.startIndex,
    hasArchitectFilter: state.filters.architects && state.filters.architects.length > 0,
    architects: state.filters.architects
  });
  
  // 現在の建物リスト
  const currentBuildings = effects.useApi 
    ? buildingsData.buildings // API使用時はbuildings（既にページング済み）
    : effects.filteredBuildings.slice(pagination.startIndex, pagination.startIndex + state.itemsPerPage);

  // ハンドラー関数のラッパー（useCallbackで最適化）
  const handleBuildingSelect = useCallback((building: Building | null) => 
    handlers.handleBuildingSelect(building, state.setSelectedBuilding, state.setShowDetail),
    [handlers.handleBuildingSelect, state.setSelectedBuilding, state.setShowDetail]
  );
    
  const handleLike = useCallback((buildingId: number) => 
    handlers.handleLike(buildingId, state.likedBuildings, state.setLikedBuildings, buildingsData.buildings),
    [handlers.handleLike, state.likedBuildings, state.setLikedBuildings, buildingsData.buildings]
  );
    
  const handlePhotoLike = useCallback((photoId: number) => 
    handlers.handlePhotoLike(photoId),
    [handlers.handlePhotoLike]
  );
    
  const handleLogin = useCallback((email: string, password: string) => 
    handlers.handleLogin(email, password, state.setIsAuthenticated, state.setCurrentUser, state.setShowLoginModal),
    [handlers.handleLogin, state.setIsAuthenticated, state.setCurrentUser, state.setShowLoginModal]
  );
    
  const handleRegister = useCallback((email: string, password: string, name: string) => 
    handlers.handleRegister(email, password, name, state.setIsAuthenticated, state.setCurrentUser, state.setShowLoginModal),
    [handlers.handleRegister, state.setIsAuthenticated, state.setCurrentUser, state.setShowLoginModal]
  );
    
  const handleLogout = useCallback(() => 
    handlers.handleLogout(state.setIsAuthenticated, state.setCurrentUser),
    [handlers.handleLogout, state.setIsAuthenticated, state.setCurrentUser]
  );
    
  const handleAddBuilding = useCallback((buildingData: Partial<Building>) => 
    handlers.handleAddBuilding(buildingData),
    [handlers.handleAddBuilding]
  );
    
  const handleUpdateBuilding = useCallback((id: number, buildingData: Partial<Building>) => 
    handlers.handleUpdateBuilding(id, buildingData),
    [handlers.handleUpdateBuilding]
  );
    
  const handleDeleteBuilding = useCallback((id: number) => 
    handlers.handleDeleteBuilding(id),
    [handlers.handleDeleteBuilding]
  );
    
  const handleSearchFromHistory = useCallback((query: string) => 
    handlers.handleSearchFromHistory(query, state.setFilters, state.filters),
    [handlers.handleSearchFromHistory, state.setFilters, state.filters]
  );
    
  const handleLikedBuildingClick = useCallback((buildingId: number) => 
    handlers.handleLikedBuildingClick(buildingId, buildingsData.buildings, state.setSelectedBuilding),
    [handlers.handleLikedBuildingClick, buildingsData.buildings, state.setSelectedBuilding]
  );
    
  const handleSearchAround = useCallback((lat: number, lng: number) => 
    handlers.handleSearchAround(lat, lng, (path: string) => {
      // 簡易的なナビゲーション実装
      window.history.pushState({}, '', path);
    }),
    [handlers.handleSearchAround]
  );
    
  const handlePageChange = useCallback((page: number) => {
    console.log('🔄 handlePageChange called:', { page, totalPages: pagination.totalPages, currentPage: state.currentPage });
    handlers.handlePageChange(page, pagination.totalPages, state.currentPage, state.setCurrentPage);
  }, [handlers.handlePageChange, state.setCurrentPage]);

  // 検索開始時のコールバック（建築物詳細をクリア）
  const handleSearchStart = useCallback(() => {
    console.log('🔍 検索開始: 建築物詳細をクリア');
    state.setSelectedBuilding(null);
    state.setShowDetail(false);
  }, [state.setSelectedBuilding, state.setShowDetail]);

  const contextValue: AppContextType = {
    // 状態
    selectedBuilding: state.selectedBuilding,
    showDetail: state.showDetail,
    showAdminPanel: state.showAdminPanel,
    showDataMigration: state.showDataMigration,
    isAuthenticated: state.isAuthenticated,
    currentUser: state.currentUser,
    likedBuildings: state.likedBuildings,
    searchHistory: state.searchHistory,
    showLoginModal: state.showLoginModal,
    currentPage: state.currentPage,
    filters: state.filters,
    
    // アクション
    setSelectedBuilding: state.setSelectedBuilding,
    setShowDetail: state.setShowDetail,
    setShowAdminPanel: state.setShowAdminPanel,
    setShowDataMigration: state.setShowDataMigration,
    setIsAuthenticated: state.setIsAuthenticated,
    setCurrentUser: state.setCurrentUser,
    setLikedBuildings: state.setLikedBuildings,
    setSearchHistory: state.setSearchHistory,
    setShowLoginModal: state.setShowLoginModal,
    setCurrentPage: state.setCurrentPage,
    setFilters: state.setFilters,
    
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
    handleSearchStart,
    
    // その他の状態
    language: effects.language,
    toggleLanguage: effects.toggleLanguage,
    getCurrentLocation: effects.getCurrentLocation,
    locationLoading: effects.locationLoading,
    locationError: effects.locationError,
    buildingsLoading: buildingsData.buildingsLoading,
    buildingsError: buildingsData.buildingsError,
    buildings: buildingsData.buildings,
    filteredBuildings: effects.filteredBuildings,
    currentBuildings,
    totalBuildings: buildingsData.totalBuildings,
    totalPages: pagination.totalPages,
    startIndex: pagination.startIndex,
    itemsPerPage: state.itemsPerPage,
    useApi: effects.useApi,
    apiStatus: effects.apiStatus,
    isSupabaseConnected: effects.isSupabaseConnected,
    popularSearches: state.popularSearches,
    getPaginationRange: () => actions.getPaginationRange(state.currentPage, pagination.totalPages),
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviderContent>
        {children}
      </AppProviderContent>
    </QueryClientProvider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 