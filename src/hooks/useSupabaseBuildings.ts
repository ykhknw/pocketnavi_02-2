import { useState, useEffect } from 'react';
import { Building, SearchFilters } from '../types';
import { supabaseApiClient, SupabaseApiError } from '../services/supabase-api';
import { mockBuildings } from '../data/mockData'; // フォールバック用
import { searchBuildings } from '../utils/search'; // クライアントサイド検索

interface UseBuildingsResult {
  buildings: Building[];
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => void;
}

interface UseBuildingByIdResult {
  building: Building | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSupabaseBuildings(
  filters: SearchFilters,
  page: number = 1,
  limit: number = 10,
  useApi: boolean = false,
  language: 'ja' | 'en' = 'ja'
): UseBuildingsResult {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchBuildings = async () => {
    if (!useApi) {
      // モックデータを使用（現状維持）
      const filtered = searchBuildings(mockBuildings, filters, language);
      const startIndex = (page - 1) * limit;
      const paginatedResults = filtered.slice(startIndex, startIndex + limit);
      
      setBuildings(paginatedResults);
      setTotal(filtered.length);
      console.log('Using mock data:', paginatedResults.length, 'buildings');
      return;
    }

    console.log('Supabase環境変数:', {
      url: import.meta.env.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      useApi
    });

    console.log('Fetching from Supabase...', { filters, page, limit, useApi });
    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (filters.query || (filters.architects && filters.architects.length > 0) || filters.buildingTypes.length > 0 || filters.prefectures.length > 0) {
        // 検索API使用
        console.log('🔍 Using search API with pagination:', { 
          page, 
          limit, 
          hasQuery: !!filters.query,
          hasArchitects: !!(filters.architects && filters.architects.length > 0),
          hasBuildingTypes: filters.buildingTypes.length > 0,
          hasPrefectures: filters.prefectures.length > 0,
          architects: filters.architects
        });
        result = await supabaseApiClient.searchBuildings(filters, page, limit);
      } else {
        // 一覧取得API使用
        console.log('📋 Using getBuildings API');
        result = await supabaseApiClient.getBuildings(page, limit);
      }

      console.log('Supabase result:', result);
      setBuildings(result.buildings);
      setTotal(result.total);
    } catch (err) {
      if (err instanceof SupabaseApiError) {
        setError(`Supabase API Error: ${err.message}`);
        console.error('Supabase API Error:', err);
        
        // フォールバック: モックデータを使用
        const filtered = searchBuildings(mockBuildings, filters, language);
        const startIndex = (page - 1) * limit;
        const paginatedResults = filtered.slice(startIndex, startIndex + limit);
        
        setBuildings(paginatedResults);
        setTotal(filtered.length);
        console.log('Fallback to mock data due to error');
      } else {
        setError('Unknown error occurred');
        console.error('Unknown error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, [filters.query, filters.architects, filters.radius, filters.buildingTypes, filters.prefectures, filters.areas, filters.hasPhotos, filters.hasVideos, filters.currentLocation, page, limit, useApi]);

  return {
    buildings,
    loading,
    error,
    total,
    refetch: fetchBuildings,
  };
}

// BuildingDetailPage用の特定の建築物IDを取得するフック
export function useBuildingById(
  buildingId: number | null,
  useApi: boolean = false
): UseBuildingByIdResult {
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBuilding = async () => {
    if (!buildingId) {
      setBuilding(null);
      return;
    }

    if (!useApi) {
      // モックデータを使用
      const foundBuilding = mockBuildings.find(b => b.id === buildingId);
      setBuilding(foundBuilding || null);
      return;
    }

    console.log('Fetching building by ID:', buildingId);
    setLoading(true);
    setError(null);

    try {
      const result = await supabaseApiClient.getBuildingById(buildingId);
      setBuilding(result);
      console.log('Building found:', result);
    } catch (err) {
      if (err instanceof SupabaseApiError) {
        setError(`Supabase API Error: ${err.message}`);
        console.error('Supabase API Error:', err);
        
        // フォールバック: モックデータを使用
        const foundBuilding = mockBuildings.find(b => b.id === buildingId);
        setBuilding(foundBuilding || null);
        console.log('Fallback to mock data due to error');
      } else {
        setError('Unknown error occurred');
        console.error('Unknown error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilding();
  }, [buildingId, useApi]);

  return {
    building,
    loading,
    error,
    refetch: fetchBuilding,
  };
}