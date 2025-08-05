import React from 'react';
import { Clock, TrendingUp, Search } from 'lucide-react';
import { SearchHistory } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { t } from '../utils/translations';

interface SearchHistoryProps {
  recentSearches: SearchHistory[];
  popularSearches: SearchHistory[];
  language: 'ja' | 'en';
  onSearchClick: (query: string) => void;
}

export function SearchHistoryComponent({ 
  recentSearches, 
  popularSearches, 
  language, 
  onSearchClick 
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
              {safeRecentSearches.slice(0, 10).map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onSearchClick(search.query)}
                  className="text-sm"
                >
                  {search.query}
                </Button>
              ))}
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
          <div className="flex flex-wrap gap-2">
            {safePopularSearches.slice(0, 8).map((search, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onSearchClick(search.query)}
                className="text-sm"
              >
                {search.query}
                <Badge variant="secondary" className="ml-2">
                  {search.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}