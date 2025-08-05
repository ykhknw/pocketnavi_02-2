import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, SearchFilters, SearchHistory } from '../types';
import { searchBuildings } from '../utils/search';
import { useGeolocation } from './useGeolocation';
import { useLanguage } from './useLanguage';
import { useSupabaseBuildings } from './useSupabaseBuildings';
import { useSupabaseToggle } from './useSupabaseToggle';

export function useAppEffects() {
  const navigate = useNavigate();
  
  // フックの使用
  const { location: geoLocation, error: locationError, loading: locationLoading, getCurrentLocation } = useGeolocation();
  const { language, toggleLanguage } = useLanguage();
  const { useApi, apiStatus, isApiAvailable, isSupabaseConnected } = useSupabaseToggle();
  
  // 検索結果のフィルタリング（モックデータ使用時）
  const [filteredBuildings, setFilteredBuildings] = useState<Building[]>([]);

  // URLが変更されたときに状態を更新する効果
  const useURLSyncEffect = (
    location: { search: string },
    searchParams: URLSearchParams,
    setFilters: (filters: SearchFilters) => void,
    setCurrentPage: (page: number) => void,
    isUpdatingFromURL: React.MutableRefObject<boolean>
  ) => {
    useEffect(() => {
      isUpdatingFromURL.current = true;
      const { filters: urlFilters, currentPage: urlPage } = parseFiltersFromURL(searchParams);
      setFilters(urlFilters);
      setCurrentPage(urlPage);
    }, [location.search]);
  };

  // フィルターまたはページが変更されたときにURLを更新する効果
  const useURLUpdateEffect = (
    filters: SearchFilters,
    currentPage: number,
    updateURLWithFilters: (filters: SearchFilters, currentPage: number) => void,
    isUpdatingFromURL: React.MutableRefObject<boolean>
  ) => {
    useEffect(() => {
      if (isUpdatingFromURL.current) {
        isUpdatingFromURL.current = false;
        return;
      }
      updateURLWithFilters(filters, currentPage);
    }, [filters, currentPage, updateURLWithFilters]);
  };

  // 位置情報の更新効果
  const useGeolocationEffect = (
    geoLocation: { lat: number; lng: number } | null,
    setFilters: (filters: SearchFilters) => void
  ) => {
    useEffect(() => {
      if (geoLocation) {
        setFilters(prev => ({ ...prev, currentLocation: geoLocation }));
      }
    }, [geoLocation]);
  };

  // フィルター変更時の効果
  const useFilterChangeEffect = (
    useApi: boolean,
    buildings: Building[],
    filters: SearchFilters,
    setFilteredBuildings: (buildings: Building[]) => void,
    setCurrentPage: (page: number) => void,
    searchHistory: SearchHistory[],
    setSearchHistory: (history: SearchHistory[]) => void,
    prevFiltersRef: React.MutableRefObject<SearchFilters>
  ) => {
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
  };

  // Supabase建物データの取得効果
  const useSupabaseBuildingsEffect = (
    filters: SearchFilters,
    currentPage: number,
    itemsPerPage: number,
    useApi: boolean
  ) => {
    const { 
      buildings, 
      loading: buildingsLoading, 
      error: buildingsError, 
      total: totalBuildings,
      refetch 
    } = useSupabaseBuildings(filters, currentPage, itemsPerPage, useApi);

    return {
      buildings,
      buildingsLoading,
      buildingsError,
      totalBuildings,
      refetch
    };
  };

  return {
    // フック状態
    geoLocation,
    locationError,
    locationLoading,
    getCurrentLocation,
    language,
    toggleLanguage,
    useApi,
    apiStatus,
    isApiAvailable,
    isSupabaseConnected,
    filteredBuildings,
    setFilteredBuildings,
    
    // 効果関数
    useURLSyncEffect,
    useURLUpdateEffect,
    useGeolocationEffect,
    useFilterChangeEffect,
    useSupabaseBuildingsEffect
  };
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