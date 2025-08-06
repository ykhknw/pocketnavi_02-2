import React, { memo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Building, SearchFilters } from '../../types';
import { SearchForm } from '../SearchForm';
import { BuildingCard } from '../BuildingCard';
import { BuildingDetail } from '../BuildingDetail';
import { Button } from '../ui/button';

interface MainContentProps {
  // 状態
  selectedBuilding: Building | null;
  buildingsLoading: boolean;
  buildingsError: string | null;
  currentBuildings: Building[];
  filteredBuildings: Building[];
  totalBuildings: number;
  totalPages: number;
  startIndex: number;
  currentPage: number;
  itemsPerPage: number;
  useApi: boolean;
  apiStatus: string;
  isSupabaseConnected: boolean;
  showDataMigration: boolean;
  setShowDataMigration: (show: boolean) => void;
  
  // フィルター関連
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  locationLoading: boolean;
  locationError: string | null;
  getCurrentLocation: () => void;
  
  // 言語
  language: 'ja' | 'en';
  
  // ハンドラー
  handleBuildingSelect: (building: Building | null) => void;
  handleLike: (buildingId: number) => void;
  handlePhotoLike: (photoId: number) => void;
  handleSearchAround: (lat: number, lng: number) => void;
  handlePageChange: (page: number) => void;
  handleSearchStart: () => void;
  getPaginationRange: () => (number | string)[];
}

function MainContentComponent({
  selectedBuilding,
  buildingsLoading,
  buildingsError,
  currentBuildings,
  filteredBuildings,
  totalBuildings,
  totalPages,
  startIndex,
  currentPage,
  itemsPerPage,
  useApi,
  apiStatus,
  isSupabaseConnected,
  showDataMigration,
  setShowDataMigration,
  filters,
  setFilters,
  locationLoading,
  locationError,
  getCurrentLocation,
  language,
  handleBuildingSelect,
  handleLike,
  handlePhotoLike,
  handleSearchAround,
  handlePageChange,
  handleSearchStart,
  getPaginationRange
}: MainContentProps) {
  if (buildingsError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive text-lg mb-4">
          {language === 'ja' ? 'エラーが発生しました' : 'An error occurred'}
        </p>
        <p className="text-muted-foreground">
          {buildingsError}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* 検索フォーム */}
      <SearchForm
        filters={filters}
        onFiltersChange={setFilters}
        onGetLocation={getCurrentLocation}
        locationLoading={locationLoading}
        locationError={locationError}
        language={language}
        onSearchStart={handleSearchStart}
      />

      {buildingsLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {language === 'ja' ? '読み込み中...' : 'Loading...'}
          </p>
        </div>
      )}

      {selectedBuilding ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => handleBuildingSelect(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {language === 'ja' ? '一覧に戻る' : 'Back to List'}
            </Button>
            <h2 className="text-xl font-bold">
              {language === 'ja' ? '建築物詳細' : 'Building Details'}
            </h2>
          </div>
          <BuildingDetail
            building={selectedBuilding}
            onClose={() => handleBuildingSelect(null)}
            onLike={handleLike}
            onPhotoLike={handlePhotoLike}
            language={language}
            onSearchAround={handleSearchAround}
            displayIndex={currentBuildings.findIndex(b => b.id === selectedBuilding.id) + startIndex + 1}
            isInline={true}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between w-full">
            <h2 className="text-2xl font-bold text-foreground flex-shrink-0" style={{ fontSize: '1.5rem' }}>
              {language === 'ja' ? '建築物一覧' : 'Buildings'}
            </h2>
            {(useApi ? totalBuildings : filteredBuildings.length) >= 10 && totalPages > 1 && (
              <span className="text-sm text-muted-foreground">
                {language === 'ja' 
                  ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, useApi ? totalBuildings : filteredBuildings.length)}/${useApi ? totalBuildings : filteredBuildings.length}件 (${currentPage}/${totalPages}ページ)`
                  : `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, useApi ? totalBuildings : filteredBuildings.length)}/${useApi ? totalBuildings : filteredBuildings.length} items (Page ${currentPage}/${totalPages})`
                }
              </span>
            )}
          </div>

          {currentBuildings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {language === 'ja' ? '検索条件に合う建築物が見つかりませんでした' : 'No buildings found matching your criteria'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentBuildings.map((building, index) => (
                  <BuildingCard
                    key={building.id}
                    building={building}
                    onSelect={handleBuildingSelect}
                    onLike={handleLike}
                    onPhotoLike={handlePhotoLike}
                    isSelected={false}
                    index={startIndex + index}
                    language={language}
                  />
                ))}
              </div>

              {/* Pagination */}
              {(useApi ? totalBuildings : filteredBuildings.length) >= 10 && totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8 w-full">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {language === 'ja' ? '前へ' : 'Previous'}
                  </button>
                  
                  {getPaginationRange().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                      disabled={typeof page !== 'number'}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        typeof page === 'number'
                          ? page === currentPage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          : 'text-gray-400 cursor-default'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {language === 'ja' ? '次へ' : 'Next'}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// メモ化してパフォーマンスを最適化
const arePropsEqual = (prevProps: MainContentProps, nextProps: MainContentProps): boolean => {
  return (
    prevProps.selectedBuilding?.id === nextProps.selectedBuilding?.id &&
    prevProps.buildingsLoading === nextProps.buildingsLoading &&
    prevProps.buildingsError === nextProps.buildingsError &&
    prevProps.currentBuildings.length === nextProps.currentBuildings.length &&
    prevProps.currentBuildings.every((building, index) => building.id === nextProps.currentBuildings[index]?.id) &&
    prevProps.totalBuildings === nextProps.totalBuildings &&
    prevProps.totalPages === nextProps.totalPages &&
    prevProps.startIndex === nextProps.startIndex &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.itemsPerPage === nextProps.itemsPerPage &&
    prevProps.useApi === nextProps.useApi &&
    prevProps.apiStatus === nextProps.apiStatus &&
    prevProps.isSupabaseConnected === nextProps.isSupabaseConnected &&
    prevProps.showDataMigration === nextProps.showDataMigration &&
    JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters) &&
    prevProps.locationLoading === nextProps.locationLoading &&
    prevProps.locationError === nextProps.locationError &&
    prevProps.language === nextProps.language
  );
};

export const MainContent = memo(MainContentComponent, arePropsEqual); 