import React, { useState, useMemo, useCallback } from 'react';
import { Search, MapPin, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { SearchFilters } from '../types';
import { architectsData, prefecturesData, buildingUsageData } from '../data/searchData';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { t } from '../utils/translations';

interface SearchFormProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onGetLocation: () => void;
  locationLoading: boolean;
  locationError: string | null;
  language: 'ja' | 'en';
  onSearchStart?: () => void; // 検索開始時のコールバック
}

interface CollapsibleSectionProps {
  title: string;
  selectedCount: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, selectedCount, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto text-left hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            {selectedCount > 0 && (
              <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
                {selectedCount}
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface SearchableListProps {
  items: Array<{ id: number; name: string; count: number }>;
  selectedItems: string[];
  onToggle: (item: string) => void;
  searchPlaceholder: string;
  maxHeight?: string;
}

function SearchableList({ 
  items, 
  selectedItems, 
  onToggle, 
  searchPlaceholder,
  maxHeight = "200px" 
}: SearchableListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // フィルタリング処理をuseMemoで最適化
  const filteredItems = useMemo(() => 
    items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [items, searchQuery]
  );

  return (
    <div className="space-y-2">
      <Input
        type="text"
        placeholder={searchPlaceholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="text-sm"
      />
      <div 
        className="space-y-1 overflow-y-auto pr-2"
        style={{ maxHeight }}
      >
        {filteredItems.map(item => (
          <div key={item.id} className="flex items-center justify-between space-x-2 py-1">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <Checkbox
                id={`item-${item.id}`}
                checked={selectedItems.includes(item.name)}
                onCheckedChange={() => onToggle(item.name)}
              />
              <Label 
                htmlFor={`item-${item.id}`} 
                className="text-sm truncate cursor-pointer"
              >
                {item.name}
              </Label>
            </div>
            <span className="text-xs text-muted-foreground">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchForm({
  filters,
  onFiltersChange,
  onGetLocation,
  locationLoading,
  locationError,
  language,
  onSearchStart
}: SearchFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 選択された項目数を計算（useMemoで最適化）
  const selectedCounts = useMemo(() => ({
    architects: filters.architects?.length || 0,
    buildingTypes: filters.buildingTypes?.length || 0,
    prefectures: filters.prefectures?.length || 0,
    areas: filters.areas?.length || 0
  }), [filters.architects, filters.buildingTypes, filters.prefectures, filters.areas]);

  // ハンドラー関数をuseCallbackで最適化
  const handleQueryChange = useCallback((query: string) => {
    // 検索開始時のコールバックを呼び出し
    if (onSearchStart && query.trim() !== filters.query.trim()) {
      onSearchStart();
    }
    onFiltersChange({ ...filters, query });
  }, [filters, onFiltersChange, onSearchStart]);

  const handleRadiusChange = useCallback((radius: number) => {
    onFiltersChange({ ...filters, radius });
  }, [filters, onFiltersChange]);

  const handleArchitectToggle = useCallback((architect: string) => {
    const currentArchitects = filters.architects || [];
    const newArchitects = currentArchitects.includes(architect)
      ? currentArchitects.filter(a => a !== architect)
      : [...currentArchitects, architect];
    console.log('🏗️ Architect toggle:', { architect, newArchitects });
    
    // 検索開始時のコールバックを呼び出し
    if (onSearchStart) {
      onSearchStart();
    }
    
    onFiltersChange({ ...filters, architects: newArchitects });
  }, [filters, onFiltersChange, onSearchStart]);

  const handleBuildingTypeToggle = useCallback((type: string) => {
    const currentTypes = filters.buildingTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    console.log('🏢 Building type toggle:', { type, newTypes });
    
    // 検索開始時のコールバックを呼び出し
    if (onSearchStart) {
      onSearchStart();
    }
    
    onFiltersChange({ ...filters, buildingTypes: newTypes });
  }, [filters, onFiltersChange, onSearchStart]);

  const handlePrefectureToggle = useCallback((prefecture: string) => {
    const currentPrefectures = filters.prefectures || [];
    const newPrefectures = currentPrefectures.includes(prefecture)
      ? currentPrefectures.filter(p => p !== prefecture)
      : [...currentPrefectures, prefecture];
    
    // 検索開始時のコールバックを呼び出し
    if (onSearchStart) {
      onSearchStart();
    }
    
    onFiltersChange({ ...filters, prefectures: newPrefectures });
  }, [filters, onFiltersChange, onSearchStart]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      query: '',
      radius: 5,
      architects: [],
      buildingTypes: [],
      prefectures: [],
      areas: [],
      hasPhotos: false,
      hasVideos: false,
      currentLocation: filters.currentLocation
    });
  }, [onFiltersChange, filters.currentLocation]);

  const hasActiveFilters = 
    filters.query ||
    (filters.architects?.length || 0) > 0 ||
    filters.buildingTypes.length > 0 ||
    filters.prefectures.length > 0 ||
    filters.areas.length > 0 ||
    filters.hasPhotos ||
    filters.hasVideos;

  const architects = architectsData[language];
  const prefectures = prefecturesData[language];
  const buildingUsages = buildingUsageData[language];

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t('searchPlaceholder', language)}
                value={filters.query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={onGetLocation}
              disabled={locationLoading}
            >
              <MapPin className="h-4 w-4" />
              {locationLoading ? t('loading', language) : t('currentLocation', language)}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="relative"
            >
              <Filter className="h-4 w-4" />
              {t('detailedSearch', language)}
              {hasActiveFilters && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {Object.values(selectedCounts).reduce((sum, count) => sum + count, 0)}
                </span>
              )}
            </Button>
          </div>
        </div>

        {locationError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {locationError}
          </div>
        )}

        {filters.currentLocation && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-green-700 text-sm">{t('searchingFromLocation', language)}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('radius', language)}:</span>
                <select
                  value={filters.radius}
                  onChange={(e) => handleRadiusChange(Number(e.target.value))}
                  className="px-2 py-1 border border-input rounded text-sm bg-background"
                >
                  <option value={5}>5km</option>
                  <option value={10}>10km</option>
                  <option value={20}>20km</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {showAdvanced && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{t('detailedSearch', language)}</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4" />
                  {t('clearFilters', language)}
                </Button>
              )}
            </div>

            {/* 選択状態のサマリー表示 */}
            {hasActiveFilters && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">{language === 'ja' ? '選択中の項目:' : 'Selected items:'}</h4>
                <div className="space-y-1 text-sm">
                  {filters.architects && filters.architects.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{language === 'ja' ? '建築家:' : 'Architects:'}</span>
                      <div className="flex flex-wrap gap-1">
                        {filters.architects.map(arch => (
                          <span key={arch} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                            {arch}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {filters.buildingTypes && filters.buildingTypes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{language === 'ja' ? '建物用途:' : 'Building types:'}</span>
                      <div className="flex flex-wrap gap-1">
                        {filters.buildingTypes.map(type => (
                          <span key={type} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {filters.prefectures && filters.prefectures.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{language === 'ja' ? '都道府県:' : 'Prefectures:'}</span>
                      <div className="flex flex-wrap gap-1">
                        {filters.prefectures.map(pref => (
                          <span key={pref} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                            {pref}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(filters.hasPhotos || filters.hasVideos) && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{language === 'ja' ? 'メディア:' : 'Media:'}</span>
                      <div className="flex flex-wrap gap-1">
                        {filters.hasPhotos && (
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                            {t('withPhotos', language)}
                          </span>
                        )}
                        {filters.hasVideos && (
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                            {t('withVideos', language)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 border rounded-lg">
              <CollapsibleSection
                title={language === 'ja' ? '建築家' : 'Architects'}
                selectedCount={filters.architects?.length || 0}
              >
                <SearchableList
                  items={architects}
                  selectedItems={filters.architects || []}
                  onToggle={handleArchitectToggle}
                  searchPlaceholder={language === 'ja' ? '建築家名で検索...' : 'Search architects...'}
                  maxHeight="250px"
                />
              </CollapsibleSection>

              <div className="border-t" />

              <CollapsibleSection
                title={language === 'ja' ? '都道府県' : 'Prefectures'}
                selectedCount={filters.prefectures.length}
              >
                <SearchableList
                  items={prefectures}
                  selectedItems={filters.prefectures}
                  onToggle={handlePrefectureToggle}
                  searchPlaceholder={language === 'ja' ? '都道府県名で検索...' : 'Search prefectures...'}
                  maxHeight="250px"
                />
              </CollapsibleSection>

              <div className="border-t" />

              <CollapsibleSection
                title={language === 'ja' ? '建物用途' : 'Building Usage'}
                selectedCount={filters.buildingTypes.length}
              >
                <SearchableList
                  items={buildingUsages}
                  selectedItems={filters.buildingTypes}
                  onToggle={handleBuildingTypeToggle}
                  searchPlaceholder={language === 'ja' ? '建物用途で検索...' : 'Search building usage...'}
                  maxHeight="250px"
                />
              </CollapsibleSection>

              <div className="border-t" />

              <CollapsibleSection
                title={language === 'ja' ? 'メディア' : 'Media'}
                selectedCount={(filters.hasPhotos ? 1 : 0) + (filters.hasVideos ? 1 : 0)}
              >
                <div className="space-y-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-photos"
                      checked={filters.hasPhotos}
                      onCheckedChange={(checked) => onFiltersChange({ ...filters, hasPhotos: !!checked })}
                    />
                    <Label htmlFor="has-photos" className="text-sm">{t('withPhotos', language)}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-videos"
                      checked={filters.hasVideos}
                      onCheckedChange={(checked) => onFiltersChange({ ...filters, hasVideos: !!checked })}
                    />
                    <Label htmlFor="has-videos" className="text-sm">{t('withVideos', language)}</Label>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}