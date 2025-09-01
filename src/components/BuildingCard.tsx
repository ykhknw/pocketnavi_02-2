import React, { useState, useMemo, useCallback, memo } from 'react';
import { Heart, MapPin, Calendar, Camera, Video, ExternalLink } from 'lucide-react';
import { Building } from '../types';
import { formatDistance } from '../utils/distance';
import { getStableNatureImage } from '../utils/unsplash';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { t } from '../utils/translations';
import { useAppContext } from './providers/AppProvider';
import { cn } from '../lib/utils';

interface BuildingCardProps {
  building: Building;
  onSelect: (building: Building) => void;
  onLike: (buildingId: number) => void;
  onPhotoLike: (photoId: number) => void;
  isSelected: boolean;
  index: number;
  language: 'ja' | 'en';
}

// 遅延読み込み用の画像コンポーネント
const LazyImage = React.memo(({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <Camera className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <Camera className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
});

function BuildingCardComponent({
  building,
  onSelect,
  onLike,
  onPhotoLike,
  isSelected,
  index,
  language
}: BuildingCardProps) {
  const context = useAppContext();
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  
  // 建築物IDに基づいて安定した自然画像を取得
  const natureImage = useMemo(() => getStableNatureImage(building.id), [building.id]);

  // ハンドラー関数をuseCallbackで最適化
  const handleExternalImageSearch = useCallback((e: React.MouseEvent, query: string) => {
    e.stopPropagation(); // イベントの伝播を防ぐ
    const encodedQuery = encodeURIComponent(query);
    window.open(`https://images.google.com/images?q=${encodedQuery}`, '_blank');
  }, []);

  const getSearchQuery = useCallback(() => {
    return language === 'ja' ? building.title : building.titleEn;
  }, [language, building.title, building.titleEn]);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(building.id);
  }, [onLike, building.id]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(building);
  }, [onSelect, building]);

  const handleTogglePhotos = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllPhotos(prev => !prev);
  }, []);

  const handleOpenInGoogleMaps = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const { lat, lng } = building;
    if (
      typeof lat === 'number' && typeof lng === 'number' &&
      !isNaN(lat) && !isNaN(lng)
    ) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank');
    }
  }, [building.lat, building.lng]);

  const handleArchitectSearch = useCallback((e: React.MouseEvent, name: string, slug?: string) => {
    e.stopPropagation();
    
    if (slug) {
      // 新しいテーブル構造: slugベースの建築家ページに遷移
      console.log('新しいテーブル構造での建築家検索:', { name, slug });
      window.location.href = `/architects/${slug}`;
    } else {
      // 古いテーブル構造: 名前ベースの検索
      console.log('古いテーブル構造での建築家検索:', { name });
      
      // 既存フィルターを保持し、建築家のみを追加/更新
      const currentArchitects = context.filters.architects || [];
      const newArchitects = currentArchitects.includes(name) 
        ? currentArchitects.filter(a => a !== name) // 既に含まれている場合は削除
        : [...currentArchitects, name]; // 含まれていない場合は追加
      
      const newFilters = {
        ...context.filters,
        architects: newArchitects
      };
      
      context.setFilters(newFilters);
      
      // 検索履歴を更新
      if (context.updateSearchHistory) {
        context.updateSearchHistory(
          context.searchHistory,
          context.setSearchHistory,
          name,
          'architect',
          newFilters
        );
      }
    }
  }, [context]);

  const handleBuildingTypeSearch = useCallback((e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    // 既存フィルターを保持し、建物用途のみを追加/更新
    const currentTypes = context.filters.buildingTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    context.setFilters({
      ...context.filters,
      buildingTypes: newTypes,
    });
    context.setCurrentPage(1);
    context.handleSearchStart();
    // 現在のページを維持するため、navigate('/')を削除
  }, [context]);

  const handleCompletionYearSearch = useCallback((e: React.MouseEvent, year: number) => {
    e.stopPropagation();
    // 既存フィルターを保持し、建築年の選択/解除を切り替え
    const newCompletionYear = context.filters.completionYear === year ? null : year;
    
    context.setFilters({
      ...context.filters,
      completionYear: newCompletionYear,
    });
    context.setCurrentPage(1);
    context.handleSearchStart();
    // 現在のページを維持するため、navigate('/')を削除
  }, [context]);

  const handlePrefectureSearch = useCallback((e: React.MouseEvent, pref: string) => {
    e.stopPropagation();
    // 既存フィルターを保持し、都道府県のみを追加/更新
    const currentPrefectures = context.filters.prefectures || [];
    const newPrefectures = currentPrefectures.includes(pref)
      ? currentPrefectures.filter(p => p !== pref)
      : [...currentPrefectures, pref];
    
    const newFilters = {
      ...context.filters,
      prefectures: newPrefectures,
    };
    
    context.setFilters(newFilters);
    context.setCurrentPage(1);
    context.handleSearchStart();
    
    // 検索履歴を更新
    if (context.updateSearchHistory) {
      context.updateSearchHistory(
        context.searchHistory,
        context.setSearchHistory,
        pref,
        'prefecture',
        newFilters
      );
    }
  }, [context]);

  // 表示する写真を計算（useMemoで最適化）
  const displayPhotos = useMemo(() => {
    if (showAllPhotos) {
      return building.photos;
    }
    return building.photos.slice(0, 3);
  }, [building.photos, showAllPhotos]);

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium">
              {index + 1}
            </div>
            <h3 className="text-lg font-semibold line-clamp-2 text-gray-900 font-bold" style={{ fontSize: '1.25rem' }}>
              {language === 'ja' ? building.title : building.titleEn}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLikeClick}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Heart className="h-4 w-4" />
            <span className="text-sm">{building.likes}</span>
          </Button>
        </div>

        <div className="space-y-3 mb-3">
          {/* 建築家バッジ - architectsが存在し、空でない場合のみ表示 */}
          {(() => {
            // デバッグ用: 建築家情報の詳細確認
            console.log(`🔍 BuildingCard ${building.id} (${building.title}) の建築家情報:`, {
              architects: building.architects,
              architectsLength: building.architects?.length,
              firstArchitect: building.architects?.[0],
              architectJa: building.architects?.[0]?.architectJa,
              architectEn: building.architects?.[0]?.architectEn,
              slug: building.architects?.[0]?.slug
            });
            
            if (!building.architects || building.architects.length === 0) {
              console.log(`⚠️ 建築物 ${building.id} の建築家情報がありません`);
              return null;
            }
            
            return (
              <div>
                <div className="flex flex-wrap gap-1">
                  {building.architects.map(architect => {
                    const architectName = language === 'ja' ? architect.architectJa : architect.architectEn;
                    
                    console.log(`🔍 建築家 ${architect.architect_id}:`, {
                      architectJa: architect.architectJa,
                      architectEn: architect.architectEn,
                      slug: architect.slug,
                      architectName: architectName
                    });
                    
                    // architectNameがnull、undefined、空文字列の場合はスキップ
                    if (!architectName || architectName.trim() === '') {
                      console.log(`⚠️ 建築家 ${architect.architect_id} の名前が空です`);
                      return null;
                    }
                    
                    // 全角スペースで分割
                    const architectNames = architectName.split('　').filter(name => name.trim());
                    
                    // 有効な名前がない場合はスキップ
                    if (architectNames.length === 0) {
                      console.log(`⚠️ 建築家 ${architect.architect_id} の分割後の名前が空です`);
                      return null;
                    }
                    
                    return architectNames.map((name, index) => {
                      const trimmedName = name.trim();
                      
                      // 空文字列の場合はスキップ
                      if (trimmedName === '') {
                        return null;
                      }
                      
                      console.log(`✅ 建築家バッジ作成: ${trimmedName} (${architect.slug})`);
                      
                      // 部分一致チェック: フィルターの建築家名が現在の建築家名に含まれているか、またはその逆
                      const isHighlighted = context.filters.architects?.some(filterArchitect => 
                        trimmedName.includes(filterArchitect) || filterArchitect.includes(trimmedName)
                      );
                      
                      return (
                        <Badge
                          key={`${architect.architect_id}-${index}`}
                          variant={isHighlighted ? "default" : "secondary"}
                          className={cn(
                            "text-sm cursor-pointer transition-all duration-300",
                            isHighlighted ? [
                              "bg-primary text-primary-foreground",
                              "ring-2 ring-primary/50",
                              "scale-105",
                              "font-semibold",
                              "shadow-md"
                            ] : [
                              "bg-primary/10 text-primary",
                              "hover:bg-primary/20"
                            ]
                          )}
                          title={language === 'ja' ? 'この建築家で検索' : 'Search by this architect'}
                          onClick={(e) => handleArchitectSearch(e, trimmedName, architect.slug)}
                        >
                          {trimmedName}
                        </Badge>
                      );
                    });
                  }).filter(Boolean)} {/* nullの要素をフィルタリング */}
                </div>
              </div>
            );
          })()}

          <div className="flex flex-wrap gap-1">
            {/* 住所バッジ - locationが存在する場合のみ表示 */}
            {building.location && building.location.trim() !== '' && (
              <Badge
                variant="outline"
                className="border-gray-300 text-gray-700 bg-gray-50 text-sm cursor-pointer hover:bg-gray-100"
                title={language === 'ja' ? 'Googleマップで開く' : 'Open in Google Maps'}
                onClick={handleOpenInGoogleMaps}
              >
                <MapPin className="h-3 w-3 mr-1" />
                {language === 'ja' ? building.location : (building.locationEn || building.location)}
              </Badge>
            )}
                         {building.prefectures && (() => {
               const prefecture = language === 'ja' ? building.prefectures : (building.prefecturesEn || building.prefectures);
               const isHighlighted = context.filters.prefectures?.includes(prefecture);
               
               return (
                 <Badge
                   variant={isHighlighted ? "default" : "outline"}
                   className={cn(
                     "text-sm cursor-pointer transition-all duration-300",
                                           isHighlighted ? [
                        "bg-purple-500 text-white",
                        "ring-2 ring-purple-500/50",
                        "scale-105",
                        "font-semibold",
                        "shadow-md"
                      ] : [
                       "border-gray-300 text-gray-700 bg-gray-50",
                       "hover:bg-gray-100"
                     ]
                   )}
                   title={language === 'ja' ? 'この都道府県で検索' : 'Search by this prefecture'}
                   onClick={(e) => handlePrefectureSearch(e, prefecture)}
                 >
                   {prefecture}
                 </Badge>
               );
             })()}
            {building.distance && (
              <Badge
                variant="outline"
                className="border-gray-300 text-gray-700 bg-gray-50 text-sm"
              >
                {formatDistance(building.distance)}
              </Badge>
            )}
          </div>

                     {/* 用途バッジ - buildingTypesが存在し、空でない場合のみ表示 */}
                     {(() => {
                       const types = language === 'ja' ? building.buildingTypes : (building.buildingTypesEn || building.buildingTypes);
                       if (!types || types.length === 0) return null;
                       
                       const validTypes = types.filter(type => type && type.trim() !== '');
                       if (validTypes.length === 0) return null;
                       
                       return (
                         <div className="flex flex-wrap gap-1">
                           {validTypes.map((type, index) => {
                             // 部分一致チェック: フィルターの用途が現在の用途に含まれているか、またはその逆
                             const isHighlighted = context.filters.buildingTypes?.some(filterType => 
                               type.includes(filterType) || filterType.includes(type)
                             );
                             
                             return (
                               <Badge
                                 key={`${type}-${index}`}
                                 variant={isHighlighted ? "default" : "secondary"}
                                 className={cn(
                                   "text-sm cursor-pointer transition-all duration-300",
                                   isHighlighted ? [
                                     "bg-green-500 text-white",
                                     "ring-2 ring-green-500/50",
                                     "scale-105",
                                     "font-semibold",
                                     "shadow-md"
                                   ] : [
                                     "border-gray-300 text-gray-700",
                                     "hover:bg-gray-100"
                                   ]
                                 )}
                                 title={language === 'ja' ? 'この用途で検索' : 'Search by this building type'}
                                 onClick={(e) => handleBuildingTypeSearch(e, type)}
                               >
                                 {type}
                               </Badge>
                             );
                           })}
                         </div>
                       );
                     })()}

                     {/* 建築年バッジ - completionYearsが存在し、有効な値の場合のみ表示 */}
                     {building.completionYears && 
                      building.completionYears > 0 && 
                      !isNaN(building.completionYears) && (() => {
                       const isHighlighted = context.filters.completionYear === building.completionYears;
                       
                       return (
                         <div className="flex items-center gap-1">
                           <Badge
                             variant={isHighlighted ? "default" : "outline"}
                             className={cn(
                               "text-sm cursor-pointer transition-all duration-300",
                               isHighlighted ? [
                                 "bg-orange-500 text-white",
                                 "ring-2 ring-orange-500/50",
                                 "scale-105",
                                 "font-semibold",
                                 "shadow-md"
                               ] : [
                                 "border-gray-300 text-gray-700 bg-gray-50",
                                 "hover:bg-gray-100"
                               ]
                             )}
                             title={language === 'ja' ? 'この建築年で検索' : 'Search by this completion year'}
                             onClick={(e) => handleCompletionYearSearch(e, building.completionYears)}
                           >
                             <Calendar className="h-3 w-3 mr-1" />
                             {building.completionYears}
                           </Badge>
                         </div>
                       );
                     })()}
        </div>

        {/* 写真ギャラリー */}
        {building.photos.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {t('photos', language)} ({building.photos.length})
                </span>
              </div>
              {building.photos.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTogglePhotos}
                  className="text-xs"
                >
                  {showAllPhotos ? t('showLess', language) : t('showMore', language)}
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {displayPhotos.map((photo, photoIndex) => (
                <div key={photoIndex} className="aspect-square overflow-hidden rounded-lg">
                  <LazyImage
                    src={photo.url}
                    alt={`${building.title} - Photo ${photoIndex + 1}`}
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}



        {/* 外部画像検索 */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => handleExternalImageSearch(e, getSearchQuery())}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Google Images
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Props比較関数（最適化）
const arePropsEqual = (prevProps: BuildingCardProps, nextProps: BuildingCardProps): boolean => {
  // 基本的なプロパティの比較
  if (
    prevProps.building.id !== nextProps.building.id ||
    prevProps.building.likes !== nextProps.building.likes ||
    prevProps.isSelected !== nextProps.isSelected ||
    prevProps.index !== nextProps.index ||
    prevProps.language !== nextProps.language
  ) {
    return false;
  }

  // 関数プロパティの比較（参照が同じかどうか）
  if (
    prevProps.onSelect !== nextProps.onSelect ||
    prevProps.onLike !== nextProps.onLike ||
    prevProps.onPhotoLike !== nextProps.onPhotoLike
  ) {
    return false;
  }

  return true;
};

export const BuildingCard = memo(BuildingCardComponent, arePropsEqual);