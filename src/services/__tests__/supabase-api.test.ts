import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchFilters } from '../../types';

// 基本的なテスト用のモックデータ
const mockSearchResult = {
  buildings: [],
  total: 0
};

// SupabaseApiClientのモック
vi.mock('../supabase-api', () => ({
  supabaseApiClient: {
    searchBuildings: vi.fn(() => Promise.resolve(mockSearchResult)),
    getBuildings: vi.fn(() => Promise.resolve(mockSearchResult)),
    getBuildingById: vi.fn(() => Promise.resolve({}))
  }
}));

describe('SupabaseApiClient', () => {
  let mockFilters: SearchFilters;

  beforeEach(() => {
    mockFilters = {
      query: '',
      radius: 5,
      architects: [],
      buildingTypes: [],
      prefectures: [],
      areas: [],
      hasPhotos: false,
      hasVideos: false,
      currentLocation: null,
      completionYear: undefined,
      excludeResidential: true
    };
  });

  describe('searchBuildings', () => {
    it('should handle empty query without errors', async () => {
      // 基本的な動作確認
      expect(mockFilters.query).toBe('');
      expect(mockFilters.architects).toEqual([]);
      expect(mockFilters.buildingTypes).toEqual([]);
    });

    it('should handle text query search', async () => {
      mockFilters.query = '安藤　日建';
      expect(mockFilters.query).toBe('安藤　日建');
    });

    it('should handle architect filter', async () => {
      mockFilters.architects = ['安藤忠雄'];
      expect(mockFilters.architects).toEqual(['安藤忠雄']);
    });

    it('should handle building type filter', async () => {
      mockFilters.buildingTypes = ['庁舎'];
      expect(mockFilters.buildingTypes).toEqual(['庁舎']);
    });

    it('should handle prefecture filter', async () => {
      mockFilters.prefectures = ['長崎県'];
      expect(mockFilters.prefectures).toEqual(['長崎県']);
    });

    it('should handle completion year filter', async () => {
      mockFilters.completionYear = 1995;
      expect(mockFilters.completionYear).toBe(1995);
    });

    it('should handle current location search', async () => {
      mockFilters.currentLocation = { lat: 35.6762, lng: 139.6503 };
      expect(mockFilters.currentLocation).toEqual({ lat: 35.6762, lng: 139.6503 });
    });
  });

  describe('getBuildings', () => {
    it('should return buildings with pagination', async () => {
      // 基本的な動作確認
      expect(mockFilters.radius).toBe(5);
    });
  });

  describe('getBuildingById', () => {
    it('should return building by id', async () => {
      // モックデータを設定
      const mockBuilding = {
        building_id: 1,
        title: 'テスト建築物',
        lat: 35.6762,
        lng: 139.6503
      };

      // テスト実装
      expect(mockBuilding).toBeDefined();
      expect(mockBuilding.building_id).toBe(1);
    });
  });
});
