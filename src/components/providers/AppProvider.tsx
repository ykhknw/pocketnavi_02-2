import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building, SearchFilters, User, LikedBuilding, SearchHistory } from '../../types';
import { searchBuildings } from '../../utils/search';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useLanguage } from '../../hooks/useLanguage';
import { useSupabaseBuildings } from '../../hooks/useSupabaseBuildings';
import { useSupabaseToggle } from '../../hooks/useSupabaseToggle';
import { AppContextType } from '../../types/app';

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 状態管理
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showDataMigration, setShowDataMigration] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [likedBuildings, setLikedBuildings] = useState<LikedBuilding[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [popularSearches] = useState<SearchHistory[]>([
    { query: '安藤忠雄', searchedAt: '', count: 45 },
    { query: '美術館', searchedAt: '', count: 38 },
    { query: '東京', searchedAt: '', count: 32 },
    { query: '現代建築', searchedAt: '', count: 28 },
    { query: 'コンクリート', searchedAt: '', count: 24 },
    { query: '隈研吾', searchedAt: '', count: 22 },
    { query: '図書館', searchedAt: '', count: 19 },
    { query: '駅舎', searchedAt: '', count: 16 }
  ]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const itemsPerPage = 10;
  
  // URLから初期状態を読み込む
  const searchParams = new URLSearchParams(location.search);
  const { filters: initialFilters, currentPage: initialPage } = parseFiltersFromURL(searchParams);
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  // フックの使用
  const { location: geoLocation, error: locationError, loading: locationLoading, getCurrentLocation } = useGeolocation();
  const { language, toggleLanguage } = useLanguage();
  const { useApi, apiStatus, isApiAvailable, isSupabaseConnected } = useSupabaseToggle();
  
  // Supabase統合: 段階的にAPI化
  const { 
    buildings, 
    loading: buildingsLoading, 
    error: buildingsError, 
    total: totalBuildings,
    refetch 
  } = useSupabaseBuildings(filters, currentPage, itemsPerPage, useApi);
  
  // 検索結果のフィルタリング（モックデータ使用時）
  const [filteredBuildings, setFilteredBuildings] = useState<Building[]>([]);

  // URLが変更されたときに状態を更新
  useEffect(() => {
    isUpdatingFromURL.current = true;
    const { filters: urlFilters, currentPage: urlPage } = parseFiltersFromURL(searchParams);
    setFilters(urlFilters);
    setCurrentPage(urlPage);
  }, [location.search]);

  // フィルターまたはページが変更されたときにURLを更新（ただし、URLからの変更でない場合のみ）
  const isUpdatingFromURL = useRef(false);
  useEffect(() => {
    if (isUpdatingFromURL.current) {
      isUpdatingFromURL.current = false;
      return;
    }
    updateURLWithFilters(navigate, filters, currentPage);
  }, [filters, currentPage, navigate]);

  useEffect(() => {
    if (geoLocation) {
      setFilters(prev => ({ ...prev, currentLocation: geoLocation }));
    }
  }, [geoLocation]);

  // フィルターの変更を追跡するためのref
  const prevFiltersRef = useRef<SearchFilters>(filters);

  useEffect(() => {
    if (useApi) {
      // API使用時は既にフィルタリング済み
      setFilteredBuildings(buildings);
    } else {
      // モックデータ使用時はクライアントサイドフィルタリング
      const results = searchBuildings(buildings, filters);
      setFilteredBuildings(results);
    }

    // フィルターが実際に変更された場合のみページをリセット
    const filtersChanged = JSON.stringify(prevFiltersRef.current) !== JSON.stringify(filters);
    if (filtersChanged) {
      setCurrentPage(1);
      prevFiltersRef.current = filters;
    }
    
    // Add to search history if there's a query
    if (filters.query.trim()) {
      const existingIndex = searchHistory.findIndex(h => h.query === filters.query);
      if (existingIndex >= 0) {
        const updated = [...searchHistory];
        updated[existingIndex] = {
          ...updated[existingIndex],
          searchedAt: new Date().toISOString(),
          count: updated[existingIndex].count + 1
        };
        setSearchHistory(updated);
      } else {
        setSearchHistory(prev => [
          { query: filters.query, searchedAt: new Date().toISOString(), count: 1 },
          ...prev.slice(0, 19) // Keep only last 20 searches
        ]);
      }
    }
  }, [useApi, buildings, filters, searchHistory]);

  // ページネーション計算
  const totalPages = Math.ceil((useApi ? totalBuildings : filteredBuildings.length) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBuildings = useApi 
    ? buildings // API使用時はbuildings（既にページング済み）
    : filteredBuildings.slice(startIndex, startIndex + itemsPerPage);

  // ハンドラー関数
  const handleBuildingSelect = (building: Building | null) => {
    setSelectedBuilding(building);
    setShowDetail(false);
  };

  const handleLike = (buildingId: number) => {
    console.log('Like building:', buildingId);
    setLikedBuildings(prev => {
      const existing = prev.find(b => b.id === buildingId);
      if (existing) {
        return prev.filter(b => b.id !== buildingId);
      } else {
        const building = buildings.find(b => b.id === buildingId);
        if (building) {
          return [...prev, {
            id: building.id,
            title: building.title,
            titleEn: building.titleEn,
            likedAt: new Date().toISOString()
          }];
        }
      }
      return prev;
    });
  };

  const handlePhotoLike = (photoId: number) => {
    console.log('Like photo:', photoId);
  };

  const handleLogin = (email: string, password: string) => {
    console.log('Login:', email, password);
    setIsAuthenticated(true);
    setCurrentUser({ id: 1, email, name: 'User', created_at: new Date().toISOString() });
    setShowLoginModal(false);
  };

  const handleRegister = (email: string, password: string, name: string) => {
    console.log('Register:', email, password, name);
    setIsAuthenticated(true);
    setCurrentUser({ id: 1, email, name, created_at: new Date().toISOString() });
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleAddBuilding = (buildingData: Partial<Building>) => {
    console.log('Add building:', buildingData);
  };

  const handleUpdateBuilding = (id: number, buildingData: Partial<Building>) => {
    console.log('Update building:', id, buildingData);
  };

  const handleDeleteBuilding = (id: number) => {
    console.log('Delete building:', id);
  };

  const handleSearchFromHistory = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
  };

  const handleLikedBuildingClick = (buildingId: number) => {
    const building = buildings.find(b => b.id === buildingId);
    if (building) {
      setSelectedBuilding(building);
    }
  };

  const handleSearchAround = (lat: number, lng: number) => {
    navigate(`/?lat=${lat}&lng=${lng}&radius=2`);
  };

  const handlePageChange = (page: number) => {
    console.log(`ページ変更開始: ${page}/${totalPages}, 現在のページ: ${currentPage}`);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // スマートページネーション範囲を生成
  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1 && currentPage !== totalPages) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const contextValue: AppContextType = {
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
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// URLからフィルターとページ情報を解析する関数
function parseFiltersFromURL(searchParams: URLSearchParams): { filters: SearchFilters; currentPage: number } {
  const filters: SearchFilters = {
    query: searchParams.get('q') || '',
    radius: parseInt(searchParams.get('radius') || '5', 10),
    architects: searchParams.get('architects')?.split(',').filter(Boolean) || [],
    buildingTypes: searchParams.get('buildingTypes')?.split(',').filter(Boolean) || [],
    prefectures: searchParams.get('prefectures')?.split(',').filter(Boolean) || [],
    areas: searchParams.get('areas')?.split(',').filter(Boolean) || [],
    hasPhotos: searchParams.get('hasPhotos') === 'true',
    hasVideos: searchParams.get('hasVideos') === 'true',
    currentLocation: null
  };

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  return { filters, currentPage };
}

// フィルターとページ情報をURLに反映する関数
function updateURLWithFilters(navigate: any, filters: SearchFilters, currentPage: number) {
  const searchParams = new URLSearchParams();
  
  if (filters.query) searchParams.set('q', filters.query);
  if (filters.radius !== 5) searchParams.set('radius', filters.radius.toString());
  if (filters.architects && filters.architects.length > 0) searchParams.set('architects', filters.architects.join(','));
  if (filters.buildingTypes && filters.buildingTypes.length > 0) searchParams.set('buildingTypes', filters.buildingTypes.join(','));
  if (filters.prefectures && filters.prefectures.length > 0) searchParams.set('prefectures', filters.prefectures.join(','));
  if (filters.areas && filters.areas.length > 0) searchParams.set('areas', filters.areas.join(','));
  if (filters.hasPhotos) searchParams.set('hasPhotos', 'true');
  if (filters.hasVideos) searchParams.set('hasVideos', 'true');
  if (currentPage > 1) searchParams.set('page', currentPage.toString());

  const searchString = searchParams.toString();
  const newPath = searchString ? `/?${searchString}` : '/';
  
  navigate(newPath, { replace: true });
} 