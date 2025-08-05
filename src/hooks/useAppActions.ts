import { useNavigate } from 'react-router-dom';
import { Building, SearchFilters, SearchHistory, LikedBuilding } from '../types';

export function useAppActions() {
  const navigate = useNavigate();
  
  // フィルターとページ情報をURLに反映する関数
  const updateURLWithFilters = (filters: SearchFilters, currentPage: number) => {
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
  };

  // ページネーション計算
  const calculatePagination = (totalItems: number, itemsPerPage: number, currentPage: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    
    return {
      totalPages,
      startIndex,
      currentPage,
      itemsPerPage
    };
  };

  // スマートページネーション範囲を生成
  const getPaginationRange = (currentPage: number, totalPages: number) => {
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

  // 検索履歴の更新
  const updateSearchHistory = (
    searchHistory: SearchHistory[],
    setSearchHistory: (history: SearchHistory[]) => void,
    query: string
  ) => {
    if (query.trim()) {
      const existingIndex = searchHistory.findIndex(h => h.query === query);
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
          { query, searchedAt: new Date().toISOString(), count: 1 },
          ...prev.slice(0, 19) // Keep only last 20 searches
        ]);
      }
    }
  };

  // お気に入り建物の更新
  const updateLikedBuildings = (
    likedBuildings: LikedBuilding[],
    setLikedBuildings: (buildings: LikedBuilding[]) => void,
    buildingId: number,
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

  return {
    updateURLWithFilters,
    calculatePagination,
    getPaginationRange,
    updateSearchHistory,
    updateLikedBuildings
  };
} 