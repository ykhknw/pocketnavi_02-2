import { useState, useCallback, useRef } from 'react';
import { useSupabaseBuildings } from './useSupabaseBuildings';
import { useSupabaseToggle } from './useSupabaseToggle';
import { useGeolocation } from './useGeolocation';
import { useLanguage } from './useLanguage';
import { SearchFilters, Building } from '../types';
import { searchBuildings } from '../utils/search';
import { useOptimizedSearch } from './useOptimizedSearch';

export function useAppEffects() {
  // Supabase接続状態
  const { useApi, apiStatus, isSupabaseConnected } = useSupabaseToggle();
  
  // 位置情報
  const { location: geoLocation, getCurrentLocation, loading: locationLoading, error: locationError } = useGeolocation();
  
  // 言語設定
  const { language, toggleLanguage } = useLanguage();
  
  // フィルタリングされた建物リスト
  const [filteredBuildings, setFilteredBuildings] = useState<Building[]>([]);
  
  // デバウンス時間を500msに延長
  const DEBOUNCE_DELAY = 500;
  
  // 検索のデバウンス処理
  const debouncedSearch = useRef(
    debounce((buildings: Building[], filters: SearchFilters, language: 'ja' | 'en') => {
      console.log('🔍 デバウンス検索実行:', { 
        buildingsCount: buildings.length, 
        filters, 
        language
      });
      
      const results = searchBuildings(buildings, filters, language);
      setFilteredBuildings(results);
    }, DEBOUNCE_DELAY)
  ).current;

  // デバウンス関数
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  // Supabase建物データ取得効果
  const useSupabaseBuildingsEffect = useCallback((
    filters: SearchFilters,
    currentPage: number,
    itemsPerPage: number,
    useApi: boolean,
    language: 'ja' | 'en'
  ) => {
    return useSupabaseBuildings(filters, currentPage, itemsPerPage, useApi, language);
  }, []);

  // URL同期効果
  const useURLSyncEffect = useCallback((
    _location: any,
    searchParams: URLSearchParams,
    setFilters: (filters: SearchFilters) => void,
    setCurrentPage: (page: number) => void,
    isUpdatingFromURL: React.MutableRefObject<boolean>
  ) => {
    // useEffectをuseCallback内で呼び出すのはHooks違反なので、直接関数として実装
    const syncURLToState = () => {
      console.log('🔍 URL同期開始:', { 
        searchParams: searchParams.toString(),
        isUpdatingFromURL: isUpdatingFromURL.current 
      });
      
      if (isUpdatingFromURL.current) {
        console.log('🔍 URL更新中 - 同期をスキップ');
        return;
      }
      
      // URL同期中フラグを設定
      isUpdatingFromURL.current = true;
      console.log('🔍 URL同期中フラグ設定: true');
      
      try {
        const query = searchParams.get('q') || '';
        const architects = searchParams.get('architects')?.split(',') || [];
        const buildingTypes = searchParams.get('buildingTypes')?.split(',') || [];
        const prefectures = searchParams.get('prefectures')?.split(',') || [];
        const areas = searchParams.get('areas')?.split(',') || [];
        const hasPhotos = searchParams.get('hasPhotos') === 'true';
        const hasVideos = searchParams.get('hasVideos') === 'true';
        const radius = parseInt(searchParams.get('radius') || '5', 10);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const latStr = searchParams.get('lat');
        const lngStr = searchParams.get('lng');
        const lat = latStr !== null ? parseFloat(latStr) : null;
        const lng = lngStr !== null ? parseFloat(lngStr) : null;
        
        const completionYearParam = searchParams.get('year');
        const completionYear = completionYearParam ? (() => {
          const parsed = Number(completionYearParam);
          return !Number.isNaN(parsed) ? parsed : undefined;
        })() : undefined;
        
        console.log('🔍 URLから読み込んだ値:', {
          query,
          architects,
          buildingTypes,
          prefectures,
          areas,
          hasPhotos,
          hasVideos,
          radius,
          lat,
          lng,
          completionYear,
          page
        });
        
        setFilters({
          query,
          architects,
          buildingTypes,
          prefectures,
          areas,
          hasPhotos,
          hasVideos,
          radius,
          currentLocation: lat !== null && !Number.isNaN(lat) && lng !== null && !Number.isNaN(lng)
            ? { lat, lng }
            : null,
          completionYear
        });
        
        setCurrentPage(page);
        
        console.log('🔍 URL同期完了');
        
      } finally {
        // 少し遅延を入れてからフラグをリセット（useEffectの実行順序を考慮）
        setTimeout(() => {
          isUpdatingFromURL.current = false;
          console.log('🔍 URL同期中フラグリセット: false');
        }, 100);
      }
    };
    
    return syncURLToState;
  }, []);

  // URL更新効果
  const useURLUpdateEffect = useCallback((
    filters: SearchFilters,
    currentPage: number,
    updateURLWithFilters: (filters: SearchFilters, currentPage: number) => void,
    isUpdatingFromURL: React.MutableRefObject<boolean>
  ) => {
    // useEffectをuseCallback内で呼び出すのはHooks違反なので、直接関数として実装
    const updateURL = () => {
      console.log('🔍 URL更新効果実行:', { 
        filters,
        currentPage,
        isUpdatingFromURL: isUpdatingFromURL.current 
      });
      
      if (isUpdatingFromURL.current) {
        console.log('🔍 URL同期中 - 更新をスキップ');
        return;
      }
      
      // デバウンス処理でURL更新を最適化
      const timeoutId = setTimeout(() => {
        console.log('🔍 URL更新実行（デバウンス後）');
        updateURLWithFilters(filters, currentPage);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    };
    
    return updateURL;
  }, []);

        // 位置情報効果
  const useGeolocationEffect = useCallback((
        geoLocation: { lat: number; lng: number } | null,
        setFilters: (filters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => void
      ) => {
        // useEffectをuseCallback内で呼び出すのはHooks違反なので、直接関数として実装
        const updateLocation = () => {
          if (geoLocation) {
            setFilters((prev: SearchFilters) => ({
              ...prev,
              currentLocation: geoLocation
            }));
          }
        };
        
        return updateLocation;
      }, []);

  // フィルター変更効果（段階的検索対応版）
  const useFilterChangeEffect = useCallback((
    useApi: boolean,
    buildings: Building[],
    filters: SearchFilters,
    setFilteredBuildings: (buildings: Building[]) => void,
    _setCurrentPage: (page: number) => void,
    searchHistory: any[],
    setSearchHistory: (history: any[]) => void,
    prevFiltersRef: React.MutableRefObject<SearchFilters | null>,
    language: 'ja' | 'en'
  ) => {
    // useEffectをuseCallback内で呼び出すのはHooks違反なので、直接関数として実装
    const handleFilterChange = () => {
      // フィルターが変更された場合のみ実行
      const prevFilters = prevFiltersRef.current;
      if (JSON.stringify(prevFilters) === JSON.stringify(filters)) {
        return;
      }
      
      console.log('🔄 フィルター変更検出:', { 
        prevFilters, 
        currentFilters: filters,
        buildingsCount: buildings.length 
      });
      
      // 建築年フィルターの詳細ログ
      console.log('🔍 フィルター変更時の建築年詳細:', {
        completionYear: filters.completionYear,
        completionYearType: typeof filters.completionYear,
        isNumber: typeof filters.completionYear === 'number',
        isNaN: typeof filters.completionYear === 'number' ? isNaN(filters.completionYear) : 'N/A'
      });
      
      // テキスト検索のみを履歴に更新（フィルター検索は別途記録）
      if (filters.query && filters.query.trim()) {
        const existingIndex = searchHistory.findIndex(h => h.query === filters.query && h.type === 'text');
        if (existingIndex >= 0) {
          const updated = [...searchHistory];
          updated[existingIndex] = {
            ...updated[existingIndex],
            searchedAt: new Date().toISOString(),
            count: updated[existingIndex].count + 1
          };
          setSearchHistory(updated);
        } else {
          (setSearchHistory as any)((prev: any[]) => [
            { 
              query: filters.query, 
              searchedAt: new Date().toISOString(), 
              count: 1,
              type: 'text'
            },
            ...prev.slice(0, 19)
          ]);
        }
      }
      
      // API使用時はサーバーサイドフィルタリング
      if (useApi) {
        console.log('📡 API使用時のフィルタリング');
        setFilteredBuildings(buildings);
        return;
      }
      
      // クライアントサイドフィルタリング（デバウンス処理）
      debouncedSearch(buildings, filters, language);
      
      // 前のフィルターを更新
      prevFiltersRef.current = { ...filters };
    };
    
    return handleFilterChange;
  }, []);

  return {
    useApi,
    apiStatus,
    isSupabaseConnected,
    geoLocation,
    getCurrentLocation,
    locationLoading,
    locationError,
    language,
    toggleLanguage,
    filteredBuildings,
    setFilteredBuildings,
    useSupabaseBuildingsEffect,
    useURLSyncEffect,
    useURLUpdateEffect: useCallback((
      filters: SearchFilters,
      currentPage: number,
      updateURLWithFilters: (filters: SearchFilters, currentPage: number) => void,
      isUpdatingFromURL: boolean
    ) => {
      const updateURL = () => {
        if (isUpdatingFromURL) return;
        updateURLWithFilters(filters, currentPage);
      };
      return updateURL;
    }, []),
    useGeolocationEffect,
    useFilterChangeEffect
  };
} 