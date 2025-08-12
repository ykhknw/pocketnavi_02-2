import React from 'react';
import Map from '../Map';
import { LikedBuildings } from '../LikedBuildings';
import { SearchHistoryComponent } from '../SearchHistory';
import { Building, SearchHistory, LikedBuilding } from '../../types';

interface SidebarProps {
  buildings: Building[];
  selectedBuilding: Building | null;
  onBuildingSelect: (building: Building) => void;
  currentLocation: { lat: number; lng: number } | null;
  language: 'ja' | 'en';
  startIndex: number;
  onSearchAround: (lat: number, lng: number) => void;
  likedBuildings: LikedBuilding[];
  onLikedBuildingClick: (buildingId: number) => void;
  onRemoveLikedBuilding?: (buildingId: number) => void;
  recentSearches: SearchHistory[];
  popularSearches: SearchHistory[];
  popularSearchesLoading?: boolean;
  popularSearchesError?: string | null;
  onSearchClick: (query: string) => void;
  onFilterSearchClick?: (filters: Partial<SearchHistory['filters']>) => void;
  onRemoveRecentSearch?: (index: number) => void;
}

function SidebarComponent({
  buildings,
  selectedBuilding,
  onBuildingSelect,
  currentLocation,
  language,
  startIndex,
  onSearchAround,
  likedBuildings,
  onLikedBuildingClick,
  onRemoveLikedBuilding,
  recentSearches,
  popularSearches,
  popularSearchesLoading = false,
  popularSearchesError = null,
  onSearchClick,
  onFilterSearchClick,
  onRemoveRecentSearch
}: SidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-6 lg:pl-4 pt-6">
      <Map
        buildings={buildings}
        selectedBuilding={selectedBuilding}
        onBuildingSelect={onBuildingSelect}
        currentLocation={currentLocation}
        language={language}
        startIndex={startIndex}
        onSearchAround={onSearchAround}
      />
      
      <LikedBuildings
        likedBuildings={likedBuildings}
        language={language}
        onBuildingClick={onLikedBuildingClick}
        onRemoveBuilding={onRemoveLikedBuilding}
      />
      
      <SearchHistoryComponent
        recentSearches={recentSearches}
        popularSearches={popularSearches}
        popularSearchesLoading={popularSearchesLoading}
        popularSearchesError={popularSearchesError}
        language={language}
        onSearchClick={onSearchClick}
        onFilterSearchClick={onFilterSearchClick}
        onRemoveRecentSearch={onRemoveRecentSearch}
      />
    </div>
  );
}

// Props比較関数
const arePropsEqual = (prevProps: SidebarProps, nextProps: SidebarProps): boolean => {
  return (
    (prevProps.buildings?.length ?? 0) === (nextProps.buildings?.length ?? 0) &&
    (prevProps.buildings?.every((building, index) => 
      building.id === nextProps.buildings?.[index]?.id
    ) ?? true) &&
    prevProps.selectedBuilding?.id === nextProps.selectedBuilding?.id &&
    prevProps.currentLocation?.lat === nextProps.currentLocation?.lat &&
    prevProps.currentLocation?.lng === nextProps.currentLocation?.lng &&
    prevProps.language === nextProps.language &&
    prevProps.startIndex === nextProps.startIndex &&
    (prevProps.likedBuildings?.length ?? 0) === (nextProps.likedBuildings?.length ?? 0) &&
    (prevProps.recentSearches?.length ?? 0) === (nextProps.recentSearches?.length ?? 0) &&
    (prevProps.popularSearches?.length ?? 0) === (nextProps.popularSearches?.length ?? 0) &&
    prevProps.onBuildingSelect === nextProps.onBuildingSelect &&
    prevProps.onSearchAround === nextProps.onSearchAround &&
    prevProps.onLikedBuildingClick === nextProps.onLikedBuildingClick &&
    prevProps.onRemoveLikedBuilding === nextProps.onRemoveLikedBuilding &&
    prevProps.onSearchClick === nextProps.onSearchClick
  );
};

export const Sidebar = React.memo(SidebarComponent, arePropsEqual); 