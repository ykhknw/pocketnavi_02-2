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
  recentSearches: SearchHistory[];
  popularSearches: SearchHistory[];
  onSearchClick: (query: string) => void;
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
  recentSearches,
  popularSearches,
  onSearchClick
}: SidebarProps) {
  return (
    <div className="lg:col-span-1 space-y-6 lg:pl-4">
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
      />
      
      <SearchHistoryComponent
        recentSearches={recentSearches}
        popularSearches={popularSearches}
        language={language}
        onSearchClick={onSearchClick}
      />
    </div>
  );
}

// Props比較関数
const arePropsEqual = (prevProps: SidebarProps, nextProps: SidebarProps): boolean => {
  return (
    prevProps.buildings.length === nextProps.buildings.length &&
    prevProps.buildings.every((building, index) => 
      building.id === nextProps.buildings[index]?.id
    ) &&
    prevProps.selectedBuilding?.id === nextProps.selectedBuilding?.id &&
    prevProps.currentLocation?.lat === nextProps.currentLocation?.lat &&
    prevProps.currentLocation?.lng === nextProps.currentLocation?.lng &&
    prevProps.language === nextProps.language &&
    prevProps.startIndex === nextProps.startIndex &&
    prevProps.likedBuildings.length === nextProps.likedBuildings.length &&
    prevProps.recentSearches.length === nextProps.recentSearches.length &&
    prevProps.popularSearches.length === nextProps.popularSearches.length &&
    prevProps.onBuildingSelect === nextProps.onBuildingSelect &&
    prevProps.onSearchAround === nextProps.onSearchAround &&
    prevProps.onLikedBuildingClick === nextProps.onLikedBuildingClick &&
    prevProps.onSearchClick === nextProps.onSearchClick
  );
};

export const Sidebar = React.memo(SidebarComponent, arePropsEqual); 