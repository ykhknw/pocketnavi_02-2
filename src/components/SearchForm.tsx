import React, { useState } from 'react';
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

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
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
                className="text-sm cursor-pointer truncate flex-1"
                title={item.name}
              >
                {item.name}
              </Label>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">
              ({item.count})
            </span>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-2">
            該当する項目がありません
          </div>
        )}
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
  language
}: SearchFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleQueryChange = (query: string) => {
    onFiltersChange({ ...filters, query });
  };

  const handleRadiusChange = (radius: number) => {
    onFiltersChange({ ...filters, radius });
  };

  const handleArchitectToggle = (architect: string) => {
    const newArchitects = filters.architects?.includes(architect)
      ? filters.architects.filter(a => a !== architect)
      : [...(filters.architects || []), architect];
    onFiltersChange({ ...filters, architects: newArchitects });
  };

  const handleBuildingTypeToggle = (type: string) => {
    const newTypes = filters.buildingTypes.includes(type)
      ? filters.buildingTypes.filter(t => t !== type)
      : [...filters.buildingTypes, type];
    onFiltersChange({ ...filters, buildingTypes: newTypes });
  };

  const handlePrefectureToggle = (prefecture: string) => {
    const newPrefectures = filters.prefectures.includes(prefecture)
      ? filters.prefectures.filter(p => p !== prefecture)
      : [...filters.prefectures, prefecture];
    onFiltersChange({ ...filters, prefectures: newPrefectures });
  };

  const clearFilters = () => {
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
  };

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
            >
              <Filter className="h-4 w-4" />
              {t('detailedSearch', language)}
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