import React, { useState } from 'react';
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

export function BuildingCard({
  building,
  onSelect,
  onLike,
  onPhotoLike,
  isSelected,
  index,
  language
}: BuildingCardProps) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [natureImage] = useState(() => getRandomDefaultNatureImage());
  
  const handleExternalImageSearch = (query: string) => {
    const encodedQuery = encodeURIComponent(query);
    window.open(`https://images.google.com/images?q=${encodedQuery}`, '_blank');
  };

  const getSearchQuery = () => {
    return language === 'ja' ? building.title : building.titleEn;
  };

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ring-2 ring-amber-400 shadow-lg hover:shadow-xl hover:ring-amber-500 bg-gradient-to-br from-white to-amber-50`}
      onClick={() => onSelect(building)}
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
            onClick={(e) => {
              e.stopPropagation();
              onLike(building.id);
            }}
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

        {building.photos.length > 0 && (
          <div className="mt-3 border-t border-amber-200 pt-3 bg-gradient-to-r from-amber-50 to-orange-50 -mx-4 px-4 rounded-b-lg">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">{language === 'ja' ? '投稿写真' : 'Real Photos'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {building.photos.slice(0, showAllPhotos ? building.photos.length : 3).map(photo => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.thumbnail_url}
                    alt=""
                    className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 ring-1 ring-amber-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(photo.url, '_blank');
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-2">
              {building.photos.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllPhotos(!showAllPhotos);
                  }}
                  className="text-amber-600 hover:text-amber-700 bg-white/50 hover:bg-white/80"
                >
                  {showAllPhotos ? t('close', language) : t('viewMore', language, { count: building.photos.length - 3 })}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExternalImageSearch(getSearchQuery());
                }}
                className="text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 ml-auto"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">{t('imageSearch', language)}</span>
              </Button>
            </div>
          </div>
        )}

        {building.photos.length === 0 && (
          <div className="mt-3 -mx-4 -mb-4">
            <div 
              className="relative h-24 bg-cover bg-center bg-no-repeat rounded-b-lg cursor-pointer hover:opacity-90 transition-opacity image-container"
              style={{ backgroundImage: `url(${natureImage})` }}
              onClick={(e) => {
                e.stopPropagation();
                handleExternalImageSearch(getSearchQuery());
              }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-40 rounded-b-lg z-10"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExternalImageSearch(getSearchQuery());
                }}
                className="absolute bottom-2 right-2 text-gray-700 hover:text-amber-700 bg-white bg-opacity-70 hover:bg-opacity-90 backdrop-blur-sm z-20"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">{t('imageSearch', language)}</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}