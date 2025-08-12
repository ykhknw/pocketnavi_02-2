import React from 'react';
import { Clock, TrendingUp, Search, User, MapPin, X } from 'lucide-react';
import { SearchHistory } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { t } from '../utils/translations';

interface SearchHistoryProps {
  recentSearches: SearchHistory[];
  popularSearches: SearchHistory[];
  popularSearchesLoading?: boolean;
  popularSearchesError?: string | null;
  language: 'ja' | 'en';
  onSearchClick: (query: string) => void;
  onFilterSearchClick?: (filters: Partial<SearchHistory['filters']>) => void;
  onRemoveRecentSearch?: (index: number) => void;
}

export function SearchHistoryComponent({ 
  recentSearches, 
  popularSearches, 
  popularSearchesLoading = false,
  popularSearchesError = null,
  language, 
  onSearchClick,
  onFilterSearchClick,
  onRemoveRecentSearch
}: SearchHistoryProps) {
  // undefinedチェックを追加
  const safeRecentSearches = recentSearches || [];
  const safePopularSearches = popularSearches || [];

  return (
    <div className="space-y-4">
      {/* Recent Searches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('recentSearches', language)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safeRecentSearches.length === 0 ? (
            <div className="text-center py-4">
              <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">{t('noSearchHistory', language)}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {safeRecentSearches.slice(0, 10).map((search, index) => {
                // フィルター検索の場合は特別な表示
                if (search.type === 'architect' || search.type === 'prefecture') {
                  return (
                    <div key={index} className="relative group">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onFilterSearchClick?.(search.filters)}
                        className="text-sm flex items-center gap-1 pr-5"
                      >
                        {search.type === 'architect' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <MapPin className="h-3 w-3" />
                        )}
                        {search.query}
                      </Button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRecentSearch?.(index);
                        }}
                        className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-full w-4 h-4 flex items-center justify-center transition-opacity z-10 border border-red-200"
                        title={language === 'ja' ? '削除' : 'Remove'}
                      >
                        <X className="h-2.5 w-2.5 text-red-500" />
                      </button>
                    </div>
                  );
                }
                
                // 通常のテキスト検索
                return (
                  <div key={index} className="relative group">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSearchClick(search.query)}
                      className="text-sm flex items-center gap-1 pr-5"
                    >
                      <Search className="h-3 w-3" />
                      {search.query}
                    </Button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveRecentSearch?.(index);
                      }}
                      className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-full w-4 h-4 flex items-center justify-center transition-opacity z-10 border border-red-200"
                      title={language === 'ja' ? '削除' : 'Remove'}
                    >
                      <X className="h-2.5 w-2.5 text-red-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Searches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('popularSearches', language)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {popularSearchesLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-gray-500 text-sm">人気検索を読み込み中...</p>
            </div>
          ) : popularSearchesError ? (
            <div className="text-center py-4">
              <p className="text-red-500 text-sm">{popularSearchesError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-blue-500 text-sm hover:underline"
              >
                再試行
              </button>
            </div>
          ) : safePopularSearches.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">人気検索がありません</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {safePopularSearches.slice(0, 8).map((search, index) => {
                // フィルター検索の場合は特別な表示
                if (search.type === 'architect' || search.type === 'prefecture') {
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => onFilterSearchClick?.(search.filters)}
                      className="text-sm flex items-center gap-1"
                    >
                      {search.type === 'architect' ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <MapPin className="h-3 w-3" />
                      )}
                      {search.query}
                      <Badge variant="secondary" className="ml-2">
                        {search.count}
                      </Badge>
                    </Button>
                  );
                }
                
                // 通常のテキスト検索
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onSearchClick(search.query)}
                    className="text-sm flex items-center gap-1"
                  >
                    <Search className="h-3 w-3" />
                    {search.query}
                    <Badge variant="secondary" className="ml-2">
                      {search.count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}