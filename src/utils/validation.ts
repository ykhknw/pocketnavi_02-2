import { Building, SearchFilters, User, LikedBuilding, SearchHistory } from '../types';
import { isBuildingData, isSearchFilters, isUserData, isLikedBuildingData, isSearchHistoryData } from './type-guards';
import { ErrorHandler } from './error-handling';

/**
 * バリデーション結果の型定義
 */
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
}

/**
 * バリデーション関数の型定義
 */
export type Validator<T> = (data: unknown) => ValidationResult<T>;

/**
 * バbuildingデータのバリデーション
 */
export function validateBuildingData(data: unknown): ValidationResult<Building> {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('Building data is required');
    return { isValid: false, errors };
  }
  
  if (!isBuildingData(data)) {
    errors.push('Invalid building data structure');
    return { isValid: false, errors };
  }
  
  // 座標の検証
  if (!data.lat || !data.lng) {
    errors.push('Building coordinates are required');
  }
  
  // タイトルの検証
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Building title is required');
  }
  
  // 建築家の検証
  if (!Array.isArray(data.architects) || data.architects.length === 0) {
    errors.push('At least one architect is required');
  }
  
  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors
  };
}

/**
 * 検索フィルターのバリデーション
 */
export function validateSearchFilters(data: unknown): ValidationResult<SearchFilters> {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('Search filters are required');
    return { isValid: false, errors };
  }
  
  if (!isSearchFilters(data)) {
    errors.push('Invalid search filters structure');
    return { isValid: false, errors };
  }
  
  // 半径の検証
  if (data.radius < 0 || data.radius > 50) {
    errors.push('Radius must be between 0 and 50');
  }
  
  // 配列の検証
  if (!Array.isArray(data.architects)) {
    errors.push('Architects must be an array');
  }
  
  if (!Array.isArray(data.buildingTypes)) {
    errors.push('Building types must be an array');
  }
  
  if (!Array.isArray(data.prefectures)) {
    errors.push('Prefectures must be an array');
  }
  
  if (!Array.isArray(data.areas)) {
    errors.push('Areas must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors
  };
}

/**
 * ユーザーデータのバリデーション
 */
export function validateUserData(data: unknown): ValidationResult<User> {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('User data is required');
    return { isValid: false, errors };
  }
  
  if (!isUserData(data)) {
    errors.push('Invalid user data structure');
    return { isValid: false, errors };
  }
  
  // メールアドレスの検証
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  // 名前の検証
  if (!data.name || data.name.trim().length === 0) {
    errors.push('User name is required');
  }
  
  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors
  };
}

/**
 * お気に入り建物データのバリデーション
 */
export function validateLikedBuildingData(data: unknown): ValidationResult<LikedBuilding> {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('Liked building data is required');
    return { isValid: false, errors };
  }
  
  if (!isLikedBuildingData(data)) {
    errors.push('Invalid liked building data structure');
    return { isValid: false, errors };
  }
  
  // タイトルの検証
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Building title is required');
  }
  
  // 日付の検証
  if (!data.likedAt || typeof data.likedAt !== 'string') {
    errors.push('Like date is required');
  }
  
  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors
  };
}

/**
 * 検索履歴データのバリデーション
 */
export function validateSearchHistoryData(data: unknown): ValidationResult<SearchHistory> {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('Search history data is required');
    return { isValid: false, errors };
  }
  
  if (!isSearchHistoryData(data)) {
    errors.push('Invalid search history data structure');
    return { isValid: false, errors };
  }
  
  // クエリの検証
  if (!data.query || typeof data.query !== 'string') {
    errors.push('Search query is required');
  }
  
  // カウントの検証
  if (typeof data.count !== 'number' || data.count < 0) {
    errors.push('Search count must be a non-negative number');
  }
  
  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? data : undefined,
    errors
  };
}

/**
 * 配列データのバリデーション
 */
export function validateArray<T>(
  data: unknown,
  itemValidator: (item: unknown) => ValidationResult<T>
): ValidationResult<T[]> {
  const errors: string[] = [];
  
  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { isValid: false, errors };
  }
  
  const validatedItems: T[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const itemResult = itemValidator(data[i]);
    if (!itemResult.isValid) {
      errors.push(`Item at index ${i}: ${itemResult.errors.join(', ')}`);
    } else if (itemResult.data) {
      validatedItems.push(itemResult.data);
    }
  }
  
  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? validatedItems : undefined,
    errors
  };
}

/**
 * 安全なデータ変換
 */
export function safeTransform<T>(
  data: unknown,
  validator: Validator<T>,
  context?: string
): T | null {
  try {
    const result = validator(data);
    if (!result.isValid) {
      ErrorHandler.handleError(
        ErrorHandler.createValidationError(
          `Validation failed: ${result.errors.join(', ')}`,
          'data',
          { errors: result.errors, data }
        ),
        context
      );
      return null;
    }
    return result.data || null;
  } catch (error) {
    ErrorHandler.handleError(error, context);
    return null;
  }
} 