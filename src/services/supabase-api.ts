import { PhotoChecker } from '../utils/photo-checker';
import { supabase } from '../lib/supabase'
import { Building, SearchFilters, Architect, Photo } from '../types'

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

  async searchBuildings(
    filters: SearchFilters,
    page: number = 1,
    limit: number = 10,
    language: 'ja' | 'en' = 'ja'
  ): Promise<{ buildings: Building[], total: number }> {
    let query = supabase
      .from('buildings_table_2')
      .select(`
        *,
        building_architects!inner(
          architects_table!inner(*)
        )
      `, { count: 'exact' })
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    // テキスト検索
    if (filters.query.trim()) {
      query = query.or(`title.ilike.%${filters.query}%,titleEn.ilike.%${filters.query}%,location.ilike.%${filters.query}%`);
    }

    // 建築家フィルター（言語切替対応 / 関連テーブルの列を参照）
    if (filters.architects && filters.architects.length > 0) {
      const column = language === 'ja' ? 'architectJa' : 'architectEn';
      const conditions = filters.architects.map((name) => {
        const escaped = String(name).replace(/[,]/g, '');
        return `${column}.ilike.*${escaped}*`;
      });
      if (conditions.length > 0) {
        // 直接 architects_table を foreignTable として指定し、その列に対して or 条件を適用
        query = (query as any).or(conditions.join(','), { foreignTable: 'building_architects.architects_table' });
      }
    }

    // 建物用途フィルター
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      console.log('🏢 Applying building type filters:', filters.buildingTypes);
      const buildingTypeConditions = filters.buildingTypes.map(type => 
        `buildingTypes.ilike.%${type}%`
      );
      console.log('🏢 Building type conditions:', buildingTypeConditions);
      query = query.or(buildingTypeConditions.join(','));
    }

    // 都道府県フィルター（言語切替対応）
    if (filters.prefectures.length > 0) {
      const column = language === 'ja' ? 'prefectures' : 'prefecturesEn';
      query = query.in(column as any, filters.prefectures);
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

    console.log('🔍 Search results:', { 
      buildingsCount: buildings?.length || 0, 
      totalCount: count || 0,
      error: error?.message 
    });

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
      .rpc('nearby_buildings', {
        lat,
        lng,
        radius_km: radius
      });

    if (error) {
      // フォールバック: 簡易的な範囲検索
      return this.searchBuildings({
        query: '',
        radius,
        architects: [],
        buildingTypes: [],
        prefectures: [],
        areas: [],
        hasPhotos: false,
        hasVideos: false,
        currentLocation: { lat, lng }
      }).then(result => result.buildings);
    }

    return buildings?.map(this.transformBuilding) || [];
  }

  // いいね機能
  async likeBuilding(buildingId: number): Promise<{ likes: number }> {
    const { data, error } = await supabase
      .rpc('increment_building_likes', { building_id: buildingId });

    if (error) {
      throw new SupabaseApiError(500, error.message);
    }

    return { likes: data };
  }

  async likePhoto(photoId: number): Promise<{ likes: number }> {
    const { data, error } = await supabase
      .rpc('increment_photo_likes', { photo_id: photoId });

    if (error) {
      throw new SupabaseApiError(500, error.message);
    }

    return { likes: data };
  }

  // 建築家関連
  async getArchitects(): Promise<Architect[]> {
    const { data: architects, error } = await supabase
      .from('architects_table')
      .select('*')
      .order('architectJa');

    if (error) {
      throw new SupabaseApiError(500, error.message);
    }

    return architects?.map(arch => ({
      architect_id: arch.architect_id,
      architectJa: arch.architectJa,
      architectEn: arch.architectEn || arch.architectJa,
      websites: [] // TODO: architect_websites_3テーブルから取得
    })) || [];
  }

  // 建築家のウェブサイト情報を取得
  async getArchitectWebsites(architectId: number) {
    const { data: websites, error } = await supabase
      .from('architect_websites_3')
      .select('*')
      .eq('architect_id', architectId);

    if (error) {
      return [];
    }

    return websites?.map(site => ({
      website_id: site.website_id,
      url: site.url,
      title: site.title,
      invalid: site.invalid,
      architectJa: site.architectJa,
      architectEn: site.architectEn
    })) || [];
  }

  // 統計・検索候補
  async getSearchSuggestions(query: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('buildings_table_2')
      .select('title, titleEn')
      .or(`title.ilike.%${query}%,titleEn.ilike.%${query}%`)
      .limit(10);

    if (error) {
      return [];
    }

    const suggestions = new Set<string>();
    data?.forEach(item => {
      if (item.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(item.title);
      }
      if (item.titleEn?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(item.titleEn);
      }
    });

    return Array.from(suggestions);
  }

  async getPopularSearches(): Promise<{ query: string; count: number }[]> {
    // 検索ログテーブルがある場合
    const { data, error } = await supabase
      .from('search_logs')
      .select('query, count')
      .order('count', { ascending: false })
      .limit(10);

    if (error) {
      // フォールバック: 固定の人気検索
      return [
        { query: '安藤忠雄', count: 45 },
        { query: '美術館', count: 38 },
        { query: '東京', count: 32 },
        { query: '現代建築', count: 28 }
      ];
    }

    return data || [];
  }

  // ヘルスチェック
  async healthCheck(): Promise<{ status: string; database: string }> {
    const { data, error } = await supabase
      .from('buildings_table_2')
      .select('count')
      .limit(1);

    if (error) {
      throw new SupabaseApiError(500, 'Database connection failed');
    }

    return {
      status: 'ok',
      database: 'supabase'
    };
  }

  // データ変換ヘルパー
  private async transformBuilding(data: any): Promise<Building> {
    console.log('Transforming building data:', data);
    
    // 位置データのバリデーション - lat, lngどちらかがNULLの場合はスキップ
    if (data.lat === null || data.lng === null || 
        typeof data.lat !== 'number' || typeof data.lng !== 'number' ||
        isNaN(data.lat) || isNaN(data.lng)) {
      throw new Error(`Invalid coordinates for building ${data.building_id}: lat=${data.lat}, lng=${data.lng}`);
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
    let architects: any[] = [];
    if (data.building_architects && data.building_architects.length > 0) {
      // データベースから取得した建築家データ
      architects = data.building_architects.map((ba: any) => ({
        architect_id: ba.architects_table?.architect_id || 0,
        architectJa: ba.architects_table?.architectJa || '',
        architectEn: ba.architects_table?.architectEn || ba.architects_table?.architectJa || '',
        websites: []
      }));
    } else if (data.architectDetails) {
      // architectDetailsフィールドから建築家名を抽出（全角スペース区切り）
      const architectNames = parseFullWidthSpaceSeparated(data.architectDetails);
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
        building_id: data.building_id,
        url: photo.url,
        thumbnail_url: photo.url,
        likes: 0,
        created_at: new Date().toISOString()
      }));
    };

    // 写真データを非同期で取得
    const photos = await generatePhotosFromUid(data.uid);
    
    return {
      id: data.building_id,
      uid: data.uid,
      slug: data.slug, // slugフィールドを追加
      title: data.title,
      titleEn: data.titleEn || data.title,
      thumbnailUrl: data.thumbnailUrl || '',
      youtubeUrl: data.youtubeUrl || '',
      completionYears: parseYear(data.completionYears),
      parentBuildingTypes: parseCommaSeparated(data.parentBuildingTypes),
      buildingTypes: parseSlashSeparated(data.buildingTypes),
      parentStructures: parseCommaSeparated(data.parentStructures),
      structures: parseCommaSeparated(data.structures),
      prefectures: data.prefectures,
      prefecturesEn: data.prefecturesEn || null,
      areas: data.areas,
      location: data.location,
      locationEn: data.locationEn_from_datasheetChunkEn || data.location,
      buildingTypesEn: parseSlashSeparated(data.buildingTypesEn),
      architectDetails: data.architectDetails || '',
      lat: parseFloat(data.lat) || 0,
      lng: parseFloat(data.lng) || 0,
      architects: architects,
      photos: photos, // 実際に存在する写真のみ
      likes: 0, // likesカラムがない場合は0
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  }
}

export const supabaseApiClient = new SupabaseApiClient();