import React, { useEffect } from 'react';
import { X, Heart, MapPin, Calendar, Camera, Video, ExternalLink, Globe, Play, ArrowLeft } from 'lucide-react';
import { Building } from '../types';
import { formatDistance } from '../utils/distance';
import { DetailMap } from './DetailMap';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { t } from '../utils/translations';
import { getRandomDefaultNatureImage } from '../utils/unsplash';

interface BuildingDetailProps {
  building: Building;
  onClose: () => void;
  onLike: (buildingId: number) => void;
  onPhotoLike: (photoId: number) => void;
  language: 'ja' | 'en';
  onSearchAround: (lat: number, lng: number) => void;
  displayIndex?: number;
  isInline?: boolean;
}

export function BuildingDetail({ 
  building, 
  onClose, 
  onLike, 
  onPhotoLike, 
  language, 
  onSearchAround,
  displayIndex,
  isInline = false
}: BuildingDetailProps) {
  // 実際の建築写真かどうかを判定
  const hasRealPhotos = building.photos.length > 0;
  const isRealThumbnail = !building.thumbnailUrl.includes('pexels.com');
  const isRealBuilding = hasRealPhotos || isRealThumbnail;

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    if (!isInline) {
      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleClose();
        }
      };

      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, []);

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

  const handleClose = (e?: React.MouseEvent) => {
    console.log('🔍 BuildingDetail handleClose called', { e, onClose });
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🔍 About to call onClose');
    onClose();
    console.log('🔍 onClose called');
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    console.log('🔍 Background clicked', { target: e.target, currentTarget: e.currentTarget });
    if (e.target === e.currentTarget) {
      console.log('🔍 Background click - calling handleClose');
      handleClose();
    }
  };

  // インライン表示の場合
  if (isInline) {
    return (
      <div className="ring-2 ring-amber-400 shadow-lg bg-gradient-to-br from-white to-amber-50 rounded-lg">
        <div className="p-4">
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

            <div className="flex flex-wrap gap-1">
              {(language === 'ja' ? building.buildingTypes : (building.buildingTypesEn || building.buildingTypes)).slice(0, 3).map((type, index) => (
                <Badge
                  key={`${type}-${index}`}
                  variant="secondary"
                  className="border-amber-200 text-amber-700 text-sm"
                >
                  {type}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              <Badge
                variant="outline"
                className="border-amber-300 text-amber-800 bg-amber-50 text-sm"
              >
                <Calendar className="h-3 w-3 mr-1" />
                {building.completionYears}{t('year', language)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {building.photos.length > 0 && (
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <Camera className="h-4 w-4" />
                  <span className="text-sm font-medium">{building.photos.length}</span>
                </div>
              )}
              {building.youtubeUrl && (
                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  <Video className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('hasVideo', language)}</span>
                </div>
              )}
            </div>
          </div>

          {building.photos.length === 0 && (
            <div className="mt-3 -mx-4 -mb-4">
              <div 
                className="relative h-24 bg-cover bg-center bg-no-repeat rounded-b-lg cursor-pointer hover:opacity-90 transition-opacity image-container"
                style={{ backgroundImage: `url(${getRandomDefaultNatureImage()})` }}
                onClick={() => handleExternalImageSearch(language === 'ja' ? building.title : building.titleEn)}
              >
                <div className="absolute inset-0 bg-white bg-opacity-40 rounded-b-lg z-10"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExternalImageSearch(language === 'ja' ? building.title : building.titleEn);
                  }}
                  className="absolute bottom-2 right-2 text-gray-700 hover:text-amber-700 bg-white bg-opacity-70 hover:bg-opacity-90 backdrop-blur-sm z-20"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="text-sm">{t('imageSearch', language)}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // モーダル表示（既存のコード）
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackgroundClick}
    >
      <div className={`rounded-lg max-w-4xl max-h-[90vh] w-full overflow-y-auto ${
        isRealBuilding 
          ? 'bg-gradient-to-br from-white to-amber-50 ring-2 ring-amber-300 shadow-2xl' 
          : 'bg-white shadow-xl'
      }`} onClick={(e) => e.stopPropagation()}>
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between z-10 ${
          isRealBuilding 
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
            : 'bg-white'
        } z-[9999]`}>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium">
              {displayIndex || building.id}
            </div>
            <h2 className={`text-xl font-bold ${
              isRealBuilding ? 'text-amber-900' : 'text-gray-900'
            }`} style={{ fontSize: '1.5rem' }}>
            {language === 'ja' ? building.title : building.titleEn}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLike(building.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-red-50 text-red-600 hover:bg-red-100"
            >
              <Heart className="h-4 w-4" />
              <span className="font-medium">{building.likes}</span>
            </button>
            <button
              onClick={handleClose}
              className={`p-4 rounded-full transition-colors ${
                isRealBuilding 
                  ? 'hover:bg-amber-100 text-amber-700' 
                  : 'hover:bg-gray-100'
              }`}
              style={{ zIndex: 10000 }}
            >
              <X className="h-8 w-8" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side - Card-like information */}
            <div className="space-y-3 lg:pr-4">
              {/* Address Badge */}
              <div className="flex flex-wrap gap-1">
                <div className="flex items-center gap-1 border-amber-300 text-amber-800 bg-amber-50 text-sm px-3 py-1 rounded-full border">
                  <MapPin className="h-3 w-3" />
                  {language === 'ja' ? building.location : (building.locationEn || building.location)}
                </div>
                {building.distance && (
                  <div className="border-green-300 text-green-800 bg-green-50 text-sm px-3 py-1 rounded-full border">
                    {formatDistance(building.distance)}
                  </div>
                )}
              </div>

              {/* Architect Badges */}
              <div className="flex flex-wrap gap-1">
                {building.architects.map(architect => (
                  <div
                    key={architect.architect_id}
                    className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-sm px-3 py-1 rounded-full"
                  >
                    {language === 'ja' ? architect.architectJa : architect.architectEn}
                  </div>
                ))}
              </div>

              {/* Building Type Badges */}
              <div className="flex flex-wrap gap-1">
                {(language === 'ja' ? building.buildingTypes : (building.buildingTypesEn || building.buildingTypes)).slice(0, 3).map((type, index) => (
                  <div
                    key={`${type}-${index}`}
                    className="border-amber-200 text-amber-700 text-sm px-3 py-1 rounded-full bg-secondary"
                  >
                    {type}
                  </div>
                ))}
              </div>

              {/* Year Badge */}
              <div className="flex flex-wrap gap-1 mb-2">
                <div className="border-amber-300 text-amber-800 bg-amber-50 text-sm px-3 py-1 rounded-full border flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {building.completionYears}{t('year', language)}
                </div>
              </div>

              {/* Media Badges */}
              <div className="flex items-center gap-3">
                {building.photos.length > 0 && (
                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <Camera className="h-4 w-4" />
                    <span className="text-sm font-medium">{building.photos.length}</span>
                  </div>
                )}
                {building.youtubeUrl && (
                  <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <Video className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('hasVideo', language)}</span>
                  </div>
                )}
              </div>

              {/* Image Search Badges */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleExternalImageSearch(`${language === 'ja' ? building.title : building.titleEn} ${building.architects[0]?.[language === 'ja' ? 'architectJa' : 'architectEn'] || ''}`, 'google')}
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('googleImageSearch', language)}
                </button>
                <button
                  onClick={() => handleExternalImageSearch(`${language === 'ja' ? building.title : building.titleEn} ${building.architects[0]?.[language === 'ja' ? 'architectJa' : 'architectEn'] || ''}`, 'bing')}
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('bingImageSearch', language)}
                </button>
              </div>
            </div>

            {/* Right side - Map */}
            <div className="space-y-4 lg:pl-4">
              {/* Map */}
              <div className="h-96">
                <DetailMap
                  building={building} 
                  language={language}
                  onSearchAround={onSearchAround}
                />
              </div>
            </div>
          </div>

          {/* Full width photos section */}
          <div className="mt-16 border-t pt-8">
            {building.photos.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {building.photos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-105 ring-2 ring-amber-300 shadow-lg filter brightness-110 contrast-110"
                        onClick={() => window.open(photo.url, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-colors rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => onPhotoLike(photo.id)}
                          className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:from-amber-600 hover:to-orange-600 shadow-lg"
                        >
                          <Heart className="h-4 w-4" />
                          <span className="text-sm font-medium">{photo.likes}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full width video section */}
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
      </div>
    </div>
  );
}