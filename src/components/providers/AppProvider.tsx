import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppContextType } from '../../types/app';
import { Building } from '../../types';
import { useAppState } from '../../hooks/useAppState';
import { useAppActions } from '../../hooks/useAppActions';
import { useAppHandlers } from '../../hooks/useAppHandlers';
import { useAppEffects } from '../../hooks/useAppEffects';
import { searchBuildings } from '../../utils/search';

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
  
  // URL同期効果（location.search 変更時のみ発火）
  useEffect(() => {
    if (state.isUpdatingFromURL.current) return;
    
    const searchParams = new URLSearchParams(state.location.search);
    const query = searchParams.get('q') || '';
    const architects = searchParams.get('architects')?.split(',').filter(Boolean) || [];
    const buildingTypes = searchParams.get('buildingTypes')?.split(',').filter(Boolean) || [];
    const prefectures = searchParams.get('prefectures')?.split(',').filter(Boolean) || [];
    const areas = searchParams.get('areas')?.split(',').filter(Boolean) || [];
    const hasPhotos = searchParams.get('hasPhotos') === 'true';
    const hasVideos = searchParams.get('hasVideos') === 'true';
    const radius = parseInt(searchParams.get('radius') || '5', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    
    const nextFilters = {
      query,
      architects,
      buildingTypes,
      prefectures,
      areas,
      hasPhotos,
      hasVideos,
      radius,
      currentLocation: null
    } as const;

    // 変更がない場合は何もしない
    if (
      JSON.stringify(state.filters) === JSON.stringify(nextFilters) &&
      state.currentPage === page
    ) {
      return;
    }

    // URL由来の更新であることを示すフラグを一時的にON
    state.isUpdatingFromURL.current = true;
    
    state.setFilters(nextFilters as any);
    state.setCurrentPage(page);
    
    // 次のパッシブ効果実行タイミングまで維持
    setTimeout(() => {
      state.isUpdatingFromURL.current = false;
    }, 0);
  }, [state.location.search, state.setFilters, state.setCurrentPage]);
  
  // URL更新効果
  useEffect(() => {
    if (state.isUpdatingFromURL.current) return;
    
    const timeoutId = setTimeout(() => {
      actions.updateURLWithFilters(state.filters, state.currentPage);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [state.filters, state.currentPage, actions.updateURLWithFilters]);
  
  // 位置情報効果
  useEffect(() => {
    if (effects.geoLocation) {
      state.setFilters((prev: any) => ({
        ...prev,
        currentLocation: effects.geoLocation
      }));
    }
  }, [effects.geoLocation, state.setFilters]);
  
  // フィルター変更効果
  useEffect(() => {
    // フィルターが変更された場合のみ実行
    const prevFilters = state.prevFiltersRef.current;
    if (prevFilters && JSON.stringify(prevFilters) === JSON.stringify(state.filters)) {
      return;
    }
    
    // console.debug('🔄 フィルター変更検出:', { prevFilters, currentFilters: state.filters, buildingsCount: buildingsData.buildings.length });
    
    // 検索履歴を更新
    if (state.filters.query && state.filters.query.trim()) {
      const existingIndex = state.searchHistory.findIndex(h => h.query === state.filters.query);
      if (existingIndex >= 0) {
        const updated = [...state.searchHistory];
        updated[existingIndex] = {
          ...updated[existingIndex],
          searchedAt: new Date().toISOString(),
          count: updated[existingIndex].count + 1
        };
        state.setSearchHistory(updated);
      } else {
        state.setSearchHistory((prev: any[]) => [
          { query: state.filters.query, searchedAt: new Date().toISOString(), count: 1 },
          ...prev.slice(0, 19)
        ]);
      }
    }
    
    // API使用時はサーバーサイドフィルタリング
    if (effects.useApi) {
      // console.debug('📡 API使用時のフィルタリング');
      effects.setFilteredBuildings(buildingsData.buildings);
      return;
    }
    
    // クライアントサイドフィルタリング（全件→フィルタ→ページング）
    const results = searchBuildings(buildingsData.buildings, state.filters, effects.language);
    effects.setFilteredBuildings(results);
    
    // 前のフィルターを更新
    state.prevFiltersRef.current = { ...state.filters };
  }, [state.filters, buildingsData.buildings, effects.useApi, effects.language, effects.setFilteredBuildings, state.setCurrentPage, state.searchHistory, state.setSearchHistory, state.prevFiltersRef]);
  
  // ページネーション計算（モック時はフィルタ済み全件に対して計算）
  const pagination = actions.calculatePagination(
    effects.useApi ? buildingsData.totalBuildings : effects.filteredBuildings.length,
    state.itemsPerPage,
    state.currentPage
  );


  
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
    actions.updateLikedBuildings(state.setLikedBuildings, buildingId, buildingsData.buildings),
    [actions.updateLikedBuildings, state.setLikedBuildings, buildingsData.buildings]
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
    actions.updateSearchHistory(state.searchHistory, state.setSearchHistory, query),
    [actions.updateSearchHistory, state.searchHistory, state.setSearchHistory]
  );
    
  const handleLikedBuildingClick = useCallback((buildingId: number) => 
    handlers.handleLikedBuildingClick(buildingId, buildingsData.buildings, state.setSelectedBuilding),
    [handlers.handleLikedBuildingClick, buildingsData.buildings, state.setSelectedBuilding]
  );
    
  const handleRemoveLikedBuilding = useCallback((buildingId: number) => 
    state.setLikedBuildings(prev => prev.filter(building => building.id !== buildingId)),
    [state.setLikedBuildings]
  );
    
  const handleSearchAround = useCallback((lat: number, lng: number) => 
    handlers.handleSearchAround(lat, lng, (path: string) => {
      // 簡易的なナビゲーション実装
      window.history.pushState({}, '', path);
    }),
    [handlers.handleSearchAround]
  );
    
  const handlePageChange = useCallback((page: number) => {
    handlers.handlePageChange(page, pagination.totalPages, state.currentPage, state.setCurrentPage);
  }, [handlers.handlePageChange, pagination.totalPages, state.currentPage, state.setCurrentPage]);

  // 検索開始時のコールバック（建築物詳細をクリア）
  const handleSearchStart = useCallback(() => {
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
    handleRemoveLikedBuilding,
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
  // 常に同じ構造を返す（Hooks違反を防ぐ）
  return context;
} 