import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';
import { Building, SearchFilters, SearchHistory, LikedBuilding } from '../types';

export function useAppActions() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // フィルターとページ情報をURLに反映する関数（メモ化）
  const updateURLWithFilters = useCallback((filters: SearchFilters, currentPage: number) => {
    console.log('🔍 updateURLWithFilters 呼び出し:', { filters, currentPage });
    
    const searchParams = new URLSearchParams();
    
    if (filters.query) searchParams.set('q', filters.query);
    if (filters.radius !== 5) searchParams.set('radius', filters.radius.toString());
    // 位置情報があれば lat/lng もURLに含める（周辺検索のURL維持）
    if (filters.currentLocation &&
        typeof filters.currentLocation.lat === 'number' &&
        typeof filters.currentLocation.lng === 'number' &&
        !Number.isNaN(filters.currentLocation.lat) &&
        !Number.isNaN(filters.currentLocation.lng)) {
      searchParams.set('lat', String(filters.currentLocation.lat));
      searchParams.set('lng', String(filters.currentLocation.lng));
    }
    if (filters.architects && filters.architects.length > 0) searchParams.set('architects', filters.architects.join(','));
    if (filters.buildingTypes && filters.buildingTypes.length > 0) searchParams.set('buildingTypes', filters.buildingTypes.join(','));
    if (filters.prefectures && filters.prefectures.length > 0) searchParams.set('prefectures', filters.prefectures.join(','));
    if (filters.areas && filters.areas.length > 0) searchParams.set('areas', filters.areas.join(','));
    if (filters.hasPhotos) searchParams.set('hasPhotos', 'true');
    if (filters.hasVideos) searchParams.set('hasVideos', 'true');
    
    // 建築年フィルターの詳細ログ
    console.log('🔍 建築年フィルター状態:', {
      completionYear: filters.completionYear,
      type: typeof filters.completionYear,
      isNumber: typeof filters.completionYear === 'number',
      isNaN: typeof filters.completionYear === 'number' ? isNaN(filters.completionYear) : 'N/A'
    });
    
    if (typeof filters.completionYear === 'number' && !isNaN(filters.completionYear)) {
      searchParams.set('year', String(filters.completionYear));
      console.log('🔍 建築年パラメータ設定:', String(filters.completionYear));
    }
    
    if (filters.excludeResidential === false) searchParams.set('excl', '0');
    if (currentPage > 1) searchParams.set('page', currentPage.toString());

    const searchString = searchParams.toString();
    const basePath = location.pathname || '/';

    // 変更がない場合は遷移しない
    const currentSearch = new URLSearchParams(location.search).toString();
    
    console.log('🔍 URL更新詳細:', {
      currentSearch,
      searchString,
      basePath,
      willNavigate: currentSearch !== searchString
    });
    
    if (currentSearch === searchString) {
      console.log('🔍 URL変更なし - ナビゲーションをスキップ');
      return;
    }

    const newPath = searchString ? `${basePath}?${searchString}` : basePath;
    console.log('🔍 新しいパスにナビゲート:', newPath);
    navigate(newPath, { replace: true });
  }, [navigate, location.pathname, location.search]);

  // ページネーション計算（メモ化）
  const calculatePagination = useCallback((totalItems: number, itemsPerPage: number, currentPage: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    
    return {
      totalPages,
      startIndex,
      currentPage,
      itemsPerPage
    };
  }, []);

  // スマートページネーション範囲を生成（メモ化）
  const getPaginationRange = useCallback((currentPage: number, totalPages: number) => {
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
    } else if (totalPages > 1) {
      // 最後のページがまだ含まれていない場合のみ追加
      if (!rangeWithDots.includes(totalPages)) {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  }, []);

  // 検索履歴の更新（メモ化）
  const updateSearchHistory = useCallback((
    searchHistory: SearchHistory[],
    setSearchHistory: (updater: SearchHistory[] | ((prev: SearchHistory[]) => SearchHistory[])) => void,
    query: string,
    type: 'text' | 'architect' | 'prefecture' = 'text',
    filters?: Partial<SearchFilters>
  ) => {
    if (query.trim()) {
      // ローカル検索履歴の更新
      const existingIndex = searchHistory.findIndex(h => h.query === query && h.type === type);
      if (existingIndex >= 0) {
        const updated = [...searchHistory];
        updated[existingIndex] = {
          ...updated[existingIndex],
          searchedAt: new Date().toISOString(),
          count: updated[existingIndex].count + 1
        };
        setSearchHistory(updated);
      } else {
        setSearchHistory((prev: SearchHistory[]) => [
          { 
            query, 
            searchedAt: new Date().toISOString(), 
            count: 1,
            type,
            filters
          },
          ...prev.slice(0, 19) // Keep only last 20 searches
        ]);
      }

      // グローバル検索履歴にも保存（非同期）
      import('../services/supabase-api').then(({ saveSearchToGlobalHistory }) => {
        saveSearchToGlobalHistory(query, type, filters).catch(err => {
          console.error('グローバル検索履歴の保存に失敗:', err);
        });
      });
    }
  }, []);

  // お気に入り建物の更新（メモ化）
  const updateLikedBuildings = useCallback((
    setLikedBuildings: (updater: LikedBuilding[] | ((prev: LikedBuilding[]) => LikedBuilding[])) => void,
    buildingId: number,
    buildings: Building[]
  ) => {
    setLikedBuildings((prev: LikedBuilding[]) => {
      const existing = prev.find((b: LikedBuilding) => b.id === buildingId);
      if (existing) {
        return prev.filter((b: LikedBuilding) => b.id !== buildingId);
      } else {
        const building = buildings.find((b: Building) => b.id === buildingId);
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
  }, []);

  return {
    updateURLWithFilters,
    calculatePagination,
    getPaginationRange,
    updateSearchHistory,
    updateLikedBuildings
  };
} 