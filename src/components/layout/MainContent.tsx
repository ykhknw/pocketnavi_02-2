import React from 'react';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { SearchForm } from '../SearchForm';
import { BuildingCard } from '../BuildingCard';
import { BuildingDetail } from '../BuildingDetail';
import { Building, SearchFilters } from '../../types';

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
  getPaginationRange
}: MainContentProps) {
  return (
    <div className="lg:col-span-2 space-y-6">
      {/* API状態表示（開発用） */}
      {import.meta.env.DEV && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-700 text-sm">
              データソース: {useApi ? 'Supabase API' : 'モックデータ'} | 状態: {apiStatus}
              {isSupabaseConnected && ' ✅'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDataMigration(true)}
            >
              データ移行
            </Button>
            {buildingsError && (
              <span className="text-red-600 text-sm">Error: {buildingsError}</span>
            )}
          </div>
        </div>
      )}

      <SearchForm
        filters={filters}
        onFiltersChange={setFilters}
        onGetLocation={getCurrentLocation}
        locationLoading={locationLoading}
        locationError={locationError}
        language={language}
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
                          ? currentPage === page
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
                          : 'bg-transparent border-none text-gray-400 cursor-default'
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

// Props比較関数
const arePropsEqual = (prevProps: MainContentProps, nextProps: MainContentProps): boolean => {
  return (
    prevProps.selectedBuilding?.id === nextProps.selectedBuilding?.id &&
    prevProps.buildingsLoading === nextProps.buildingsLoading &&
    prevProps.buildingsError === nextProps.buildingsError &&
    prevProps.currentBuildings.length === nextProps.currentBuildings.length &&
    prevProps.currentBuildings.every((building, index) => 
      building.id === nextProps.currentBuildings[index]?.id
    ) &&
    prevProps.filteredBuildings.length === nextProps.filteredBuildings.length &&
    prevProps.totalBuildings === nextProps.totalBuildings &&
    prevProps.totalPages === nextProps.totalPages &&
    prevProps.startIndex === nextProps.startIndex &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.itemsPerPage === nextProps.itemsPerPage &&
    prevProps.useApi === nextProps.useApi &&
    prevProps.apiStatus === nextProps.apiStatus &&
    prevProps.isSupabaseConnected === nextProps.isSupabaseConnected &&
    prevProps.showDataMigration === nextProps.showDataMigration &&
    prevProps.language === nextProps.language &&
    prevProps.locationLoading === nextProps.locationLoading &&
    prevProps.locationError === nextProps.locationError &&
    prevProps.filters.search === nextProps.filters.search &&
    prevProps.filters.category === nextProps.filters.category &&
    prevProps.filters.yearFrom === nextProps.filters.yearFrom &&
    prevProps.filters.yearTo === nextProps.filters.yearTo &&
    prevProps.filters.architect === nextProps.filters.architect &&
    prevProps.setShowDataMigration === nextProps.setShowDataMigration &&
    prevProps.setFilters === nextProps.setFilters &&
    prevProps.getCurrentLocation === nextProps.getCurrentLocation &&
    prevProps.handleBuildingSelect === nextProps.handleBuildingSelect &&
    prevProps.handleLike === nextProps.handleLike &&
    prevProps.handlePhotoLike === nextProps.handlePhotoLike &&
    prevProps.handleSearchAround === nextProps.handleSearchAround &&
    prevProps.handlePageChange === nextProps.handlePageChange &&
    prevProps.getPaginationRange === nextProps.getPaginationRange
  );
};

export const MainContent = React.memo(MainContentComponent, arePropsEqual); 