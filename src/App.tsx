import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from './components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Building, SearchFilters, User, LikedBuilding, SearchHistory } from './types';
import { searchBuildings } from './utils/search';
import { useGeolocation } from './hooks/useGeolocation';
import { useLanguage } from './hooks/useLanguage';
import { useSupabaseBuildings, useBuildingById } from './hooks/useSupabaseBuildings';
import { useSupabaseToggle } from './hooks/useSupabaseToggle';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { BuildingCard } from './components/BuildingCard';
import { BuildingDetail } from './components/BuildingDetail';
import Map from './components/Map';
import { LoginModal } from './components/LoginModal';
import { AdminPanel } from './components/AdminPanel';
import { LikedBuildings } from './components/LikedBuildings';
import { SearchHistoryComponent } from './components/SearchHistory';
import { DataMigration } from './components/DataMigration';

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

// 建築物のslugを生成する関数
function generateSlug(building: Building): string {
  const title = building.titleEn || building.title;
  return `${building.id}-${title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)}`;
}

// slugから建築物IDを抽出する関数
function extractIdFromSlug(slug: string): number {
  const id = slug.split('-')[0];
  return parseInt(id, 10);
}

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const isUpdatingFromURL = React.useRef(false);
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
  const prevFiltersRef = React.useRef<SearchFilters>(filters);

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
    console.log('フィルター変更チェック:', {
      filtersChanged,
      currentPage,
      prevFilters: prevFiltersRef.current,
      currentFilters: filters
    });
    if (filtersChanged) {
      console.log('フィルターが変更されたため、ページをリセット');
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

  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building);
    setShowDetail(false); // モーダル表示を無効化
  };

  const handleLike = (buildingId: number) => {
    const building = buildings.find(b => b.id === buildingId);
    if (building && !likedBuildings.find(l => l.id === buildingId)) {
      setLikedBuildings(prev => [
        {
          id: building.id,
          title: building.title,
          titleEn: building.titleEn,
          likedAt: new Date().toISOString()
        },
        ...prev
      ]);
    }
    
    // TODO: API化時はapiClient.likeBuilding(buildingId)を呼び出し
    if (!useApi) {
      // モックデータの更新（現状維持）
      setFilteredBuildings(prev => 
        prev.map(building => 
          building.id === buildingId 
            ? { ...building, likes: building.likes + 1 }
            : building
        )
      );
    }
  };

  const handlePhotoLike = (photoId: number) => {
    // TODO: API化時はapiClient.likePhoto(photoId)を呼び出し
    if (!useApi) {
      setFilteredBuildings(prev => 
        prev.map(building => ({
          ...building,
          photos: building.photos.map(photo => 
            photo.id === photoId 
              ? { ...photo, likes: photo.likes + 1 }
              : photo
          )
        }))
      );
    }
  };

  const handleLogin = (email: string, password: string) => {
    // Mock authentication
    setIsAuthenticated(true);
    setCurrentUser({
      id: 1,
      email,
      name: email.split('@')[0],
      created_at: new Date().toISOString()
    });
    setShowLoginModal(false);
  };

  const handleRegister = (email: string, password: string, name: string) => {
    // Mock registration
    setIsAuthenticated(true);
    setCurrentUser({
      id: 1,
      email,
      name,
      created_at: new Date().toISOString()
    });
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleAddBuilding = (buildingData: Partial<Building>) => {
    const newBuilding: Building = {
      id: Math.max(...filteredBuildings.map(b => b.id)) + 1,
      uid: `building_${Date.now()}`,
      title: buildingData.title || '',
      titleEn: buildingData.titleEn || '',
      thumbnailUrl: buildingData.thumbnailUrl || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
      youtubeUrl: buildingData.youtubeUrl || '',
      completionYears: buildingData.completionYears || new Date().getFullYear(),
      parentBuildingTypes: buildingData.parentBuildingTypes || [],
      buildingTypes: buildingData.buildingTypes || [],
      parentStructures: buildingData.parentStructures || [],
      structures: buildingData.structures || [],
      prefectures: buildingData.prefectures || '',
      areas: buildingData.areas || '',
      location: buildingData.location || '',
      architectDetails: buildingData.architectDetails || '',
      lat: buildingData.lat || 35.6762,
      lng: buildingData.lng || 139.6503,
      architects: buildingData.architects || [],
      photos: buildingData.photos || [],
      likes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // TODO: API化時はapiClient.createBuilding(newBuilding)を呼び出し
    if (!useApi) {
      setFilteredBuildings(prev => [...prev, newBuilding]);
    }
  };

  const handleUpdateBuilding = (id: number, buildingData: Partial<Building>) => {
    // TODO: API化時はapiClient.updateBuilding(id, buildingData)を呼び出し
    if (!useApi) {
      setFilteredBuildings(prev => 
        prev.map(building => 
          building.id === id 
            ? { ...building, ...buildingData, updated_at: new Date().toISOString() }
            : building
        )
      );
    }
  };

  const handleDeleteBuilding = (id: number) => {
    if (window.confirm('この建築物を削除しますか？')) {
      // TODO: API化時はapiClient.deleteBuilding(id)を呼び出し
      if (!useApi) {
        setFilteredBuildings(prev => prev.filter(building => building.id !== id));
      }
    }
  };

  const handleSearchFromHistory = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
  };

  const handleLikedBuildingClick = (buildingId: number) => {
    const building = filteredBuildings.find(b => b.id === buildingId);
    if (building) {
      handleBuildingSelect(building);
    }
  };

  const handleSearchAround = (lat: number, lng: number) => {
    setFilters(prev => ({
      ...prev,
      currentLocation: { lat, lng },
      radius: 2,
      query: ''
    }));
    navigate('/');
  };


  const totalPages = Math.ceil((useApi ? totalBuildings : filteredBuildings.length) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBuildings = useApi 
    ? buildings // API使用時はbuildings（既にページング済み）
    : filteredBuildings.slice(startIndex, startIndex + itemsPerPage);

  // ページネーション表示条件のデバッグ
  console.log('ページネーション情報:', {
    filteredBuildingsLength: filteredBuildings.length,
    totalPages,
    currentPage,
    showPagination: filteredBuildings.length >= 10 && totalPages > 1,
    currentBuildingsLength: currentBuildings.length,
    useApi,
    totalBuildings
  });

  const handlePageChange = (page: number) => {
    console.log(`ページ変更開始: ${page}/${totalPages}, 現在のページ: ${currentPage}`);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // スマートページネーション範囲を生成
  const getPaginationRange = () => {
    const delta = 2; // 現在のページの前後に表示するページ数
    const range = [];
    const rangeWithDots = [];

    // 現在のページの前後の範囲を計算
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // 最初のページを追加
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    // 中間のページを追加
    rangeWithDots.push(...range);

    // 最後のページを追加
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1 && currentPage !== totalPages) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onAdminClick={() => setShowAdminPanel(true)}
        language={language}
        onLanguageToggle={toggleLanguage}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* API状態表示（開発用） */}
        {import.meta.env.DEV && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 text-sm">
                データソース: {useApi ? 'Supabase API' : 'モックデータ'} | 状態: {apiStatus}
                {isSupabaseConnected && ' ✅'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDataMigration(true)}
              >
                データ移行
              </Button>
              {buildingsError && (
                <span className="text-red-600 text-sm">Error: {buildingsError}</span>
              )}
            </div>
          </div>
        )}

        <SearchForm
          filters={filters}
          onFiltersChange={setFilters}
          onGetLocation={getCurrentLocation}
          locationLoading={locationLoading}
          locationError={locationError}
          language={language}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {buildingsLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  {language === 'ja' ? '読み込み中...' : 'Loading...'}
                </p>
              </div>
            )}

            {selectedBuilding ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBuilding(null)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {language === 'ja' ? '一覧に戻る' : 'Back to List'}
                  </Button>
                  <h2 className="text-xl font-bold">
                    {language === 'ja' ? '建築物詳細' : 'Building Details'}
                  </h2>
                </div>
                <BuildingDetail
                  building={selectedBuilding}
                  onClose={() => setSelectedBuilding(null)}
                  onLike={handleLike}
                  onPhotoLike={handlePhotoLike}
                  language={language}
                  onSearchAround={handleSearchAround}
                  displayIndex={currentBuildings.findIndex(b => b.id === selectedBuilding.id) + startIndex + 1}
                  isInline={true}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between w-full">
                  <h2 className="text-2xl font-bold text-foreground flex-shrink-0" style={{ fontSize: '1.5rem' }}>
                    {language === 'ja' ? '建築物一覧' : 'Buildings'}
                  </h2>
                  {(useApi ? totalBuildings : filteredBuildings.length) >= 10 && totalPages > 1 && (
                    <span className="text-sm text-muted-foreground">
                      {language === 'ja' 
                        ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, useApi ? totalBuildings : filteredBuildings.length)}/${useApi ? totalBuildings : filteredBuildings.length}件 (${currentPage}/${totalPages}ページ)`
                        : `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, useApi ? totalBuildings : filteredBuildings.length)}/${useApi ? totalBuildings : filteredBuildings.length} items (Page ${currentPage}/${totalPages})`
                      }
                    </span>
                  )}
                </div>

                {currentBuildings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-lg">
                      {language === 'ja' ? '検索条件に合う建築物が見つかりませんでした' : 'No buildings found matching your criteria'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {currentBuildings.map((building, index) => (
                        <BuildingCard
                          key={building.id}
                          building={building}
                          onSelect={handleBuildingSelect}
                          onLike={handleLike}
                          onPhotoLike={handlePhotoLike}
                          isSelected={false}
                          index={startIndex + index}
                          language={language}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {(useApi ? totalBuildings : filteredBuildings.length) >= 10 && totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-8 w-full">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          {language === 'ja' ? '前へ' : 'Previous'}
                        </button>
                        
                        {getPaginationRange().map((page, index) => (
                          <button
                            key={index}
                            onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                            disabled={typeof page !== 'number'}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                              typeof page === 'number'
                                ? currentPage === page
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
                                : 'bg-transparent border-none text-gray-400 cursor-default'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          {language === 'ja' ? '次へ' : 'Next'}
                        </button>
                      </div>
                    )}
                  </>
                )}
            </>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6 lg:pl-4">
            <Map
              buildings={currentBuildings}
              selectedBuilding={selectedBuilding}
              onBuildingSelect={handleBuildingSelect}
              currentLocation={filters.currentLocation}
              language={language}
              startIndex={startIndex}
              onSearchAround={handleSearchAround}
            />
            
            <LikedBuildings
              likedBuildings={likedBuildings}
              language={language}
              onBuildingClick={handleLikedBuildingClick}
            />
            
            <SearchHistoryComponent
              recentSearches={searchHistory}
              popularSearches={popularSearches}
              language={language}
              onSearchClick={handleSearchFromHistory}
            />
          </div>
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

function BuildingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { useApi } = useSupabaseToggle();
  
  // slugから建築物IDを抽出
  const buildingId = slug ? extractIdFromSlug(slug) : null;
  
  // 特定の建築物IDを取得
  const { building, loading, error } = useBuildingById(buildingId, useApi);

  // URLのstateから建築物データを取得（優先）
  const buildingFromState = location.state?.building;
  const finalBuilding = buildingFromState || building;

  const handleClose = () => {
    // ブラウザの履歴を使用して前のページに戻る
    navigate(-1);
  };

  const handleLike = (buildingId: number) => {
    // Like処理（実装は省略）
    console.log('Like building:', buildingId);
  };

  const handlePhotoLike = (photoId: number) => {
    // Photo like処理（実装は省略）
    console.log('Like photo:', photoId);
  };

  const handleSearchAround = (lat: number, lng: number) => {
    navigate(`/?lat=${lat}&lng=${lng}&radius=2`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">読み込み中...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!finalBuilding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">建築物が見つかりません</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // 表示インデックスを計算（簡易版）
  const displayIndex = 1; // 詳細ページでは常に1として表示

  return (
    <div className="min-h-screen bg-background">
      <Header
        isAuthenticated={false}
        currentUser={null}
        onLoginClick={() => {}}
        onLogout={() => {}}
        onAdminClick={() => {}}
        language={language}
        onLanguageToggle={() => {}}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BuildingDetail
          building={finalBuilding}
          onClose={handleClose}
          onLike={handleLike}
          onPhotoLike={handlePhotoLike}
          language={language}
          onSearchAround={handleSearchAround}
          displayIndex={displayIndex}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/building/:slug" element={<BuildingDetailPage />} />
    </Routes>
  );
}

export default App;