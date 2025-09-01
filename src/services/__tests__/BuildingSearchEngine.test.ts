import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BuildingSearchEngine } from '../BuildingSearchEngine';
import { SearchFilters } from '../../types';

// クエリチェーンのモックを作成
const createMockQueryChain = () => {
  const mockChain = {
    select: vi.fn(() => mockChain),
    not: vi.fn(() => mockChain),
    or: vi.fn(() => mockChain),
    in: vi.fn(() => mockChain),
    eq: vi.fn(() => mockChain),
    gte: vi.fn(() => mockChain),
    lte: vi.fn(() => mockChain),
    range: vi.fn(() => mockChain),
    order: vi.fn(() => mockChain)
  };
  
  // Promise.resolve を適切に設定
  mockChain.or = vi.fn(() => Promise.resolve({
    data: [],
    error: null,
    count: 0
  }));
  
  mockChain.in = vi.fn(() => Promise.resolve({
    data: [],
    error: null,
    count: 0
  }));
  
  return mockChain;
};

// Supabaseのモック
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => createMockQueryChain())
  }
}));

describe('BuildingSearchEngine', () => {
  let searchEngine: BuildingSearchEngine;
  let mockFilters: SearchFilters;

  beforeEach(() => {
    searchEngine = new BuildingSearchEngine();
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

  describe('buildBaseQuery', () => {
    it('should build base query correctly', () => {
      const query = searchEngine.buildBaseQuery();
      expect(query).toBeDefined();
    });
  });

  describe('buildTextSearchConditions', () => {
    it('should build Japanese search conditions', () => {
      const conditions = searchEngine.buildTextSearchConditions('安藤忠雄', 'ja');
      expect(conditions).toContain('title.ilike.%安藤忠雄%');
      expect(conditions).toContain('buildingTypes.ilike.%安藤忠雄%');
      expect(conditions).toContain('location.ilike.%安藤忠雄%');
    });

    it('should build English search conditions', () => {
      const conditions = searchEngine.buildTextSearchConditions('Tadao Ando', 'en');
      expect(conditions).toContain('titleEn.ilike.%Tadao Ando%');
      expect(conditions).toContain('buildingTypesEn.ilike.%Tadao Ando%');
      expect(conditions).toContain('locationEn_from_datasheetChunkEn.ilike.%Tadao Ando%');
    });
  });

  describe('searchBuildingIdsByArchitectName', () => {
    it('should handle architect search without errors', async () => {
      const result = await searchEngine.searchBuildingIdsByArchitectName('安藤忠雄');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array on search error', async () => {
      const result = await searchEngine.searchBuildingIdsByArchitectName('');
      expect(result).toEqual([]);
    });
  });

  describe('applyFiltersToQuery', () => {
    it('should apply filters without errors', async () => {
      const mockQuery = {
        in: vi.fn(() => mockQuery),
        or: vi.fn(() => mockQuery),
        not: vi.fn(() => mockQuery),
        eq: vi.fn(() => mockQuery)
      };

      mockFilters.buildingTypes = ['美術館'];
      mockFilters.prefectures = ['東京都'];
      mockFilters.hasVideos = true;
      mockFilters.completionYear = 1995;

      const result = await searchEngine.applyFiltersToQuery(mockQuery, mockFilters, 'ja');
      expect(result).toBeDefined();
    });

    it('should handle empty filters', async () => {
      const mockQuery = {
        in: vi.fn(() => mockQuery),
        or: vi.fn(() => mockQuery),
        not: vi.fn(() => mockQuery),
        eq: vi.fn(() => mockQuery)
      };

      const result = await searchEngine.applyFiltersToQuery(mockQuery, mockFilters, 'ja');
      expect(result).toBeDefined();
    });
  });
});
