import { getRandomNatureImage, getDefaultNatureImage } from '../utils/unsplash';
import { getRandomArchitectureImage, getDefaultArchitectureImage } from '../utils/pexels';

export interface ImageSearchResult {
  url: string;
  source: 'unsplash' | 'pexels' | 'default';
  alt?: string;
  photographer?: string;
}

export interface ImageSearchOptions {
  query?: string;
  category?: 'nature' | 'architecture' | 'building';
  size?: 'small' | 'medium' | 'large';
  fallback?: boolean;
}

export class ImageSearchService {
  private static cache = new Map<string, ImageSearchResult>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5分

  /**
   * 画像を検索・取得する共通メソッド
   */
  static async searchImage(options: ImageSearchOptions = {}): Promise<ImageSearchResult> {
    const cacheKey = this.generateCacheKey(options);
    
    // キャッシュから取得
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let result: ImageSearchResult;

    try {
      switch (options.category) {
        case 'nature':
          result = await this.searchNatureImage(options);
          break;
        case 'architecture':
        case 'building':
          result = await this.searchArchitectureImage(options);
          break;
        default:
          // デフォルトは建築画像
          result = await this.searchArchitectureImage(options);
      }
    } catch (error) {
      console.error('Image search failed:', error);
      result = this.getFallbackImage(options.category);
    }

    // キャッシュに保存
    this.cache.set(cacheKey, result);
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, this.CACHE_DURATION);

    return result;
  }

  /**
   * 自然画像を検索
   */
  private static async searchNatureImage(options: ImageSearchOptions): Promise<ImageSearchResult> {
    try {
      const url = await getRandomNatureImage();
      return {
        url,
        source: 'unsplash',
        alt: '自然風景'
      };
    } catch (error) {
      return this.getFallbackImage('nature');
    }
  }

  /**
   * 建築画像を検索
   */
  private static async searchArchitectureImage(options: ImageSearchOptions): Promise<ImageSearchResult> {
    try {
      const url = await getRandomArchitectureImage();
      return {
        url,
        source: 'pexels',
        alt: '建築物'
      };
    } catch (error) {
      return this.getFallbackImage('architecture');
    }
  }

  /**
   * フォールバック画像を取得
   */
  private static getFallbackImage(category?: string): ImageSearchResult {
    if (category === 'nature') {
      return {
        url: getDefaultNatureImage(),
        source: 'default',
        alt: '自然風景'
      };
    } else {
      return {
        url: getDefaultArchitectureImage(),
        source: 'default',
        alt: '建築物'
      };
    }
  }

  /**
   * キャッシュキーを生成
   */
  private static generateCacheKey(options: ImageSearchOptions): string {
    return `${options.category || 'default'}_${options.query || 'random'}_${options.size || 'medium'}`;
  }

  /**
   * キャッシュをクリア
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * 特定の建物用の画像を取得
   */
  static async getBuildingImage(buildingId: string, buildingName?: string): Promise<ImageSearchResult> {
    return this.searchImage({
      query: buildingName,
      category: 'architecture',
      size: 'medium'
    });
  }

  /**
   * 背景画像を取得
   */
  static async getBackgroundImage(): Promise<ImageSearchResult> {
    return this.searchImage({
      category: 'nature',
      size: 'large'
    });
  }
} 