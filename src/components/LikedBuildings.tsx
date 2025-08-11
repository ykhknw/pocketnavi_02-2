import React from 'react';
import { Heart, Building, X } from 'lucide-react';
import { LikedBuilding } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { t } from '../utils/translations';

interface LikedBuildingsProps {
  likedBuildings: LikedBuilding[];
  language: 'ja' | 'en';
  onBuildingClick: (buildingId: number) => void;
  onRemoveBuilding?: (buildingId: number) => void;
}

export function LikedBuildings({ likedBuildings, language, onBuildingClick, onRemoveBuilding }: LikedBuildingsProps) {
  // likedBuildingsがundefinedまたはnullの場合は空配列として扱う
  const safeLikedBuildings = likedBuildings || [];
  
  if (safeLikedBuildings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {t('likedBuildings', language)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t('noLikedBuildings', language)}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          {t('likedBuildings', language)} ({safeLikedBuildings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {safeLikedBuildings.map((building) => (
            <div key={building.id} className="flex items-center gap-2 group">
              <Button
                variant="ghost"
                className="flex-1 justify-start text-left h-auto p-3"
                onClick={() => onBuildingClick(building.id)}
              >
                <div>
                  <div className="font-medium">
                    {language === 'ja' ? building.title : building.titleEn}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(building.likedAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')}
                  </div>
                </div>
              </Button>
              {onRemoveBuilding && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveBuilding(building.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}