import { useState, useCallback, useRef } from 'react';
import { useSupabaseBuildings } from './useSupabaseBuildings';
import { useSupabaseToggle } from './useSupabaseToggle';
import { useGeolocation } from './useGeolocation';
import { useLanguage } from './useLanguage';
import { SearchFilters, Building } from '../types';
import { searchBuildings } from '../utils/search';

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
    isUpdatingFromURL: boolean
  ) => {
    // useEffectをuseCallback内で呼び出すのはHooks違反なので、直接関数として実装
    const syncURLToState = () => {
      if (isUpdatingFromURL) return;
      
      const query = searchParams.get('q') || '';
      const architects = searchParams.get('architects')?.split(',') || [];
      const buildingTypes = searchParams.get('buildingTypes')?.split(',') || [];
      const prefectures = searchParams.get('prefectures')?.split(',') || [];
      const areas = searchParams.get('areas')?.split(',') || [];
      const hasPhotos = searchParams.get('hasPhotos') === 'true';
      const hasVideos = searchParams.get('hasVideos') === 'true';
      const radius = parseInt(searchParams.get('radius') || '5', 10);
      const page = parseInt(searchParams.get('page') || '1', 10);
      
       setFilters({
        query,
        architects,
        buildingTypes,
        prefectures,
        areas,
        hasPhotos,
        hasVideos,
        radius,
         currentLocation: null,
         completionYear: searchParams.get('year') ? Number(searchParams.get('year')) : undefined
      });
      
      setCurrentPage(page);
    };
    
    return syncURLToState;
  }, []);

  // URL更新効果
  const useURLUpdateEffect = useCallback((
    filters: SearchFilters,
    currentPage: number,
    updateURLWithFilters: (filters: SearchFilters, currentPage: number) => void,
    isUpdatingFromURL: boolean
  ) => {
    // useEffectをuseCallback内で呼び出すのはHooks違反なので、直接関数として実装
    const updateURL = () => {
      if (isUpdatingFromURL) return;
      
      // デバウンス処理でURL更新を最適化
      const timeoutId = setTimeout(() => {
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

  // フィルター変更効果（最適化版）
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
      
      // 検索履歴を更新
      if (filters.query && filters.query.trim()) {
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
          (setSearchHistory as any)((prev: any[]) => [
            { query: filters.query, searchedAt: new Date().toISOString(), count: 1 },
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
    useURLUpdateEffect,
    useGeolocationEffect,
    useFilterChangeEffect
  };
} 