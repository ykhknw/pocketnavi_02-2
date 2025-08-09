import { Building, SearchFilters } from '../types';
import { calculateDistance } from './distance';

export function searchBuildings(
  buildings: Building[],
  filters: SearchFilters,
  language: 'ja' | 'en' = 'ja'
): Building[] {
  // console.debug('🔍 Search Debug:', { totalBuildings: buildings.length, filters, language });

  let results = [...buildings];

  // Text search
  if (filters.query.trim()) {
    const query = filters.query.toLowerCase();
    results = results.filter(building => 
      building.title.toLowerCase().includes(query) ||
      building.titleEn.toLowerCase().includes(query) ||
      building.location.toLowerCase().includes(query) ||
      building.architectDetails.toLowerCase().includes(query) ||
      building.architects.some(arch => 
        arch.architectJa.toLowerCase().includes(query) ||
        arch.architectEn.toLowerCase().includes(query)
      )
    );
  }

  // Architect filter
  if (filters.architects && filters.architects.length > 0) {
    // console.debug('🏗️ Architect filter applied:', filters.architects);
    results = results.filter(building =>
      building.architects.some(arch => {
        const architectName = language === 'ja' ? arch.architectJa : arch.architectEn;
        const matches = filters.architects!.some(filterArch =>
          architectName.toLowerCase().includes(filterArch.toLowerCase())
        );
        if (matches) {
          // console.debug('✅ Architect match:', { building: building.title, architect: architectName, filter: filters.architects });
        }
        return matches;
      })
    );
    // console.debug('🏗️ After architect filter:', results.length, 'buildings');
  }

  // Building type filter (language-aware)
  if (filters.buildingTypes.length > 0) {
    results = results.filter(building => {
      const typesToCheck = language === 'ja' ? building.buildingTypes : (building.buildingTypesEn || building.buildingTypes);
      return filters.buildingTypes.some(type =>
        typesToCheck.some(bt => bt.toLowerCase().includes(type.toLowerCase()))
      );
    });
  }

  // Prefecture filter (language-aware)
  if (filters.prefectures.length > 0) {
    results = results.filter(building => {
      const prefValue = language === 'ja' ? building.prefectures : (building.prefecturesEn || building.prefectures);
      return filters.prefectures.includes(prefValue);
    });
  }

  // Area filter
  if (filters.areas.length > 0) {
    results = results.filter(building =>
      filters.areas.includes(building.areas)
    );
  }

  // Photo filter
  if (filters.hasPhotos) {
    results = results.filter(building =>
      building.photos.length > 0 || building.thumbnailUrl
    );
  }

  // Video filter
  if (filters.hasVideos) {
    results = results.filter(building =>
      building.youtubeUrl && building.youtubeUrl.trim() !== ''
    );
  }

  // Completion year filter
  if (typeof filters.completionYear === 'number' && !isNaN(filters.completionYear)) {
    results = results.filter(building => building.completionYears === filters.completionYear);
  }

  // Exclude residential by default
  if (filters.excludeResidential !== false) {
    results = results.filter(building =>
      !building.buildingTypes.includes('住宅') &&
      !(building.buildingTypesEn || []).includes('housing')
    );
  }

  // Distance filter
  if (filters.currentLocation) {
    results = results.filter(building => {
      const distance = calculateDistance(
        filters.currentLocation!.lat,
        filters.currentLocation!.lng,
        building.lat,
        building.lng
      );
      return distance <= filters.radius;
    });

    // Add distance to buildings and sort by distance
    results = results
      .map(building => ({
        ...building,
        distance: calculateDistance(
          filters.currentLocation!.lat,
          filters.currentLocation!.lng,
          building.lat,
          building.lng
        )
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // console.debug('🔍 Final results:', results.length, 'buildings');
  return results;
}