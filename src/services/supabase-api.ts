
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
          architects_table(*)
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
    // 🔍 検索開始時のフィルター全体ログ
    console.log('🔍 検索開始 - フィルター全体:', {
      query: filters.query,
      architects: filters.architects,
      buildingTypes: filters.buildingTypes,
      prefectures: filters.prefectures,
      language,
      page,
      limit,
      currentLocation: filters.currentLocation,
      hasPhotos: filters.hasPhotos,
      hasVideos: filters.hasVideos,
      completionYear: filters.completionYear,
      excludeResidential: filters.excludeResidential
    });

    // 地点検索が有効な場合は、PostGISの空間関数を使用
    if (filters.currentLocation) {
      return this.searchBuildingsWithDistance(filters, page, limit, language);
    }

         let query = supabase
       .from('buildings_table_2')
       .select(`
         *,
         building_architects(
           architects_table(*)
         )
       `, { count: 'exact' })
       .not('lat', 'is', null)
       .not('lng', 'is', null);

           // 🔍 建築家名検索の結果を保存する変数（OR条件統合用）
      let architectBuildingIds: number[] = [];

         // テキスト検索（建築家名含む）- 全ての条件をOR条件に統合
     if (filters.query.trim()) {
       // 全ての検索条件を配列に格納
       const allConditions: string[] = [];
       
       // メインテーブルの検索条件（言語対応）
       if (language === 'ja') {
         allConditions.push(`title.ilike.%${filters.query}%`);
         allConditions.push(`buildingTypes.ilike.%${filters.query}%`);
         allConditions.push(`location.ilike.%${filters.query}%`);
       } else {
         allConditions.push(`titleEn.ilike.%${filters.query}%`);
         allConditions.push(`buildingTypesEn.ilike.%${filters.query}%`);
         allConditions.push(`locationEn_from_datasheetChunkEn.ilike.%${filters.query}%`);
       }
       
       console.log('🔍 検索条件（メイン）:', { 
         query: filters.query, 
         language,
         allConditions
       });
       
       // 建築家名の検索条件（関連テーブル）
       try {
         console.log('🔍 建築家名検索開始:', filters.query);
         
         // ステップ1: 建築家名で検索して建築家IDを取得
         const { data: architects, error: architectError } = await supabase
           .from('architects_table')
           .select('architect_id')
           .or(`architectJa.ilike.%${filters.query}%,architectEn.ilike.%${filters.query}%`);
         
         if (architectError) {
           console.warn('🔍 建築家名検索エラー（ステップ1）:', architectError);
         } else if (architects && architects.length > 0) {
           const architectIds = architects.map(a => a.architect_id);
           console.log('🔍 建築家名検索結果（architect_id）:', architectIds.length, '件');
           
           // ステップ2: 建築家IDから建築物IDを取得
           const { data: buildingIds, error: buildingError } = await supabase
             .from('building_architects')
             .select('building_id')
             .in('architect_id', architectIds);
           
           if (buildingError) {
             console.warn('🔍 建築家名検索エラー（ステップ2）:', buildingError);
           } else if (buildingIds && buildingIds.length > 0) {
             const allBuildingIds = buildingIds.map(b => b.building_id);
             console.log('🔍 建築家名検索結果（building_id）:', allBuildingIds.length, '件');
             
             // 建築家名検索結果を保存
             architectBuildingIds = allBuildingIds;
             
             // 建築家名検索条件をOR条件に追加
             allConditions.push(`building_id.in.(${allBuildingIds.join(',')})`);
             
             console.log('🔍 建築家名検索クエリ適用後（OR条件統合）:', {
               allConditions,
               architectBuildingIds: architectBuildingIds.length
             });
           }
         }
       } catch (error) {
         console.warn('🔍 建築家名検索でエラー:', error);
       }
       
       // 全ての条件をOR条件として適用
       if (allConditions.length > 0) {
         query = (query as any).or(allConditions.join(','));
         console.log('🔍 統合されたOR条件適用完了:', allConditions.join(','));
       }
     }

    // 建築家フィルター（言語切替対応 / 関連テーブルの列を参照）
    if (filters.architects && filters.architects.length > 0) {
      console.log('🔍 建築家フィルター開始:', {
        filters: filters.architects,
        language,
        rawFilters: filters
      });
      
      try {
        // ステップ1: 建築家名で検索して建築家IDを取得
        const architectConditions = filters.architects.map(name => {
          const escaped = String(name).replace(/[,]/g, '');
          return language === 'ja' 
            ? `architectJa.ilike.*${escaped}*`
            : `architectEn.ilike.*${escaped}*`;
        });
        
        const { data: architects, error: architectError } = await supabase
          .from('architects_table')
          .select('architect_id')
          .or(architectConditions.join(','));
        
        if (architectError) {
          console.warn('🔍 建築家フィルター検索エラー（ステップ1）:', architectError);
        } else if (architects && architects.length > 0) {
          const architectIds = architects.map(a => a.architect_id);
          console.log('🔍 建築家フィルター検索結果（architect_id）:', architectIds.length, '件');
          
          // ステップ2: 建築家IDから建築物IDを取得
          const { data: buildingIds, error: buildingError } = await supabase
            .from('building_architects')
            .select('building_id')
            .in('architect_id', architectIds);
          
          if (buildingError) {
            console.warn('🔍 建築家フィルター検索エラー（ステップ2）:', buildingError);
          } else if (buildingIds && buildingIds.length > 0) {
            const filterBuildingIds = buildingIds.map(b => b.building_id);
            console.log('🔍 建築家フィルター検索結果（building_id）:', filterBuildingIds.length, '件');
            
            // 建築家フィルター条件を直接クエリに適用
            query = (query as any).in('building_id', filterBuildingIds);
            
            console.log('🔍 建築家フィルター条件適用完了:', {
              filterBuildingIds: filterBuildingIds.length,
              appliedQuery: query
            });
          }
        }
      } catch (error) {
        console.warn('🔍 建築家フィルターでエラー:', error);
      }
    }

    // 建物用途フィルター（言語切替対応）
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      const column = language === 'ja' ? 'buildingTypes' : 'buildingTypesEn';
      const buildingTypeConditions = filters.buildingTypes.map(type => 
        `${column}.ilike.*${String(type).replace(/[,]/g, '')}*`
      );
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

    // 建築年フィルター
    if (typeof filters.completionYear === 'number' && !isNaN(filters.completionYear)) {
      query = query.eq('completionYears', filters.completionYear);
    }

         // 住宅系の除外（デフォルト有効）
     if (filters.excludeResidential !== false) {
       query = query
         .not('buildingTypes', 'eq', '住宅')
         .not('buildingTypesEn', 'eq', 'housing');
     }

                                               // 🔍 建築家名検索結果は既にOR条件に統合済み（重複なし）
        console.log('🔍 建築家名検索結果の統合状況:', {
          architectBuildingIds_exists: !!architectBuildingIds,
          architectBuildingIds_length: architectBuildingIds?.length,
          architectBuildingIds_type: typeof architectBuildingIds,
          architectBuildingIds_isArray: Array.isArray(architectBuildingIds),
          sample_ids: architectBuildingIds?.slice(0, 5),
          note: 'OR条件に統合済みのため、追加のIN条件は不要'
        });

     console.log('🔍 最終的なクエリオブジェクト（実行直前）:', query);

         const start = (page - 1) * limit;
     const end = start + limit - 1;

     // 🔍 最終クエリの詳細ログを追加
     console.log('🔍 最終クエリ条件:', {
       mainConditions: filters.query.trim() ? [
         `title.ilike.%${filters.query}%`,
         `titleEn.ilike.%${filters.query}%`,
         `location.ilike.%${filters.query}%`
       ] : [],
       architectBuildingIds: filters.query.trim() ? '取得済み' : 'なし',
       finalQuery: query,
       page,
       limit,
       start,
       end
     });

     console.log('🔍 最終クエリ実行前:', {
       page,
       limit,
       start,
       end,
       queryObject: query,
       filters: {
         query: filters.query,
         architects: filters.architects,
         buildingTypes: filters.buildingTypes,
         prefectures: filters.prefectures
       }
     });

     const { data: buildings, error, count } = await query
       .order('building_id', { ascending: false })
       .range(start, end);

     // 🔍 Supabase最終レスポンスの詳細ログを追加
     console.log('🔍 Supabase最終レスポンス:', { 
       data: buildings?.length || 0, 
       count, 
       error: error?.message,
       sampleData: buildings?.slice(0, 2).map(b => ({
         building_id: b.building_id,
         title: b.title,
         location: b.location
       })) || []
     });

         console.log('🔍 Search results:', { 
       buildingsCount: buildings?.length || 0, 
       totalCount: count || 0,
       error: error?.message,
       filters: {
         query: filters.query,
         architects: filters.architects,
         buildingTypes: filters.buildingTypes,
         prefectures: filters.prefectures
       },
       // 🔍 詳細な検索結果ログを追加
       queryDetails: {
         page,
         limit,
         start,
         end,
         rangeApplied: `${start}-${end}`
       },
       // 🔍 最初の数件の建築物IDを表示
       sampleBuildingIds: buildings?.slice(0, 3).map(b => b.building_id) || []
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

  // 地点検索用の新しい関数：PostGISの空間関数を使用
  private async searchBuildingsWithDistance(
    filters: SearchFilters,
    page: number = 1,
    limit: number = 10,
    language: 'ja' | 'en' = 'ja'
  ): Promise<{ buildings: Building[], total: number }> {
    const { lat, lng } = filters.currentLocation!;
    const radius = filters.radius;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    console.log('🔍 PostGIS検索開始:', { 
      lat, lng, radius, page, limit, start, end,
      filters: {
        query: filters.query,
        architects: filters.architects,
        buildingTypes: filters.buildingTypes,
        prefectures: filters.prefectures,
        hasVideos: filters.hasVideos,
        completionYear: filters.completionYear,
        excludeResidential: filters.excludeResidential
      }
    });

    try {
      // PostGISの空間関数を使用して距離順にソート
      const { data: buildings, error, count } = await supabase
        .rpc('search_buildings_with_distance', {
          search_lat: lat,
          search_lng: lng,
          search_radius: radius,
          search_query: filters.query.trim() || null,
          search_architects: (filters.architects && filters.architects.length > 0) ? filters.architects : null,
          search_building_types: filters.buildingTypes?.length > 0 ? filters.buildingTypes : null,
          search_prefectures: filters.prefectures?.length > 0 ? filters.prefectures : null,
          search_has_videos: filters.hasVideos || false,
          search_completion_year: typeof filters.completionYear === 'number' && !isNaN(filters.completionYear) ? filters.completionYear : null,
          search_exclude_residential: filters.excludeResidential !== false,
          search_language: language,
          page_start: start,
          page_limit: limit
        });

      if (error) {
        console.warn('PostGIS RPC failed, falling back to client-side sorting:', error);
        // フォールバック: 従来の方法でBBox検索 + クライアント側ソート
        return this.searchBuildingsWithFallback(filters, page, limit, language);
      }

      console.log('🔍 PostGIS検索成功:', { 
        buildingsCount: buildings?.length || 0, 
        totalCount: count || 0,
        firstBuildingDistance: buildings?.[0]?.distance,
        lastBuildingDistance: buildings?.[buildings?.length - 1]?.distance
      });

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

            // 距離情報を設定（PostGISから取得済み）
            if (building.distance !== undefined) {
              (transformed as any).distance = building.distance;
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

    } catch (error) {
      console.warn('PostGIS search failed, using fallback method:', error);
      // エラーが発生した場合はフォールバック
      return this.searchBuildingsWithFallback(filters, page, limit, language);
    }
  }

  // フォールバック用の関数：従来のBBox検索 + クライアント側ソート
  private async searchBuildingsWithFallback(
    filters: SearchFilters,
    page: number = 1,
    limit: number = 10,
    language: 'ja' | 'en' = 'ja'
  ): Promise<{ buildings: Building[], total: number }> {
    const { lat, lng } = filters.currentLocation!;
    const radius = filters.radius;

    console.log('🔄 フォールバック処理開始（クライアント側ソート）:', { 
      lat, lng, radius, page, limit 
    });

    // BBoxで粗く絞る（インデックス活用）
    const latDelta = radius / 111.32;
    const lngDelta = radius / (111.32 * Math.cos((lat * Math.PI) / 180));

    let query = supabase
      .from('buildings_table_2')
      .select(`
        *,
        building_architects(
          architects_table(*)
        )
      `, { count: 'exact' })
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta);

    // テキスト検索（建築家名含む）
    if (filters.query.trim()) {
      // メインテーブルの検索条件
      const mainConditions = [
        `title.ilike.%${filters.query}%`,
        `titleEn.ilike.%${filters.query}%`,
        `location.ilike.%${filters.query}%`
      ];
      
      console.log('🔍 建築家名検索条件（フォールバック）:', { 
        query: filters.query, 
        mainConditions
      });
      
      // まずメイン条件を適用
      query = (query as any).or(mainConditions.join(','));
      
      // 建築家名の検索条件（関連テーブル）- foreignTableを使用
      const architectConditions = [
        `architectJa.ilike.%${filters.query}%`,
        `architectEn.ilike.%${filters.query}%`
      ];
      
      console.log('🔍 建築家名検索条件（foreignTable）:', { 
        architectConditions 
      });
      
      // 建築家名の条件を別途適用（foreignTable指定）
      query = (query as any).or(architectConditions.join(','), { 
        foreignTable: 'building_architects.architects_table' 
      });
    }

    // 建築家フィルター
    if (filters.architects && filters.architects.length > 0) {
      const column = language === 'ja' ? 'architectJa' : 'architectEn';
      const conditions = filters.architects.map((name) => {
        const escaped = String(name).replace(/[,]/g, '');
        return `${column}.ilike.*${escaped}*`;
      });
      if (conditions.length > 0) {
        query = (query as any).or(conditions.join(','), { foreignTable: 'building_architects.architects_table' });
      }
    }

    // 建物用途フィルター
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      const column = language === 'ja' ? 'buildingTypes' : 'buildingTypesEn';
      const buildingTypeConditions = filters.buildingTypes.map(type => 
        `${column}.ilike.*${String(type).replace(/[,]/g, '')}*`
      );
      query = query.or(buildingTypeConditions.join(','));
    }

    // 都道府県フィルター
    if (filters.prefectures.length > 0) {
      const column = language === 'ja' ? 'prefectures' : 'prefecturesEn';
      query = query.in(column as any, filters.prefectures);
    }

    // 動画フィルター
    if (filters.hasVideos) {
      query = query.not('youtubeUrl', 'is', null);
    }

    // 建築年フィルター
    if (typeof filters.completionYear === 'number' && !isNaN(filters.completionYear)) {
      query = query.eq('completionYears', filters.completionYear);
    }

    // 住宅系の除外
    if (filters.excludeResidential !== false) {
      query = query
        .not('buildingTypes', 'eq', '住宅')
        .not('buildingTypesEn', 'eq', 'housing');
    }

    // 全件取得してから距離ソート（フォールバック用）
    const { data: buildings, error, count } = await query;

    if (error) {
      throw new SupabaseApiError(500, error.message);
    }

    console.log('🔄 フォールバック処理: BBox検索結果:', { 
      totalBuildings: buildings?.length || 0,
      count: count || 0
    });

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
          
          // 距離を計算
          const d = this.haversineKm(lat, lng, transformed.lat, transformed.lng);
          (transformed as any).distance = d;

          transformedBuildings.push(transformed);
        } catch (error) {
          console.warn('Skipping building due to invalid data:', error);
          // 無効なデータの建築物はスキップ
        }
      }
    }

    // 距離でソート
    transformedBuildings.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    console.log('🔄 フォールバック処理: 距離ソート完了:', { 
      sortedBuildings: transformedBuildings.length,
      firstDistance: transformedBuildings[0]?.distance,
      lastDistance: transformedBuildings[transformedBuildings.length - 1]?.distance
    });

    // ページ分割
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedBuildings = transformedBuildings.slice(start, end);

    console.log('🔄 フォールバック処理: ページ分割完了:', { 
      page, limit, start, end,
      paginatedCount: paginatedBuildings.length,
      totalCount: transformedBuildings.length
    });

    return {
      buildings: paginatedBuildings,
      total: transformedBuildings.length
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

  // 簡易Haversine（km）
  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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

    // 外部写真URLの生成（画像チェックを無効化）
    const generatePhotosFromUid = async (uid: string): Promise<Photo[]> => {
      // 画像チェックを無効化し、全てのデータで画像がないものとして扱う
      return [];
    };

    // 写真データを取得（画像なし）
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

/**
 * 人気検索を取得
 */
export async function fetchPopularSearches(days: number = 7): Promise<SearchHistory[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_popular_searches', { days })
      .select('*');

    if (error) {
      console.error('人気検索の取得エラー:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // SearchHistory型に変換
    return data.map(item => ({
      query: item.query,
      searchedAt: item.last_searched,
      count: item.total_searches,
      type: item.search_type as 'text' | 'architect' | 'prefecture',
      filters: null // 人気検索ではフィルター情報は不要
    }));
  } catch (error) {
    console.error('人気検索の取得でエラーが発生:', error);
    return [];
  }
}

/**
 * 検索履歴をグローバル履歴に保存
 */
export async function saveSearchToGlobalHistory(
  query: string,
  searchType: 'text' | 'architect' | 'prefecture',
  filters?: Partial<SearchFilters>,
  userId?: number
): Promise<boolean> {
  try {
    // セッションIDを生成（匿名ユーザー用）
    const sessionId = userId ? null : `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase
      .from('global_search_history')
      .insert({
        query,
        search_type: searchType,
        user_id: userId || null,
        user_session_id: sessionId,
        filters: filters || null
      });

    if (error) {
      console.error('グローバル検索履歴の保存エラー:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('グローバル検索履歴の保存でエラーが発生:', error);
    return false;
  }
}