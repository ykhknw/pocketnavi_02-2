import React from 'react';
import { Heart, Building } from 'lucide-react';
import { LikedBuilding } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { t } from '../utils/translations';

interface LikedBuildingsProps {
  likedBuildings: LikedBuilding[];
  language: 'ja' | 'en';
  onBuildingClick: (buildingId: number) => void;
}

export function LikedBuildings({ likedBuildings, language, onBuildingClick }: LikedBuildingsProps) {
  if (likedBuildings.length === 0) {
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
          {t('likedBuildings', language)} ({likedBuildings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {likedBuildings.map((building) => (
            <Button
              key={building.id}
              variant="ghost"
              className="w-full justify-start text-left h-auto p-3"
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}