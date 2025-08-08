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
      if (!useApi) {
        // モックデータ使用時は全件返す
        return {
          buildings: mockBuildings,
          total: mockBuildings.length
        };
      }

      try {
        // Supabase API使用時

        const result = await supabaseApiClient.searchBuildings(filters, currentPage, itemsPerPage);
        
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
    enabled: true,
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
    try {
      setLoading(true);
      setError(null);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [refetch]);

  // ページ変更時のキャッシュ無効化
  const invalidatePageCache = useCallback(() => {
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
            // モックデータ時も全件返す（クライアント側でページング）
            return {
              buildings: mockBuildings,
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


    setLoading(true);
    setError(null);

    try {
      const result = await supabaseApiClient.getBuildingById(buildingId);
      setBuilding(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`API Error: ${errorMessage}`);
      // フォールバック: モックデータを使用
      const foundBuilding = mockBuildings.find((b: any) => b.id === buildingId);
      setBuilding(foundBuilding || null);
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

// Building を slug で取得するフック（mock優先、API時は後方互換でID検索にフォールバック）
export function useBuildingBySlug(
  slug: string | null,
  useApi: boolean = false
) {
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBuilding = async () => {
    if (!slug) {
      setBuilding(null);
      return;
    }

    // モックデータ: slug一致で検索（数値slugの場合はidでもフォールバック）
    if (!useApi) {
      const foundBySlug = mockBuildings.find((b: any) => b.slug === slug);
      if (foundBySlug) {
        setBuilding(foundBySlug);
        setLoading(false);
        return;
      }
      const numericId = parseInt(slug, 10);
      const foundById = Number.isNaN(numericId) ? null : mockBuildings.find(b => b.id === numericId);
      setBuilding(foundById || null);
      setLoading(false);
      return;
    }

    // API使用時: slug検索を優先、ID検索にフォールバック
    setLoading(true);
    setError(null);
    try {
      // まずslugで検索を試行
      const result = await supabaseApiClient.getBuildingBySlug(slug);
      setBuilding(result);
    } catch (err) {
      // slug検索が失敗した場合、ID検索にフォールバック
      const numericId = parseInt(slug, 10);
      if (!Number.isNaN(numericId)) {
        try {
          const result = await supabaseApiClient.getBuildingById(numericId);
          setBuilding(result);
        } catch (fallbackErr) {
          const errorMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error';
          setError(`API Error: ${errorMessage}`);
          setBuilding(null);
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`API Error: ${errorMessage}`);
        setBuilding(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, useApi]);

  return { building, loading, error, refetch: fetchBuilding };
}