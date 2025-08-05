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

  // 写真お気に入りハンドラー
  const handlePhotoLike = (photoId: number) => {
    console.log('Like photo:', photoId);
  };

  // ログインハンドラー
  const handleLogin = (
    email: string,
    password: string,
    setIsAuthenticated: (auth: boolean) => void,
    setCurrentUser: (user: User | null) => void,
    setShowLoginModal: (show: boolean) => void
  ) => {
    console.log('Login:', email, password);
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
    console.log('Register:', email, password, name);
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
    console.log('Add building:', buildingData);
  };

  // 建物更新ハンドラー
  const handleUpdateBuilding = (id: number, buildingData: Partial<Building>) => {
    console.log('Update building:', id, buildingData);
  };

  // 建物削除ハンドラー
  const handleDeleteBuilding = (id: number) => {
    console.log('Delete building:', id);
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
    navigate(`/?lat=${lat}&lng=${lng}&radius=2`);
  };

  // ページ変更ハンドラー
  const handlePageChange = (
    page: number,
    totalPages: number,
    currentPage: number,
    setCurrentPage: (page: number) => void
  ) => {
    console.log(`ページ変更開始: ${page}/${totalPages}, 現在のページ: ${currentPage}`);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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