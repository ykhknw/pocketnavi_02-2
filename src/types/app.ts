import { Building, SearchFilters, User, LikedBuilding, SearchHistory } from './index';

export interface AppState {
  selectedBuilding: Building | null;
  showDetail: boolean;
  showAdminPanel: boolean;
  showDataMigration: boolean;
  isAuthenticated: boolean;
  currentUser: User | null;
  likedBuildings: LikedBuilding[];
  searchHistory: SearchHistory[];
  showLoginModal: boolean;
  showAdvancedSearch: boolean;
  currentPage: number;
  filters: SearchFilters;
}

export interface AppActions {
  setSelectedBuilding: (building: Building | null) => void;
  setShowDetail: (show: boolean) => void;
  setShowAdminPanel: (show: boolean) => void;
  setShowDataMigration: (show: boolean) => void;
  setIsAuthenticated: (authenticated: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  setLikedBuildings: (buildings: LikedBuilding[]) => void;
  setSearchHistory: (history: SearchHistory[]) => void;
  setShowLoginModal: (show: boolean) => void;
  setShowAdvancedSearch: (show: boolean) => void;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: SearchFilters) => void;
  updateSearchHistory: (
    searchHistory: SearchHistory[],
    setSearchHistory: (history: SearchHistory[]) => void,
    query: string,
    type?: 'text' | 'architect' | 'prefecture',
    filters?: Partial<SearchFilters>
  ) => void;
}

export interface AppHandlers {
  handleBuildingSelect: (building: Building | null) => void;
  handleLike: (buildingId: number) => void;
  handlePhotoLike: (photoId: number) => void;
  handleLogin: (email: string, password: string) => void;
  handleRegister: (email: string, password: string, name: string) => void;
  handleLogout: () => void;
  handleAddBuilding: (buildingData: Partial<Building>) => void;
  handleUpdateBuilding: (id: number, buildingData: Partial<Building>) => void;
  handleDeleteBuilding: (id: number) => void;
  handleSearchFromHistory: (query: string) => void;
  handleLikedBuildingClick: (buildingId: number) => void;
  handleRemoveLikedBuilding: (buildingId: number) => void;
  handleSearchAround: (lat: number, lng: number) => void;
  handlePageChange: (page: number) => void;
  handleSearchStart: () => void;
  handleRemoveRecentSearch: (index: number) => void;
}

export interface AppContextType extends AppState, AppActions, AppHandlers {
  language: 'ja' | 'en';
  toggleLanguage: () => void;
  getCurrentLocation: () => void;
  locationLoading: boolean;
  locationError: string | null;
  buildingsLoading: boolean;
  buildingsError: string | null;
  buildings: Building[];
  filteredBuildings: Building[];
  currentBuildings: Building[];
  totalBuildings: number;
  totalPages: number;
  startIndex: number;
  itemsPerPage: number;
  useApi: boolean;
  apiStatus: string;
  isSupabaseConnected: boolean;
  popularSearches: SearchHistory[];
  popularSearchesLoading: boolean;
  popularSearchesError: string | null;
  getPaginationRange: () => (number | string)[];
} 