import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseApiClient } from '../services/supabase-api';
import { Building, SearchFilters } from '../types';
import { mockBuildings } from '../data/mockData';

export function useSupabaseBuildings(
  filters: SearchFilters,
  currentPage: number,
  itemsPerPage: number,
  useApi: boolean,
  language: 'ja' | 'en' = 'ja'
) {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  const queryClient = useQueryClient();

  // React Queryを使用したキャッシュ機能（ページ番号を確実に含める）
  const queryKey = [
    'buildings',
    filters,
    currentPage,
    itemsPerPage,
    useApi,
    language
  ];

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('🔍 React Query fetching:', { 
        useApi, 
        currentPage, 
        itemsPerPage,
        queryKey: JSON.stringify(queryKey)
      });
      
      if (!useApi) {
        // モックデータ使用時
        console.log('📦 Using mock data');
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = currentPage * itemsPerPage;
        return {
          buildings: mockBuildings.slice(startIndex, endIndex),
          total: mockBuildings.length
        };
      }

      try {
        // Supabase API使用時
        console.log('📡 Using Supabase API');
        const result = await supabaseApiClient.searchBuildings(filters, currentPage, itemsPerPage);
        console.log('📊 API result:', { 
          buildingsCount: result.buildings.length, 
          total: result.total,
          currentPage 
        });
        return result;
      } catch (err) {
        console.error('API Error:', err);
        throw err;
      }
    },
    staleTime: 0, // キャッシュを無効化して常に新しいデータを取得
    gcTime: 0, // キャッシュを完全に無効化
    retry: 1, // リトライ回数を1回に制限
    refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効化
    enabled: true, // 常に有効
  });

  // データの更新
  useEffect(() => {
    if (data) {
      setBuildings(data.buildings);
      setTotal(data.total);
      setLoading(false);
      setError(null);
    }
  }, [data]);

  // エラーの処理
  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
    }
  }, [queryError]);

  // ローディング状態の更新
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // 手動リフェッチ機能
  const refetchData = useCallback(async () => {
    console.log('🔄 Manual refetch triggered');
    try {
      setLoading(true);
      setError(null);
      await refetch();
    } catch (err) {
      console.error('Refetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [refetch]);

  // ページ変更時のキャッシュ無効化
  const invalidatePageCache = useCallback(() => {
    console.log('🗑️ Invalidating page cache');
    queryClient.invalidateQueries({ 
      queryKey: ['buildings'],
      exact: false 
    });
  }, [queryClient]);

  // ページ変更時の強制リフェッチ
  const forceRefetch = useCallback(() => {
    console.log('🔄 Force refetch triggered');
    queryClient.removeQueries({ queryKey: ['buildings'], exact: false });
    refetch();
  }, [queryClient, refetch]);

  // キャッシュの無効化
  const invalidateCache = useCallback(() => {
    console.log('🗑️ Invalidating cache');
    queryClient.invalidateQueries({ queryKey: ['buildings'] });
  }, [queryClient]);

  // プリフェッチ機能（次のページを事前に読み込み）
  const prefetchNextPage = useCallback(() => {
    if (currentPage * itemsPerPage < total) {
      const nextPage = currentPage + 1;
      const nextQueryKey = [
        'buildings',
        filters,
        nextPage,
        itemsPerPage,
        useApi,
        language
      ];
      
      queryClient.prefetchQuery({
        queryKey: nextQueryKey,
        queryFn: async () => {
          if (!useApi) {
                      return {
            buildings: mockBuildings.slice((nextPage - 1) * itemsPerPage, nextPage * itemsPerPage),
            total: mockBuildings.length
          };
          }
          return await supabaseApiClient.searchBuildings(filters, nextPage, itemsPerPage);
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      });
    }
  }, [queryClient, filters, currentPage, itemsPerPage, total, useApi, language]);

  return {
    buildings,
    buildingsLoading: loading,
    buildingsError: error,
    totalBuildings: total,
    refetch: refetchData,
    invalidateCache,
    prefetchNextPage
  };
}

// BuildingDetailPage用の特定の建築物IDを取得するフック
export function useBuildingById(
  buildingId: number | null,
  useApi: boolean = false
) {
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`API Error: ${errorMessage}`);
      console.error('API Error:', err);
      
      // フォールバック: モックデータを使用
      const foundBuilding = mockBuildings.find((b: any) => b.id === buildingId);
      setBuilding(foundBuilding || null);
      console.log('Fallback to mock data due to error');
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