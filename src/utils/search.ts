import { Building, SearchFilters } from '../types';
import { calculateDistance } from './distance';

export function searchBuildings(
  buildings: Building[],
  filters: SearchFilters
): Building[] {
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
    results = results.filter(building =>
      building.architects.some(arch =>
        filters.architects!.some(filterArch =>
          arch.architectJa.includes(filterArch) ||
          arch.architectEn.includes(filterArch)
        )
      )
    );
  }

  // Building type filter
  if (filters.buildingTypes.length > 0) {
    results = results.filter(building =>
      filters.buildingTypes.some(type =>
        building.buildingTypes.includes(type) ||
        building.parentBuildingTypes.includes(type)
      )
    );
  }

  // Prefecture filter
  if (filters.prefectures.length > 0) {
    results = results.filter(building =>
      filters.prefectures.includes(building.prefectures)
    );
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
  } else {
    // Sort by building_id in descending order
    results.sort((a, b) => b.id - a.id);
  }

  return results;
}