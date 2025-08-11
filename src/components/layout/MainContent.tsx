import React, { memo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  showAdvancedSearch: boolean;
  setShowAdvancedSearch: (show: boolean) => void;
  
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
  showAdvancedSearch,
  setShowAdvancedSearch,
  language,
  handleBuildingSelect,
  handleLike,
  handlePhotoLike,
  handleSearchAround,
  handlePageChange,
  handleSearchStart,
  getPaginationRange
}: MainContentProps) {
  const navigate = useNavigate();
  
  // すべてのuseCallbackを条件分岐の外に移動
  const handlePreviousPage = useCallback(() => handlePageChange(currentPage - 1), [handlePageChange, currentPage]);
  const handleNextPage = useCallback(() => handlePageChange(currentPage + 1), [handlePageChange, currentPage]);
  
  const handlePageClick = useCallback((page: number | string) => {
    if (typeof page === 'number') {
      handlePageChange(page);
    }
  }, [handlePageChange]);

  // キーボードショートカットの実装
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // フォーム入力中はキーボードショートカットを無効化
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Ctrl/Cmd + キーの組み合わせ
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            if (currentPage > 1) {
              const newPage = Math.max(1, currentPage - 5);
              handlePageChange(newPage);
            }
            break;
          case 'ArrowRight':
            event.preventDefault();
            if (currentPage < totalPages) {
              const newPage = Math.min(totalPages, currentPage + 5);
              handlePageChange(newPage);
            }
            break;
        }
        return;
      }

      // 単独のキー
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          if (currentPage > 1) {
            handlePreviousPage();
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (currentPage < totalPages) {
            handleNextPage();
          }
          break;
      }
    };

    // キーボードイベントリスナーを追加
    document.addEventListener('keydown', handleKeyDown);

    // クリーンアップ
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages, handlePageChange, handlePreviousPage, handleNextPage]);

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
        showAdvancedSearch={showAdvancedSearch}
        setShowAdvancedSearch={setShowAdvancedSearch}
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
            onLike={handleLike}
            onPhotoLike={handlePhotoLike}
            language={language}
            displayIndex={currentBuildings.findIndex(b => b.id === selectedBuilding.id) + startIndex + 1}
            navigate={navigate}
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
                <div className="flex flex-col items-center space-y-4 mt-8 w-full">
                  {/* ページ情報の表示改善 */}
                  <div className="text-sm text-muted-foreground bg-gray-50 px-4 py-2 rounded-lg">
                    {language === 'ja' 
                      ? `ページ ${currentPage} / ${totalPages} (全${useApi ? totalBuildings : filteredBuildings.length}件)`
                      : `Page ${currentPage} of ${totalPages} (${useApi ? totalBuildings : filteredBuildings.length} total items)`
                    }
                  </div>
                  
                  {/* キーボードショートカットの説明 */}
                  <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg max-w-md text-center">
                    <div className="font-medium mb-1">
                      {language === 'ja' ? 'キーボードショートカット' : 'Keyboard Shortcuts'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>← →</span>
                        <span>{language === 'ja' ? '前/次のページ' : 'Previous/Next page'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ctrl + ← →</span>
                        <span>{language === 'ja' ? '5ページ移動' : 'Move 5 pages'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* ページネーションコントロール */}
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="px-6 py-3 rounded-lg bg-white border border-gray-300 text-base font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 min-w-[80px] min-h-[44px] flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      {language === 'ja' ? '前へ' : 'Previous'}
                    </button>
                    
                    {getPaginationRange().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageClick(page)}
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
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-6 py-3 rounded-lg bg-white border border-gray-300 text-base font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 min-w-[80px] min-h-[44px] flex items-center justify-center gap-2"
                    >
                      {language === 'ja' ? '次へ' : 'Next'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
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
