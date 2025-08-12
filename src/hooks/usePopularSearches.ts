import { useState, useEffect } from 'react';
import { SearchHistory } from '../types';
import { fetchPopularSearches } from '../services/supabase-api';

export function usePopularSearches(days: number = 7) {
  const [popularSearches, setPopularSearches] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPopularSearches = async () => {
      try {
        console.log('🔄 人気検索の取得開始');
        setLoading(true);
        setError(null);
        
        const data = await fetchPopularSearches(days);
        console.log('✅ 人気検索の取得完了:', data);
        setPopularSearches(data);
      } catch (err) {
        console.error('❌ 人気検索の取得エラー:', err);
        setError('人気検索の取得に失敗しました');
      } finally {
        console.log('🏁 人気検索の取得処理完了');
        setLoading(false);
      }
    };

    loadPopularSearches();
  }, [days]);

  const refreshPopularSearches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchPopularSearches(days);
      setPopularSearches(data);
    } catch (err) {
      setError('人気検索の更新に失敗しました');
      console.error('人気検索の更新エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    popularSearches,
    loading,
    error,
    refreshPopularSearches
  };
}
