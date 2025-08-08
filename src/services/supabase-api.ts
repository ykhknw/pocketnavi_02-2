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

    // 最適化: 必要なフィールドのみを選択（建築家テーブルも含める）
    const { data: buildings, error, count } = await supabase
      .from('buildings_table_2')
      .select(`
        building_id,
        uid,
        title,
        titleEn,
        thumbnailUrl,
        youtubeUrl,
        completionYears,
        parentBuildingTypes,
        buildingTypes,
        parentStructures,
        structures,
        prefectures,
        areas,
        location,
        locationEn_from_datasheetChunkEn,
        buildingTypesEn,
        architectDetails,
        lat,
        lng,
        created_at,
        updated_at,
        building_architects!inner(
          architects_table(
            architect_id,
            architectJa,
            architectEn
          )
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

  async getBuildingBySlug(slug: string): Promise<Building> {
    const { data: building, error } = await supabase
      .from('buildings_table_2')
      .select(`
        *,
        building_architects!inner(
          architects_table(*)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) {
      throw new SupabaseApiError(404, error.message);
    }

    return await this.transformBuilding(building);
  }

  async searchBuildings(filters: SearchFilters, page: number = 1, limit: number = 10): Promise<{ buildings: Building[], total: number }> {


    // 建築家フィルターがある場合は専用の最適化クエリを使用
    if (filters.architects && filters.architects.length > 0) {
      return this.searchBuildingsWithArchitects(filters, page, limit);
    }

    // 通常の検索クエリ（最適化版）
    let query = supabase
      .from('buildings_table_2')
      .select(`
        building_id,
        uid,
        title,
        titleEn,
        thumbnailUrl,
        youtubeUrl,
        completionYears,
        parentBuildingTypes,
        buildingTypes,
        parentStructures,
        structures,
        prefectures,
        areas,
        location,
        locationEn_from_datasheetChunkEn,
        buildingTypesEn,
        architectDetails,
        lat,
        lng,
        created_at,
        updated_at,
        building_architects!inner(
          architects_table(
            architect_id,
            architectJa,
            architectEn
          )
        )
      `, { count: 'exact' })
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    // テキスト検索（最適化）
    if (filters.query.trim()) {
      const searchTerm = filters.query.trim();
      query = query.or(`title.ilike.%${searchTerm}%,titleEn.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
    }

    // 建物用途フィルター（最適化）
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      const buildingTypeConditions = filters.buildingTypes.map(type => 
        `buildingTypes.ilike.%${type}%`
      );
      
      if (buildingTypeConditions.length === 1) {
        query = query.or(buildingTypeConditions[0]);
      } else {
        const combinedCondition = buildingTypeConditions.join(',');
        query = query.or(combinedCondition);
      }
    }

    // 都道府県フィルター
    if (filters.prefectures.length > 0) {
      query = query.in('prefectures', filters.prefectures);
    }

    // 動画フィルター
    if (filters.hasVideos) {
      query = query.not('youtubeUrl', 'is', null);
    }

    // 地理位置フィルター（最適化）
    if (filters.currentLocation) {
      const { lat, lng } = filters.currentLocation;
      const radius = filters.radius;
      
      query = query.gte('lat', lat - radius * 0.009)
               .lte('lat', lat + radius * 0.009)
               .gte('lng', lng - radius * 0.011)
               .lte('lng', lng + radius * 0.011);
    }

    // ページネーションの適用
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
    for (const building of buildings || []) {
      try {
        const transformed = await this.transformBuilding(building);
        
        // 写真フィルター（クライアントサイドで処理）
        if (filters.hasPhotos && transformed.photos.length === 0 && !transformed.thumbnailUrl) {
          continue;
        }
        
        transformedBuildings.push(transformed);
      } catch (error) {
        console.warn('Building transformation failed:', error);
        continue;
      }
    }



    return {
      buildings: transformedBuildings,
      total: count || 0
    };
  }

  // 建築家フィルター専用の最適化クエリ
  private async searchBuildingsWithArchitects(filters: SearchFilters, page: number, limit: number): Promise<{ buildings: Building[], total: number }> {
    console.log('🏗️ Using optimized architect search');
    
    // 建築家名で直接検索（JOINを避ける）
    const architectNames = filters.architects || [];
    const searchConditions = architectNames.map(name => 
      `architectDetails.ilike.%${name}%`
    );
    
    let query = supabase
      .from('buildings_table_2')
      .select(`
        building_id,
        uid,
        title,
        titleEn,
        thumbnailUrl,
        youtubeUrl,
        completionYears,
        parentBuildingTypes,
        buildingTypes,
        parentStructures,
        structures,
        prefectures,
        areas,
        location,
        locationEn_from_datasheetChunkEn,
        buildingTypesEn,
        architectDetails,
        lat,
        lng,
        created_at,
        updated_at,
        building_architects!inner(
          architects_table(
            architect_id,
            architectJa,
            architectEn
          )
        )
      `, { count: 'exact' })
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    // 建築家名での検索
    if (searchConditions.length === 1) {
      query = query.or(searchConditions[0]);
    } else {
      const combinedCondition = searchConditions.join(',');
      query = query.or(combinedCondition);
    }

    // その他のフィルターを適用
    if (filters.query.trim()) {
      const searchTerm = filters.query.trim();
      query = query.or(`title.ilike.%${searchTerm}%,titleEn.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);
    }

    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      const buildingTypeConditions = filters.buildingTypes.map(type => 
        `buildingTypes.ilike.%${type}%`
      );
      
      if (buildingTypeConditions.length === 1) {
        query = query.or(buildingTypeConditions[0]);
      } else {
        const combinedCondition = buildingTypeConditions.join(',');
        query = query.or(combinedCondition);
      }
    }

    if (filters.prefectures.length > 0) {
      query = query.in('prefectures', filters.prefectures);
    }

    if (filters.hasVideos) {
      query = query.not('youtubeUrl', 'is', null);
    }

    if (filters.currentLocation) {
      const { lat, lng } = filters.currentLocation;
      const radius = filters.radius;
      
      query = query.gte('lat', lat - radius * 0.009)
               .lte('lat', lat + radius * 0.009)
               .gte('lng', lng - radius * 0.011)
               .lte('lng', lng + radius * 0.011);
    }

    // ページネーション
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data: buildings, error, count } = await query
      .order('building_id', { ascending: false })
      .range(start, end);

    if (error) {
      throw new SupabaseApiError(500, error.message);
    }

    console.log('🏗️ Architect search results:', buildings?.length || 0, 'from total:', count || 0);

    // データ変換
    const transformedBuildings: Building[] = [];
    for (const building of buildings || []) {
      try {
        const transformed = await this.transformBuilding(building);
        
        if (filters.hasPhotos && transformed.photos.length === 0 && !transformed.thumbnailUrl) {
          continue;
        }
        
        transformedBuildings.push(transformed);
      } catch (error) {
        console.warn('Building transformation failed:', error);
        continue;
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
        building_id,
        uid,
        title,
        titleEn,
        thumbnailUrl,
        youtubeUrl,
        completionYears,
        parentBuildingTypes,
        buildingTypes,
        parentStructures,
        structures,
        prefectures,
        areas,
        location,
        locationEn_from_datasheetChunkEn,
        buildingTypesEn,
        architectDetails,
        lat,
        lng,
        created_at,
        updated_at,
        building_architects!inner(
          architects_table(
            architect_id,
            architectJa,
            architectEn
          )
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

    // 建築家データの変換（architects_tableから取得）
    let architects: Array<{ architect_id: number; architectJa: string; architectEn: string; websites: any[] }> = [];
    
    // building_architectsテーブルから建築家データを取得
    if (data.building_architects && Array.isArray(data.building_architects)) {
      architects = data.building_architects.map((architectRelation: any) => {
        const architect = architectRelation.architects_table;
        return {
          architect_id: architect.architect_id,
          architectJa: architect.architectJa || '',
          architectEn: architect.architectEn || '',
          websites: []
        };
      });
    }
    
    // フォールバック: architectDetailsフィールドから建築家名を抽出
    if (architects.length === 0 && data.architectDetails) {
      const architectNames = parseFullWidthSpaceSeparated(data.architectDetails as string);
      architects = architectNames.map((name, index) => ({
        architect_id: index + 1,
        architectJa: name,
        architectEn: name,
        websites: []
      }));
    }

    // 外部写真URLの生成（最適化版）
    const generatePhotosFromUid = async (uid: string): Promise<Photo[]> => {
      if (!uid) return [];
      
      // 画像の存在確認を一時的に無効化（後で実装予定）

      return [];
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