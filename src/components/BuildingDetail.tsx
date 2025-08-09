import React, { useMemo, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, Camera, Video, ExternalLink } from 'lucide-react';
import { Building } from '../types';
import { formatDistance } from '../utils/distance';

import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { t } from '../utils/translations';
import { getStableNatureImage } from '../utils/unsplash';
import { useAppContext } from './providers/AppProvider';

interface BuildingDetailProps {
  building: Building;
  onLike: (buildingId: number) => void;
  onPhotoLike: (photoId: number) => void;
  language: 'ja' | 'en';
  displayIndex?: number;
}

// 遅延読み込み用の画像コンポーネント
const LazyImage = React.memo(({ src, alt, className, onClick }: { src: string; alt: string; className?: string; onClick?: () => void }) => {
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
        onClick={onClick}
        loading="lazy"
      />
    </div>
  );
});

function BuildingDetailComponent({ 
  building, 
  onLike, 
  onPhotoLike, 
  language, 
  displayIndex
}: BuildingDetailProps) {
  const context = useAppContext();
  const navigate = useNavigate();
  // 実際の建築写真かどうかを判定
  const hasRealPhotos = building.photos.length > 0;
  const isRealThumbnail = !building.thumbnailUrl.includes('pexels.com');
  const isRealBuilding = hasRealPhotos || isRealThumbnail;

  // 画像の安定性を確保するため、building.idをキーとして使用
  const stableImageKey = useMemo(() => {
    return `building-${building.id}`;
  }, [building.id]);

  // 安定した自然画像URLをメモ化
  const stableNatureImageUrl = useMemo(() => {
    return getStableNatureImage(building.id);
  }, [building.id]);



  const handleExternalImageSearch = (query: string, engine: 'google' | 'bing' = 'google') => {
    const encodedQuery = encodeURIComponent(query);
    const url = engine === 'google' 
      ? `https://images.google.com/images?q=${encodedQuery}`
      : `https://www.bing.com/images/search?q=${encodedQuery}`;
    window.open(url, '_blank');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const handleOpenInGoogleMaps = useCallback(() => {
    const { lat, lng } = building;
    if (
      typeof lat === 'number' && typeof lng === 'number' &&
      !isNaN(lat) && !isNaN(lng)
    ) {
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      window.open(url, '_blank');
    }
  }, [building.lat, building.lng]);

  const handleArchitectSearch = useCallback((name: string) => {
    // 既存フィルタをリセットし、建築家のみ設定してトップへ遷移
    context.setFilters({
      query: '',
      radius: 5,
      architects: [name],
      buildingTypes: [],
      prefectures: [],
      areas: [],
      hasPhotos: false,
      hasVideos: false,
      currentLocation: null,
    });
    context.setCurrentPage(1);
    context.handleSearchStart();
    navigate('/');
  }, [context, navigate]);

  const handleBuildingTypeSearch = useCallback((type: string) => {
    // 既存フィルタをリセットし、用途のみ設定してトップへ遷移
    context.setFilters({
      query: '',
      radius: 5,
      architects: [],
      buildingTypes: [type],
      prefectures: [],
      areas: [],
      hasPhotos: false,
      hasVideos: false,
      currentLocation: null,
    });
    context.setCurrentPage(1);
    context.handleSearchStart();
    navigate('/');
  }, [context, navigate]);



  // 単一ページ表示（モーダルを削除し、インライン表示のみに）
  return (
    <div className="shadow-lg bg-white rounded-lg w-full">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium">
              {displayIndex || building.id}
            </div>
            <h3 className="text-lg font-semibold line-clamp-2 text-gray-900 font-bold" style={{ fontSize: '1.25rem' }}>
              {language === 'ja' ? building.title : building.titleEn}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike(building.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Heart className="h-4 w-4" />
            <span className="text-sm">{building.likes}</span>
          </Button>
        </div>

        <div className="space-y-3 mb-3">
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className="border-gray-300 text-gray-700 bg-gray-50 text-sm cursor-pointer hover:bg-gray-100"
              title={language === 'ja' ? 'Googleマップで開く' : 'Open in Google Maps'}
              onClick={handleOpenInGoogleMaps}
            >
              <MapPin className="h-3 w-3 mr-1" />
              {language === 'ja' ? building.location : (building.locationEn || building.location)}
            </Badge>
            {building.distance && (
              <Badge
                variant="outline"
                className="border-gray-300 text-gray-700 bg-gray-50 text-sm"
              >
                {formatDistance(building.distance)}
              </Badge>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-1">
              {building.architects.map(architect => {
                const architectName = language === 'ja' ? architect.architectJa : architect.architectEn;
                // 全角スペースで分割
                const architectNames = architectName.split('　').filter(name => name.trim());
                
                return architectNames.map((name, index) => (
                  <Badge
                    key={`${architect.architect_id}-${index}`}
                    variant="default"
                    className="bg-primary/10 text-primary hover:bg-primary/20 text-sm cursor-pointer"
                    title={language === 'ja' ? 'この建築家で検索' : 'Search by this architect'}
                    onClick={() => handleArchitectSearch(name.trim())}
                  >
                    {name.trim()}
                  </Badge>
                ));
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {(language === 'ja' ? building.buildingTypes : (building.buildingTypesEn || building.buildingTypes)).slice(0, 3).map((type, index) => (
              <Badge
                key={`${type}-${index}`}
                variant="secondary"
                className="border-gray-300 text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                title={language === 'ja' ? 'この用途で検索' : 'Search by this building type'}
                onClick={() => handleBuildingTypeSearch(type)}
              >
                {type}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-1 mb-2">
            <Badge
              variant="outline"
              className="border-gray-300 text-gray-700 bg-gray-50 text-sm"
            >
              <Calendar className="h-3 w-3 mr-1" />
              {building.completionYears}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {building.photos.length > 0 && (
              <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                <Camera className="h-4 w-4" />
                <span className="text-sm font-medium">{building.photos.length}</span>
              </div>
            )}
            {building.youtubeUrl && (
              <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">{t('hasVideo', language)}</span>
              </div>
            )}
          </div>
        </div>



        {/* Photos */}
        {building.photos.length > 0 ? (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {building.photos.map(photo => (
                <div key={photo.id} className="relative group">
                  <LazyImage
                    src={photo.url}
                    alt=""
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg"
                    onClick={() => window.open(photo.url, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-colors rounded-lg flex items-center justify-center">
                    <button
                      onClick={() => onPhotoLike(photo.id)}
                      className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/90 shadow-lg"
                    >
                      <Heart className="h-4 w-4" />
                      <span className="text-sm font-medium">{photo.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div 
              className="relative h-32 bg-cover bg-center bg-no-repeat rounded-lg cursor-pointer hover:opacity-90 transition-opacity image-container"
              style={{ backgroundImage: `url(${stableNatureImageUrl})` }}
              onClick={() => handleExternalImageSearch(language === 'ja' ? building.title : building.titleEn)}
            >
              <div className="absolute inset-0 bg-white bg-opacity-40 rounded-lg z-10"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExternalImageSearch(language === 'ja' ? building.title : building.titleEn);
                }}
                className="absolute bottom-2 right-2 text-gray-700 hover:text-gray-900 bg-white bg-opacity-70 hover:bg-opacity-90 backdrop-blur-sm z-20"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">{t('imageSearch', language)}</span>
              </Button>
            </div>
          </div>
        )}

        {/* YouTube Video */}
        {building.youtubeUrl && (
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              src={getYouTubeEmbedUrl(building.youtubeUrl)}
              title={`${language === 'ja' ? building.title : building.titleEn} - YouTube`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Props比較関数
const arePropsEqual = (prevProps: BuildingDetailProps, nextProps: BuildingDetailProps): boolean => {
  return (
    prevProps.building.id === nextProps.building.id &&
    prevProps.building.likes === nextProps.building.likes &&
    prevProps.language === nextProps.language &&
    prevProps.displayIndex === nextProps.displayIndex &&
    prevProps.onLike === nextProps.onLike &&
    prevProps.onPhotoLike === nextProps.onPhotoLike
  );
};

export const BuildingDetail = memo(BuildingDetailComponent, arePropsEqual);