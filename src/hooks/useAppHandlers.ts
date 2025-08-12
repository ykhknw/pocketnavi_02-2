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
    setCurrentPage: (page: number) => void
  ) => {
    setFilters(prev => ({ ...prev, query }));
    setCurrentPage(1);
  };

  // お気に入り建物クリックハンドラー
  const handleLikedBuildingClick = (
    buildingId: number,
    likedBuildings: LikedBuilding[],
    setLikedBuildings: (buildings: LikedBuilding[]) => void,
    buildings: Building[]
  ) => {
    // お気に入り建物の詳細表示（必要に応じて実装）
    console.log('お気に入り建物クリック:', buildingId);
  };

  // 周辺検索ハンドラー
  const handleSearchAround = (
    lat: number,
    lng: number,
    setFilters: (filters: SearchFilters) => void,
    setCurrentPage: (page: number) => void
  ) => {
    // デフォルト半径は5km、位置情報をフィルターに設定
    setFilters(prev => ({
      ...prev,
      currentLocation: { lat, lng },
      radius: 5
    }));
    setCurrentPage(1);
  };

  // ページ変更ハンドラー
  const handlePageChange = (
    page: number,
    setCurrentPage: (page: number) => void,
    setFilters: (filters: SearchFilters) => void,
    location: any
  ) => {
    console.log(`ページ変更開始: ${page}`);
    
    // ページが実際に変更される場合のみ処理
    if (page >= 1) {
      console.log(`ページ変更実行: → ${page}`);
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // ページ変更後の処理
      console.log('✅ Page change completed');
    } else {
      console.log(`ページ変更スキップ: ${page}`);
    }
  };

  // お気に入り建物削除ハンドラー
  const handleRemoveLikedBuilding = (
    buildingId: number,
    setLikedBuildings: (buildings: LikedBuilding[]) => void
  ) => {
    setLikedBuildings(prev => prev.filter(b => b.id !== buildingId));
  };

  // 検索開始ハンドラー
  const handleSearchStart = (setCurrentPage: (page: number) => void) => {
    setCurrentPage(1);
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
    handleRemoveLikedBuilding,
    handleSearchAround,
    handlePageChange,
    handleSearchStart
  };
} 