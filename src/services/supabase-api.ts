import { PhotoChecker } from '../utils/photo-checker';
import { supabase } from '../lib/supabase'
import { Building, SearchFilters, Architect, Photo } from '../types'
import { isSupabaseBuildingData, isValidCoordinate } from '../utils/type-guards';
import { ErrorHandler } from '../utils/error-handling';

export class SupabaseApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'SupabaseApiError';
  }
}

class SupabaseApiClient {
  // 建築物関連API
  async getBuildings(page: number = 1, limit: number = 10): Promise<{ buildings: Building[], total: number }> {
    console.log('Supabase getBuildings called:', { page, limit });
    
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data: buildings, error, count } = await supabase
      .from('buildings_table_2')
      .select(`
        *,
        building_architects(
          architects_table!inner(*)
        )
      `)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .range(start, end)
      .order('building_id', { ascending: false });

    console.log('Supabase response:', { buildings: buildings?.length, error, count });

    if (error) {
      console.error('Supabase error:', error);
      throw new SupabaseApiError(500, error.message);
    }

    // データ変換
    const transformedBuildings: Building[] = [];
    if (buildings) {
      for (const building of buildings) {
        try {
          const transformed = await this.transformBuilding(building);
          transformedBuildings.push(transformed);
        } catch (error) {
          console.warn('Skipping building due to invalid data:', error);
          // 無効なデータの建築物はスキップ
        }
      }
    }
    console.log('Transformed buildings:', transformedBuildings.length);

    return {
      buildings: transformedBuildings,
      total: count || 0
    };
  }

  async getBuildingById(id: number): Promise<Building> {
    const { data: building, error } = await supabase
      .from('buildings_table_2')
      .select(`
        *,
        building_architects!inner(
          architects_table(*)
        )
      `)
      .eq('building_id', id)
      .single();

    if (error) {
      throw new SupabaseApiError(404, error.message);
    }

    return await this.transformBuilding(building);
  }

  async searchBuildings(filters: SearchFilters, page: number = 1, limit: number = 10): Promise<{ buildings: Building[], total: number }> {
    let query = supabase
      .from('buildings_table_2')
      .select(`
        *,
        building_architects!inner(
          architects_table(*)
        )
      `, { count: 'exact' })
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    // テキスト検索
    if (filters.query.trim()) {
      query = query.or(`title.ilike.%${filters.query}%,titleEn.ilike.%${filters.query}%,location.ilike.%${filters.query}%`);
    }

    // 都道府県フィルター
    if (filters.prefectures.length > 0) {
      query = query.in('prefectures', filters.prefectures);
    }

    // 動画フィルター
    if (filters.hasVideos) {
      query = query.not('youtubeUrl', 'is', null);
    }

    // 地理位置フィルター（PostGISを使用する場合）
    if (filters.currentLocation) {
      // 簡易的な距離計算（より正確にはPostGIS使用）
      const { lat, lng } = filters.currentLocation;
      const radius = filters.radius;
      
      query = query.gte('lat', lat - radius * 0.009)
               .lte('lat', lat + radius * 0.009)
               .gte('lng', lng - radius * 0.011)
               .lte('lng', lng + radius * 0.011);
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data: buildings, error, count } = await query
      .order('building_id', { ascending: false })
      .range(start, end);

    if (error) {
      throw new SupabaseApiError(500, error.message);
    }

    // データ変換と写真フィルター
    const transformedBuildings: Building[] = [];
    if (buildings) {
      for (const building of buildings) {
        try {
          const transformed = await this.transformBuilding(building);
          
          // 写真フィルター（変換後に適用）
          if (filters.hasPhotos && transformed.photos.length === 0) {
            continue; // 写真がない場合はスキップ
          }
          
          transformedBuildings.push(transformed);
        } catch (error) {
          console.warn('Skipping building due to invalid data:', error);
          // 無効なデータの建築物はスキップ
        }
      }
    }

    return {
      buildings: transformedBuildings,
      total: count || 0
    };
  }

  async getNearbyBuildings(lat: number, lng: number, radius: number): Promise<Building[]> {
    // PostGISを使用した地理空間検索（Supabaseで有効化必要）
    const { data: buildings, error } = await supabase
      .from('buildings_table_2')
      .select(`
        *,
        building_architects(
          architects_table(*)
        )
      `)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .gte('lat', lat - radius * 0.009)
      .lte('lat', lat + radius * 0.009)
      .gte('lng', lng - radius * 0.011)
      .lte('lng', lng + radius * 0.011)
      .order('building_id', { ascending: false });

    if (error) {
      throw new SupabaseApiError(500, error.message);
    }

    const transformedBuildings: Building[] = [];
    if (buildings) {
      for (const building of buildings) {
        try {
          const transformed = await this.transformBuilding(building);
          transformedBuildings.push(transformed);
        } catch (error) {
          console.warn('Skipping building due to invalid data:', error);
        }
      }
    }

    return transformedBuildings;
  }

  async likeBuilding(buildingId: number): Promise<{ likes: number }> {
    // 実際の実装では、likesテーブルを更新する
    return { likes: 1 };
  }

  async likePhoto(photoId: number): Promise<{ likes: number }> {
    // 実際の実装では、photo_likesテーブルを更新する
    return { likes: 1 };
  }

  async getArchitects(): Promise<Architect[]> {
    const { data: architects, error } = await supabase
      .from('architects_table')
      .select('*')
      .order('architect_id', { ascending: true });

    if (error) {
      throw new SupabaseApiError(500, error.message);
    }

    return architects || [];
  }

  async getArchitectWebsites(architectId: number) {
    const { data: websites, error } = await supabase
      .from('architect_websites_3')
      .select('*')
      .eq('architect_id', architectId)
      .eq('invalid', false)
      .order('website_id', { ascending: true });

    if (error) {
      throw new SupabaseApiError(500, error.message);
    }

    return websites || [];
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];

    const { data: suggestions, error } = await supabase
      .from('buildings_table_2')
      .select('title, titleEn')
      .or(`title.ilike.%${query}%,titleEn.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('Search suggestions error:', error);
      return [];
    }

    const uniqueSuggestions = new Set<string>();
    suggestions?.forEach(item => {
      if (item.title) uniqueSuggestions.add(item.title);
      if (item.titleEn) uniqueSuggestions.add(item.titleEn);
    });

    return Array.from(uniqueSuggestions).slice(0, 10);
  }

  async getPopularSearches(): Promise<{ query: string; count: number }[]> {
    // 実際の実装では、検索履歴テーブルから集計する
    return [
      { query: '美術館', count: 150 },
      { query: '図書館', count: 120 },
      { query: '駅舎', count: 100 },
      { query: 'オフィスビル', count: 80 },
      { query: '住宅', count: 60 }
    ];
  }

  async healthCheck(): Promise<{ status: string; database: string }> {
    try {
      const { data, error } = await supabase
        .from('buildings_table_2')
        .select('building_id')
        .limit(1);

      if (error) {
        return { status: 'error', database: error.message };
      }

      return { status: 'healthy', database: 'connected' };
    } catch (error) {
      return { status: 'error', database: 'connection failed' };
    }
  }

  private async transformBuilding(data: Record<string, unknown>): Promise<Building> {
    console.log('Transforming building data:', data);
    
    // 型ガードでデータの妥当性をチェック
    if (!isSupabaseBuildingData(data)) {
      throw ErrorHandler.createValidationError(
        'Invalid building data structure',
        'building',
        { received: data }
      );
    }
    
    // 座標の妥当性をチェック
    if (!isValidCoordinate(data.lat, data.lng)) {
      throw ErrorHandler.createValidationError(
        'Invalid coordinates',
        'coordinates',
        { lat: data.lat, lng: data.lng }
      );
    }

    // buildingTypesなどのカンマ区切り文字列を配列に変換
    const parseCommaSeparated = (str: string | null): string[] => {
      if (!str) return [];
      return str.split(',').map(s => s.trim()).filter(s => s.length > 0);
    };

    // スラッシュ区切り文字列を配列に変換（建物用途用）
    const parseSlashSeparated = (str: string | null): string[] => {
      if (!str) return [];
      return str.split('/').map(s => s.trim()).filter(s => s.length > 0);
    };

    // 全角スペース区切り文字列を配列に変換（建築家用）
    const parseFullWidthSpaceSeparated = (str: string | null): string[] => {
      if (!str) return [];
      return str.split('　').map(s => s.trim()).filter(s => s.length > 0);
    };

    // completionYearsを数値に変換
    const parseYear = (year: string | null): number => {
      if (!year) return new Date().getFullYear();
      const parsed = parseInt(year, 10);
      return isNaN(parsed) ? new Date().getFullYear() : parsed;
    };

    // 建築家データの変換（全角スペース区切りに対応）
    let architects: Array<{ architect_id: number; architectJa: string; architectEn: string; websites: any[] }> = [];
    if (data.building_architects && Array.isArray(data.building_architects) && data.building_architects.length > 0) {
      // データベースから取得した建築家データ
      architects = (data.building_architects as Record<string, unknown>[]).map((ba: Record<string, unknown>) => ({
        architect_id: (ba.architects_table as Record<string, unknown>)?.architect_id as number || 0,
        architectJa: (ba.architects_table as Record<string, unknown>)?.architectJa as string || '',
        architectEn: (ba.architects_table as Record<string, unknown>)?.architectEn as string || (ba.architects_table as Record<string, unknown>)?.architectJa as string || '',
        websites: []
      }));
    } else if (data.architectDetails) {
      // architectDetailsフィールドから建築家名を抽出（全角スペース区切り）
      const architectNames = parseFullWidthSpaceSeparated(data.architectDetails as string);
      architects = architectNames.map((name, index) => ({
        architect_id: index + 1,
        architectJa: name,
        architectEn: name,
        websites: []
      }));
    }

    // 外部写真URLの生成
    const generatePhotosFromUid = async (uid: string): Promise<Photo[]> => {
      if (!uid) return [];
      
      // 実際に存在する写真のみを取得
      const existingPhotos = await PhotoChecker.getExistingPhotos(uid);
      
      return existingPhotos.map((photo, index) => ({
        id: index + 1,
        building_id: data.building_id as number,
        url: photo.url,
        thumbnail_url: photo.url,
        likes: 0,
        created_at: new Date().toISOString()
      }));
    };

    // 写真データを非同期で取得
    const photos = await generatePhotosFromUid(data.uid as string);
    
    return {
      id: data.building_id as number,
      uid: data.uid as string,
      title: data.title as string,
      titleEn: (data.titleEn as string) || (data.title as string),
      thumbnailUrl: (data.thumbnailUrl as string) || '',
      youtubeUrl: (data.youtubeUrl as string) || '',
      completionYears: parseYear(data.completionYears as string),
      parentBuildingTypes: parseCommaSeparated(data.parentBuildingTypes as string),
      buildingTypes: parseSlashSeparated(data.buildingTypes as string),
      parentStructures: parseCommaSeparated(data.parentStructures as string),
      structures: parseCommaSeparated(data.structures as string),
      prefectures: data.prefectures as string,
      areas: data.areas as string,
      location: data.location as string,
      locationEn: (data.locationEn_from_datasheetChunkEn as string) || (data.location as string),
      buildingTypesEn: parseSlashSeparated(data.buildingTypesEn as string),
      architectDetails: (data.architectDetails as string) || '',
      lat: parseFloat(String(data.lat)) || 0,
      lng: parseFloat(String(data.lng)) || 0,
      architects: architects,
      photos: photos, // 実際に存在する写真のみ
      likes: 0, // likesカラムがない場合は0
      created_at: (data.created_at as string) || new Date().toISOString(),
      updated_at: (data.updated_at as string) || new Date().toISOString()
    };
  }
}

export const supabaseApiClient = new SupabaseApiClient();