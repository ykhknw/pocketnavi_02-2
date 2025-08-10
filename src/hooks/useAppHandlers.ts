import { Building, User, LikedBuilding, SearchFilters } from '../types';

export function useAppHandlers() {
  // 建物選択ハンドラー
  const handleBuildingSelect = (
    building: Building | null,
    setSelectedBuilding: (building: Building | null) => void,
    setShowDetail: (show: boolean) => void
  ) => {
    setSelectedBuilding(building);
    setShowDetail(false);
  };

  // お気に入りハンドラー
  const handleLike = (
    buildingId: number,
    likedBuildings: LikedBuilding[],
    setLikedBuildings: (buildings: LikedBuilding[]) => void,
    buildings: Building[]
  ) => {
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

  // 写真お気に入りハンドラー
  const handlePhotoLike = (photoId: number) => {
    // Photo like functionality
  };

  // ログインハンドラー
  const handleLogin = (
    email: string,
    password: string,
    setIsAuthenticated: (auth: boolean) => void,
    setCurrentUser: (user: User | null) => void,
    setShowLoginModal: (show: boolean) => void
  ) => {
    setIsAuthenticated(true);
    setCurrentUser({ id: 1, email, name: 'User', created_at: new Date().toISOString() });
    setShowLoginModal(false);
  };

  // 登録ハンドラー
  const handleRegister = (
    email: string,
    password: string,
    name: string,
    setIsAuthenticated: (auth: boolean) => void,
    setCurrentUser: (user: User | null) => void,
    setShowLoginModal: (show: boolean) => void
  ) => {
    setIsAuthenticated(true);
    setCurrentUser({ id: 1, email, name, created_at: new Date().toISOString() });
    setShowLoginModal(false);
  };

  // ログアウトハンドラー
  const handleLogout = (
    setIsAuthenticated: (auth: boolean) => void,
    setCurrentUser: (user: User | null) => void
  ) => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // 建物追加ハンドラー
  const handleAddBuilding = (buildingData: Partial<Building>) => {
    // Add building functionality
  };

  // 建物更新ハンドラー
  const handleUpdateBuilding = (id: number, buildingData: Partial<Building>) => {
    // Update building functionality
  };

  // 建物削除ハンドラー
  const handleDeleteBuilding = (id: number) => {
    // Delete building functionality
  };

  // 検索履歴からの検索ハンドラー
  const handleSearchFromHistory = (
    query: string,
    setFilters: (filters: SearchFilters) => void,
    filters: SearchFilters
  ) => {
    setFilters(prev => ({ ...prev, query }));
  };

  // お気に入り建物クリックハンドラー
  const handleLikedBuildingClick = (
    buildingId: number,
    buildings: Building[],
    setSelectedBuilding: (building: Building | null) => void
  ) => {
    const building = buildings.find(b => b.id === buildingId);
    if (building) {
      setSelectedBuilding(building);
    }
  };

  // 周辺検索ハンドラー
  const handleSearchAround = (
    lat: number,
    lng: number,
    navigate: (path: string) => void
  ) => {
    // デフォルト半径は5km、URLにlat/lngを必ず含める
    navigate(`/?lat=${lat}&lng=${lng}&radius=5`);
  };

  // ページ変更ハンドラー
  const handlePageChange = (
    page: number,
    totalPages: number,
    currentPage: number,
    setCurrentPage: (page: number) => void
  ) => {
    console.log(`ページ変更開始: ${page}/${totalPages}, 現在のページ: ${currentPage}`);
    
    // ページが実際に変更される場合のみ処理
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      console.log(`ページ変更実行: ${currentPage} → ${page}`);
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // ページ変更後の処理
      console.log('✅ Page change completed');
    } else {
      console.log(`ページ変更スキップ: ${page} (現在: ${currentPage}, 総ページ: ${totalPages})`);
    }
  };

  return {
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
    handlePageChange
  };
} 