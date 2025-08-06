import { Building, SearchFilters, User, LikedBuilding, SearchHistory } from '../types';

/**
 * Supabaseの生データ構造の型ガード
 */
export function isSupabaseBuildingData(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return false;
  
  const data = obj as Record<string, unknown>;
  
  return (
    typeof data.building_id === 'number' &&
    typeof data.uid === 'string' &&
    typeof data.title === 'string' &&
    typeof data.location === 'string' &&
    (typeof data.lat === 'number' || typeof data.lat === 'string') &&
    (typeof data.lng === 'number' || typeof data.lng === 'string')
    // building_architectsフィールドはオプション（JOINの結果）
  );
}

/**
 * Building オブジェクトの型ガード
 */
export function isBuildingData(obj: unknown): obj is Building {
  if (!obj || typeof obj !== 'object') return false;
  
  const building = obj as Record<string, unknown>;
  
  return (
    typeof building.id === 'number' &&
    typeof building.title === 'string' &&
    typeof building.titleEn === 'string' &&
    typeof building.location === 'string' &&
    typeof building.lat === 'number' &&
    typeof building.lng === 'number' &&
    typeof building.completionYears === 'number' &&
    Array.isArray(building.architects) &&
    Array.isArray(building.buildingTypes) &&
    Array.isArray(building.buildingTypesEn) &&
    typeof building.description === 'string' &&
    typeof building.descriptionEn === 'string' &&
    typeof building.area === 'number' &&
    typeof building.height === 'number' &&
    typeof building.floors === 'number' &&
    typeof building.undergroundFloors === 'number' &&
    typeof building.construction === 'string' &&
    typeof building.structure === 'string' &&
    typeof building.materials === 'string' &&
    typeof building.photoUrl === 'string' &&
    typeof building.photoUrlEn === 'string' &&
    typeof building.videoUrl === 'string' &&
    typeof building.videoUrlEn === 'string' &&
    typeof building.created_at === 'string' &&
    typeof building.updated_at === 'string'
  );
}

/**
 * 座標データの型ガード
 */
export function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    (typeof lat === 'number' || typeof lat === 'string') &&
    (typeof lng === 'number' || typeof lng === 'string') &&
    !isNaN(Number(lat)) && !isNaN(Number(lng)) &&
    Number(lat) >= -90 && Number(lat) <= 90 &&
    Number(lng) >= -180 && Number(lng) <= 180
  );
}

/**
 * API応答の型ガード
 */
export function isAPIResponse(obj: unknown): obj is { data: unknown; error: unknown } {
  if (!obj || typeof obj !== 'object') return false;
  
  const response = obj as Record<string, unknown>;
  return 'data' in response || 'error' in response;
}

/**
 * SearchFilters の型ガード
 */
export function isSearchFilters(obj: unknown): obj is SearchFilters {
  if (!obj || typeof obj !== 'object') return false;
  
  const filters = obj as Record<string, unknown>;
  
  return (
    typeof filters.query === 'string' &&
    typeof filters.radius === 'number' &&
    Array.isArray(filters.architects) &&
    Array.isArray(filters.buildingTypes) &&
    Array.isArray(filters.prefectures) &&
    Array.isArray(filters.areas) &&
    typeof filters.hasPhotos === 'boolean' &&
    typeof filters.hasVideos === 'boolean' &&
    (filters.currentLocation === null || 
     (typeof filters.currentLocation === 'object' && 
      filters.currentLocation !== null &&
      'lat' in filters.currentLocation && 
      'lng' in filters.currentLocation))
  );
}

/**
 * User オブジェクトの型ガード
 */
export function isUserData(obj: unknown): obj is User {
  if (!obj || typeof obj !== 'object') return false;
  
  const user = obj as Record<string, unknown>;
  
  return (
    typeof user.id === 'number' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    typeof user.created_at === 'string'
  );
}

/**
 * LikedBuilding オブジェクトの型ガード
 */
export function isLikedBuildingData(obj: unknown): obj is LikedBuilding {
  if (!obj || typeof obj !== 'object') return false;
  
  const likedBuilding = obj as Record<string, unknown>;
  
  return (
    typeof likedBuilding.id === 'number' &&
    typeof likedBuilding.title === 'string' &&
    typeof likedBuilding.titleEn === 'string' &&
    typeof likedBuilding.likedAt === 'string'
  );
}

/**
 * SearchHistory オブジェクトの型ガード
 */
export function isSearchHistoryData(obj: unknown): obj is SearchHistory {
  if (!obj || typeof obj !== 'object') return false;
  
  const searchHistory = obj as Record<string, unknown>;
  
  return (
    typeof searchHistory.query === 'string' &&
    typeof searchHistory.searchedAt === 'string' &&
    typeof searchHistory.count === 'number'
  );
}

/**
 * 配列の型ガード
 */
export function isArrayOf<T>(
  arr: unknown, 
  typeGuard: (item: unknown) => item is T
): arr is T[] {
  return Array.isArray(arr) && arr.every(typeGuard);
}

/**
 * 文字列配列の型ガード
 */
export function isStringArray(arr: unknown): arr is string[] {
  return Array.isArray(arr) && arr.every(item => typeof item === 'string');
}

/**
 * 数値配列の型ガード
 */
export function isNumberArray(arr: unknown): arr is number[] {
  return Array.isArray(arr) && arr.every(item => typeof item === 'number');
}

/**
 * オブジェクトの型ガード
 */
export function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * 関数の型ガード
 */
export function isFunction(fn: unknown): fn is Function {
  return typeof fn === 'function';
}

/**
 * 文字列の型ガード
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 数値の型ガード
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 真偽値の型ガード
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
} 