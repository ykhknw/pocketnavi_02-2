import React, { useState, useMemo, useCallback } from 'react';
import { Heart, MapPin, Calendar, Camera, Video, ExternalLink } from 'lucide-react';
import { Building } from '../types';
import { formatDistance } from '../utils/distance';
import { getRandomDefaultNatureImage } from '../utils/unsplash';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { t } from '../utils/translations';

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
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  
  // 自然画像をuseMemoで最適化
  const natureImage = useMemo(() => getRandomDefaultNatureImage(), []);

  // ハンドラー関数をuseCallbackで最適化
  const handleExternalImageSearch = useCallback((query: string) => {
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

  const handleCardClick = useCallback(() => {
    onSelect(building);
  }, [onSelect, building]);

  const handleTogglePhotos = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllPhotos(prev => !prev);
  }, []);

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
      } ring-2 ring-amber-400 shadow-lg hover:shadow-xl hover:ring-amber-500 bg-gradient-to-br from-white to-amber-50`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
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
            className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100"
          >
            <Heart className="h-4 w-4" />
            <span className="text-sm">{building.likes}</span>
          </Button>
        </div>

        <div className="space-y-3 mb-3">
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className="border-amber-300 text-amber-800 bg-amber-50 text-sm"
            >
              <MapPin className="h-3 w-3 mr-1" />
              {language === 'ja' ? building.location : (building.locationEn || building.location)}
            </Badge>
            {building.distance && (
              <Badge
                variant="outline"
                className="border-green-300 text-green-800 bg-green-50 text-sm"
              >
                {formatDistance(building.distance)}
              </Badge>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-1">
              {building.architects.map(architect => (
                <Badge
                  key={architect.architect_id}
                  variant="default"
                  className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-sm"
                >
                  {language === 'ja' ? architect.architectJa : architect.architectEn}
                </Badge>
              ))}
            </div>
          </div>

          {building.completionYears && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{building.completionYears}</span>
            </div>
          )}
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
            onClick={() => handleExternalImageSearch(getSearchQuery())}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            {t('searchImages', language)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Props比較関数
const arePropsEqual = (prevProps: BuildingCardProps, nextProps: BuildingCardProps): boolean => {
  return (
    prevProps.building.id === nextProps.building.id &&
    prevProps.building.title === nextProps.building.title &&
    prevProps.building.titleEn === nextProps.building.titleEn &&
    prevProps.building.location === nextProps.building.location &&
    prevProps.building.locationEn === nextProps.building.locationEn &&
    prevProps.building.likes === nextProps.building.likes &&
    prevProps.building.distance === nextProps.building.distance &&
    prevProps.building.architects.length === nextProps.building.architects.length &&
    prevProps.building.photos.length === nextProps.building.photos.length &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.index === nextProps.index &&
    prevProps.language === nextProps.language &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onLike === nextProps.onLike &&
    prevProps.onPhotoLike === nextProps.onPhotoLike
  );
};

export const BuildingCard = React.memo(BuildingCardComponent, arePropsEqual);