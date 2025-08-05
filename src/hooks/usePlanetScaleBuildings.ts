import { useState, useEffect } from 'react';
import { Building, SearchFilters } from '../types';
import { planetScaleApiClient, ApiError } from '../services/planetscale-api';
import { mockBuildings } from '../data/mockData'; // フォールバック用

interface UseBuildingsResult {
  buildings: Building[];
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => void;
}

export function usePlanetScaleBuildings(
  filters: SearchFilters,
  page: number = 1,
  limit: number = 10,
  useApi: boolean = false
): UseBuildingsResult {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchBuildings = async () => {
    if (!useApi) {
      // モックデータを使用（現状維持）
      setBuildings(mockBuildings);
      setTotal(mockBuildings.length);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (filters.query || filters.buildingTypes.length > 0 || filters.prefectures.length > 0) {
        // 検索API使用
        result = await planetScaleApiClient.searchBuildings(filters);
      } else {
        // 一覧取得API使用
        result = await planetScaleApiClient.getBuildings(page, limit);
      }

      setBuildings(result.buildings);
      setTotal(result.total);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`PlanetScale API Error: ${err.message}`);
        console.error('PlanetScale API Error:', err);
        
        // フォールバック: モックデータを使用
        setBuildings(mockBuildings);
        setTotal(mockBuildings.length);
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
  }, [filters, page, limit, useApi]);

  return {
    buildings,
    loading,
    error,
    total,
    refetch: fetchBuildings,
  };
}