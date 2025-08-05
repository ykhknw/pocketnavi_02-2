import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Building, SearchFilters } from '../types';
import { supabase } from '../lib/supabase';

// 最適化されたBuildings取得フック
export function useOptimizedBuildings(
  filters: SearchFilters,
  pageSize: number = 20
) {
  // 無限スクロール対応
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['buildings', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('buildings')
        .select(`
          id,
          title,
          title_en,
          thumbnail_url,
          completion_years,
          prefectures,
          areas,
          location,
          lat,
          lng,
          likes,
          building_architects!inner(
            architects(id, name_ja, name_en)
          )
        `)
        .range(pageParam, pageParam + pageSize - 1)
        .order('id', { ascending: false });

      // フィルター適用
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,title_en.ilike.%${filters.query}%`);
      }
      
      if (filters.prefectures.length > 0) {
        query = query.in('prefectures', filters.prefectures);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    getNextPageParam: (lastPage, pages) => 
      lastPage.length === pageSize ? pages.length * pageSize : undefined,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    cacheTime: 10 * 60 * 1000, // 10分間保持
  });

  // フラット化されたbuildings配列
  const buildings = data?.pages.flat() || [];

  return {
    buildings,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    total: buildings.length
  };
}

// 軽量版：一覧表示用
export function useBuildingsList(filters: SearchFilters) {
  return useQuery({
    queryKey: ['buildings-list', filters],
    queryFn: async () => {
      let query = supabase
        .from('buildings')
        .select('id, title, title_en, lat, lng, likes, prefectures')
        .limit(100)
        .order('id', { ascending: false });

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,title_en.ilike.%${filters.query}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
  });
}

// 詳細表示用：必要時のみ取得
export function useBuildingDetail(id: number | null) {
  return useQuery({
    queryKey: ['building-detail', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('buildings')
        .select(`
          *,
          building_architects!inner(
            architects(*)
          ),
          photos(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15分間キャッシュ
  });
}