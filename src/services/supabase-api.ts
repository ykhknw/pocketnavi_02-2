import { supabase } from '../lib/supabase'
import { Building, SearchFilters, Architect, Photo, NewArchitect } from '../types'
import { sessionManager } from '../utils/session-manager'

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
          architect_id,
          architect_order
        )
      `, { count: 'exact' })
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
          architect_id,
          architect_order
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
          architect_id,
          architect_order
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
           architect_id,
           architect_order
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
       
       // 建築家名の検索条件（新しいテーブル構造）
       try {
         console.log('🔍 建築家名検索開始（新しいテーブル構造）:', filters.query);
         
         // ステップ1: individual_architectsで建築家名を検索
         const { data: individualArchitects, error: individualError } = await supabase
           .from('individual_architects')
           .select('individual_architect_id')
           .or(`name_ja.ilike.%${filters.query}%,name_en.ilike.%${filters.query}%`);
         
         if (individualError) {
           console.warn('🔍 建築家名検索エラー（ステップ1）:', individualError);
         } else if (individualArchitects && individualArchitects.length > 0) {
           const individualArchitectIds = individualArchitects.map(a => a.individual_architect_id);
           console.log('🔍 建築家名検索結果（individual_architect_id）:', individualArchitectIds.length, '件');
           
           // ステップ2: architect_compositionsからarchitect_idを取得
           const { data: compositions, error: compositionError } = await supabase
             .from('architect_compositions')
             .select('architect_id')
             .in('individual_architect_id', individualArchitectIds);
           
           if (compositionError) {
             console.warn('🔍 建築家名検索エラー（ステップ2）:', compositionError);
           } else if (compositions && compositions.length > 0) {
             const architectIds = compositions.map(c => c.architect_id);
             console.log('🔍 建築家名検索結果（architect_id）:', architectIds.length, '件');
             
             // ステップ3: architect_idから建築物IDを取得
             const { data: buildingIds, error: buildingError } = await supabase
               .from('building_architects')
               .select('building_id')
               .in('architect_id', architectIds);
             
             if (buildingError) {
               console.warn('🔍 建築家名検索エラー（ステップ3）:', buildingError);
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
        // ステップ1: individual_architectsで建築家名を検索
        const architectConditions = filters.architects.map(name => {
          const escaped = String(name).replace(/[,]/g, '');
          return language === 'ja' 
            ? `name_ja.ilike.*${escaped}*`
            : `name_en.ilike.*${escaped}*`;
        });
        
        const { data: individualArchitects, error: architectError } = await supabase
          .from('individual_architects')
          .select('individual_architect_id')
          .or(architectConditions.join(','));
        
        if (architectError) {
          console.warn('🔍 建築家フィルター検索エラー（ステップ1）:', architectError);
        } else if (individualArchitects && individualArchitects.length > 0) {
          const individualArchitectIds = individualArchitects.map(a => a.individual_architect_id);
          console.log('🔍 建築家フィルター検索結果（individual_architect_id）:', individualArchitectIds.length, '件');
          
          // ステップ2: individual_architect_idからarchitect_idを取得
          const { data: compositions, error: compositionError } = await supabase
            .from('architect_compositions')
            .select('architect_id')
            .in('individual_architect_id', individualArchitectIds);
          
          if (compositionError) {
            console.warn('🔍 建築家フィルター検索エラー（ステップ2）:', compositionError);
          } else if (compositions && compositions.length > 0) {
            const architectIds = compositions.map(c => c.architect_id);
            console.log('🔍 建築家フィルター検索結果（architect_id）:', architectIds.length, '件');
            
            // ステップ3: architect_idから建築物IDを取得
            const { data: buildingIds, error: buildingError } = await supabase
              .from('building_architects')
              .select('building_id')
              .in('architect_id', architectIds);
            
            if (buildingError) {
              console.warn('🔍 建築家フィルター検索エラー（ステップ3）:', buildingError);
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
          architect_id,
          architect_order
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

      // ここでの architects_table 参照は撤去（新構造では個別の手順で対応済み）
    }

    // 建築家フィルター
    if (filters.architects && filters.architects.length > 0) {
      // 旧 foreignTable 条件は撤去。新構造の検索ロジックは searchBuildings 側に統合済み。
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
    const { data, error } = await supabase
      .from('individual_architects')
      .select(`
        individual_architect_id,
        name_ja,
        name_en,
        slug,
        architect_compositions!inner(
          architect_id,
          order_index
        )
      `)
      .order('name_ja');

    if (error || !data) {
      throw new SupabaseApiError(500, error?.message || 'failed to fetch individual_architects');
    }

    return data.map(item => {
      const composition = item.architect_compositions.sort((a: any, b: any) => a.order_index - b.order_index)[0];
      return {
        architect_id: composition?.architect_id || 0,
        architectJa: item.name_ja,
        architectEn: item.name_en,
        slug: item.slug,
        websites: []
      };
    });
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

    // 建築家データの変換（building_architectsテーブルのみから取得）
    let architects: any[] = [];
    if (data.building_architects && data.building_architects.length > 0) {
      try {
        // 新しいテーブル構造を使用して建築家データを取得
        const architectPromises = data.building_architects.map(async (ba: any) => {
          const architectId = ba.architect_id;
          if (!architectId) return null;

          // architect_compositionsテーブルから個別建築家IDを取得
          const { data: compositions, error: compError } = await supabase
            .from('architect_compositions')
            .select(`
              individual_architect_id,
              order_index,
              individual_architects!inner(
                individual_architect_id,
                name_ja,
                name_en,
                slug
              )
            `)
            .eq('architect_id', architectId)
            .order('order_index');

          if (compError || !compositions) {
            console.warn(`建築家構成取得エラー (architect_id: ${architectId}):`, compError);
            return null;
          }

          // 新しいテーブル構造のデータを返す（複数個人を展開）
          return compositions.map((comp: any) => ({
            architect_id: architectId,
            individual_architect_id: comp.individual_architect_id,
            architectJa: comp.individual_architects.name_ja,
            architectEn: comp.individual_architects.name_en,
            slug: comp.individual_architects.slug,
            order_index: comp.order_index,
            websites: []
          }));
        });

        // すべての建築家データを取得
        const architectResults = await Promise.all(architectPromises);
        
        // 結果を平坦化して配列に変換
        architects = architectResults
          .filter(result => result !== null)
          .flat()
          .filter(architect => architect !== null);

        console.log('新しいテーブル構造から取得した建築家データ:', architects);
      } catch (error) {
        console.error('新しいテーブル構造での建築家データ取得エラー:', error);
        architects = [];
      }
    }
    // architectDetailsフィールドからのフォールバック処理を削除

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

  /**
   * 新しいテーブル構造を使用して建築家情報を取得
   * individual_architects と architect_compositions を結合して取得
   */
  async getArchitectWithNewStructure(architectId: number): Promise<NewArchitect | null> {
    const { data, error } = await supabase
      .from('architect_compositions')
      .select(`
        architect_id,
        order_index,
        individual_architects!inner(
          individual_architect_id,
          name_ja,
          name_en,
          slug
        )
      `)
      .eq('architect_id', architectId)
      .order('order_index')
      .single();

    if (error || !data) {
      console.error('新しいテーブル構造での建築家取得エラー:', error);
      return null;
    }

    return {
      architect_id: data.architect_id,
      architectJa: data.individual_architects.name_ja,
      architectEn: data.individual_architects.name_en,
      slug: data.individual_architects.slug,
      individual_architect_id: data.individual_architects.individual_architect_id,
      order_index: data.order_index,
      websites: [] // 必要に応じて取得
    };
  }

  /**
   * 新しいテーブル構造を使用して建築家のslugから建築家情報を取得
   */
  async getArchitectBySlugWithNewStructure(slug: string): Promise<NewArchitect | null> {
    const { data, error } = await supabase
      .from('individual_architects')
      .select(`
        individual_architect_id,
        name_ja,
        name_en,
        slug,
        architect_compositions!inner(
          architect_id,
          order_index
        )
      `)
      .eq('slug', slug)
      .single();

    if (error || !data) {
      console.error('新しいテーブル構造での建築家slug取得エラー:', error);
      return null;
    }

    // 最初のcompositionを取得（複数ある場合はorder_indexでソート）
    const composition = data.architect_compositions.sort((a, b) => a.order_index - b.order_index)[0];

    return {
      architect_id: composition.architect_id,
      architectJa: data.name_ja,
      architectEn: data.name_en,
      slug: data.slug,
      individual_architect_id: data.individual_architect_id,
      order_index: composition.order_index,
      websites: [] // 必要に応じて取得
    };
  }

  /**
   * 新しいテーブル構造を使用して建築物の建築家情報を取得
   */
  async getBuildingArchitectsWithNewStructure(buildingId: number): Promise<NewArchitect[]> {
    try {
      console.log(`🔍 新しいテーブル構造で建築物建築家取得開始: ${buildingId}`);
      
      // 段階的にクエリを実行して問題を特定
      const { data, error } = await supabase
        .from('building_architects')
        .select(`
          architect_id,
          architect_order
        `)
        .eq('building_id', buildingId)
        .order('architect_order');

      if (error || !data) {
        console.error('building_architects取得エラー:', error);
        return [];
      }

      console.log(`✅ building_architects取得成功: ${data.length}件`, data);

      // 各architect_idに対して個別に建築家情報を取得
      const architects: NewArchitect[] = [];
      
      for (const buildingArchitect of data) {
        try {
          // architect_compositionsから建築家情報を取得（すべてのindividual_architect_idを取得）
          const { data: compositionData, error: compositionError } = await supabase
            .from('architect_compositions')
            .select(`
              order_index,
              individual_architects(
                individual_architect_id,
                name_ja,
                name_en,
                slug
              )
            `)
            .eq('architect_id', buildingArchitect.architect_id)
            .order('order_index');

          if (compositionError || !compositionData) {
            console.warn(`architect_compositions取得エラー (architect_id: ${buildingArchitect.architect_id}):`, compositionError);
            continue;
          }

          console.log(`✅ architect_compositions取得成功 (architect_id: ${buildingArchitect.architect_id}): ${compositionData.length}件`, compositionData);

          // 各compositionに対して建築家情報を追加
          for (const composition of compositionData) {
            if (composition.individual_architects) {
              architects.push({
                architect_id: buildingArchitect.architect_id,
                architectJa: composition.individual_architects.name_ja,
                architectEn: composition.individual_architects.name_en,
                slug: composition.individual_architects.slug,
                individual_architect_id: composition.individual_architects.individual_architect_id,
                order_index: composition.order_index,
                websites: []
              });
              
              console.log(`✅ 建築家追加: ${composition.individual_architects.name_ja} (${composition.individual_architects.slug})`);
            }
          }
        } catch (compositionError) {
          console.warn(`個別建築家情報取得エラー (architect_id: ${buildingArchitect.architect_id}):`, compositionError);
          continue;
        }
      }

      // individual_architect_idベースでユニークな建築家のみを返す
      const uniqueArchitects = architects.filter((architect, index, self) => 
        index === self.findIndex(a => a.individual_architect_id === architect.individual_architect_id)
      );

      console.log(`✅ 最終的な建築家情報: ${uniqueArchitects.length}件 (重複除去後)`, uniqueArchitects);
      return uniqueArchitects;

    } catch (error) {
      console.error('新しいテーブル構造での建築物建築家取得エラー:', error);
      return [];
    }
  }

  /**
   * 新しいテーブル構造を使用した建築物データ変換（既存transformBuildingとの互換性を保つ）
   */
  async transformBuildingWithNewStructure(data: any): Promise<Building> {
    // 既存のtransformBuildingメソッドをベースに、新しいテーブル構造に対応
    const architects = await this.getBuildingArchitectsWithNewStructure(data.building_id);

    // 外部写真URLの生成（画像チェックを無効化）
    const generatePhotosFromUid = async (uid: string): Promise<Photo[]> => {
      return [];
    };

    const photos = await generatePhotosFromUid(data.uid);
    
    return {
      id: data.building_id,
      uid: data.uid,
      slug: data.slug,
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
      photos: photos,
      likes: 0,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString()
    };
  }

  // ========================================
  // ハイブリッド実装メソッド
  // 新しいテーブル構造を優先し、フォールバックで既存テーブルを使用
  // ========================================

  /**
   * 新しいテーブル構造のみを使用して建築家情報を取得
   */
  async getArchitectHybrid(architectId: number): Promise<Architect | null> {
    try {
      console.log(`🔍 新しいテーブル構造で建築家取得開始: ${architectId}`);
      
      // 新しいテーブル構造のみを使用
      const newStructureResult = await this.getArchitectWithNewStructure(architectId);
      
      if (newStructureResult) {
        console.log(`✅ 新しいテーブル構造で建築家取得成功: ${architectId}`);
        return newStructureResult;
      } else {
        console.log(`⚠️ 新しいテーブル構造で建築家情報が取得できません: ${architectId}`);
        return null;
      }
    } catch (error) {
      console.error('❌ 新しいテーブル構造での建築家取得エラー:', error);
      return null;
    }
  }

  /**
   * 新しいテーブル構造のみを使用して建築家を検索
   */
  async searchArchitectsHybrid(query: string, language: 'ja' | 'en' = 'ja'): Promise<Architect[]> {
    try {
      console.log(`🔍 新しいテーブル構造で建築家検索開始: ${query}`);
      
      // 新しいテーブル構造のみを使用
      const newStructureResults = await this.searchArchitectsWithNewStructure(query, language);
      
      if (newStructureResults.length > 0) {
        console.log(`✅ 新しいテーブル構造で検索成功: ${query} (${newStructureResults.length}件)`);
        return newStructureResults;
      } else {
        console.log(`⚠️ 新しいテーブル構造で建築家検索結果がありません: ${query}`);
        return [];
      }
    } catch (error) {
      console.error('❌ 新しいテーブル構造での建築家検索エラー:', error);
      return [];
    }
  }

  /**
   * 新しいテーブル構造のみを使用して建築家slugから建築家情報を取得
   */
  async getArchitectBySlugHybrid(slug: string): Promise<Architect | null> {
    try {
      console.log(`🔍 新しいテーブル構造で建築家slug取得開始: ${slug}`);
      
      // 新しいテーブル構造のみを使用
      const newStructureResult = await this.getArchitectBySlugWithNewStructure(slug);
      
      if (newStructureResult) {
        console.log(`✅ 新しいテーブル構造で建築家slug取得成功: ${slug}`);
        return newStructureResult;
      } else {
        console.log(`⚠️ 新しいテーブル構造で建築家slug情報が取得できません: ${slug}`);
        return null;
      }
    } catch (error) {
      console.error('❌ 新しいテーブル構造での建築家slug取得エラー:', error);
      return null;
    }
  }

  /**
   * 新しいテーブル構造のみを使用して建築物の建築家情報を取得
   */
  async getBuildingArchitectsHybrid(buildingId: number): Promise<Architect[]> {
    try {
      console.log(`🔍 新しいテーブル構造で建築物建築家取得開始: ${buildingId}`);
      
      // 新しいテーブル構造のみを使用
      const newStructureResults = await this.getBuildingArchitectsWithNewStructure(buildingId);
      
      if (newStructureResults.length > 0) {
        console.log(`✅ 新しいテーブル構造で建築物建築家取得成功: ${buildingId} (${newStructureResults.length}件)`);
        return newStructureResults;
      } else {
        console.log(`⚠️ 新しいテーブル構造で建築物建築家情報が取得できません: ${buildingId}`);
        return [];
      }
    } catch (error) {
      console.error('❌ 新しいテーブル構造での建築物建築家取得エラー:', error);
      return [];
    }
  }

  /**
   * 建築家ページ専用: 新しいテーブル構造のみを使用して建築物の建築家情報を取得
   */
  async getBuildingArchitectsForArchitectPage(buildingId: number): Promise<Architect[]> {
    try {
      console.log(`🔍 建築家ページ用建築家情報取得: ${buildingId}`);
      
      // 新しいテーブル構造のみを使用
      const newStructureResults = await this.getBuildingArchitectsWithNewStructure(buildingId);
      
      if (newStructureResults.length > 0) {
        console.log(`✅ 建築家ページ用建築家情報取得成功: ${buildingId} (${newStructureResults.length}件)`);
        return newStructureResults;
      } else {
        console.log(`⚠️ 建築家ページ用建築家情報が取得できません: ${buildingId}`);
        return [];
      }
    } catch (error) {
      console.error('❌ 建築家ページ用建築家情報取得エラー:', error);
      return [];
    }
  }

  /**
   * 建築家の作品一覧を取得（slugベース）
   */
  async getArchitectBuildingsBySlug(slug: string): Promise<{ buildings: Building[], architectName: { ja: string, en: string } }> {
    try {
      console.log(`🔍 建築家の作品取得開始: ${slug}`);
      
      // 1. individual_architectsテーブルからindividual_architect_idを取得
      const { data: individualArchitect, error: individualError } = await supabase
        .from('individual_architects')
        .select('individual_architect_id, name_ja, name_en')
        .eq('slug', slug)
        .single();
      
      if (individualError || !individualArchitect) {
        console.log(`❌ individual_architectsテーブルで建築家が見つかりません: ${slug}`);
        return { buildings: [], architectName: { ja: '', en: '' } };
      }
      
      console.log(`✅ individual_architect_id取得: ${individualArchitect.individual_architect_id}`);
      
      // 2. architect_compositionsテーブルからarchitect_idを取得
      const { data: compositions, error: compositionsError } = await supabase
        .from('architect_compositions')
        .select('architect_id')
        .eq('individual_architect_id', individualArchitect.individual_architect_id);
      
      if (compositionsError || !compositions || compositions.length === 0) {
        console.log(`❌ architect_compositionsテーブルで関連が見つかりません: ${individualArchitect.individual_architect_id}`);
        return { buildings: [], architectName: { ja: individualArchitect.name_ja, en: individualArchitect.name_en } };
      }
      
      const architectIds = compositions.map(comp => comp.architect_id);
      console.log(`✅ architect_id取得: ${architectIds.join(', ')}`);
      
      // 3. building_architectsテーブルからbuilding_idを取得
      const { data: buildingArchitects, error: buildingArchitectsError } = await supabase
        .from('building_architects')
        .select('building_id')
        .in('architect_id', architectIds);
      
      if (buildingArchitectsError || !buildingArchitects || buildingArchitects.length === 0) {
        console.log(`❌ building_architectsテーブルで建築物が見つかりません: ${architectIds.join(', ')}`);
        return { buildings: [], architectName: { ja: individualArchitect.name_ja, en: individualArchitect.name_en } };
      }
      
      const buildingIds = buildingArchitects.map(ba => ba.building_id);
      console.log(`✅ building_id取得: ${buildingIds.join(', ')}`);
      
      // 4. buildings_table_2から建築物情報を取得（通常の建築物一覧ページと同様のフィルタリング適用）
      const { data: buildingsData, error: buildingsError } = await supabase
        .from('buildings_table_2')
        .select(`
          *,
          building_architects!inner(
            architect_id,
            architect_order
          )
        `)
        .in('building_id', buildingIds)
        .not('lat', 'is', null)  // 座標が存在するもののみ
        .not('lng', 'is', null)  // 座標が存在するもののみ
        .not('buildingTypes', 'eq', '住宅')  // 住宅を除外
        .not('buildingTypesEn', 'eq', 'housing')  // 英語版住宅も除外
        .order('completionYears', { ascending: false });
      
      if (buildingsError || !buildingsData) {
        console.log(`❌ buildings_table_2で建築物データ取得エラー: ${buildingsError?.message}`);
        return { buildings: [], architectName: { ja: individualArchitect.name_ja, en: individualArchitect.name_en } };
      }
      
      console.log(`✅ 建築物データ取得（フィルタリング適用後）: ${buildingsData.length}件`);
      console.log(`🔍 適用されたフィルター: lat/lng非NULL、住宅除外`);
      
      // 5. 建築物データを変換（建築家情報を含む）
      const transformedBuildings = await Promise.all(
        buildingsData.map(async (building) => {
          // 建築家情報を明示的に取得（建築家ページ専用: 新しいテーブル構造のみ）
          const buildingArchitects = await this.getBuildingArchitectsForArchitectPage(building.building_id);
          
          // 建築家情報の詳細ログ
          console.log(`🔍 建築物 ${building.building_id} の建築家情報:`, buildingArchitects.map(arch => ({
            architect_id: arch.architect_id,
            architectJa: arch.architectJa,
            architectEn: arch.architectEn,
            slug: arch.slug
          })));
          
          // 外部写真URLの生成（画像チェックを無効化）
          const generatePhotosFromUid = async (uid: string): Promise<any[]> => {
            return [];
          };

          const photos = await generatePhotosFromUid(building.uid);
          
          // データの存在チェックと適切な処理
          const hasLocation = building.location && building.location.trim() !== '';
          const hasPrefectures = building.prefectures && building.prefectures.trim() !== '';
          const hasBuildingTypes = building.buildingTypes && building.buildingTypes.trim() !== '';
          const hasCompletionYears = building.completionYears && building.completionYears > 0;
          
          console.log(`🔍 建築物 ${building.building_id} のデータ状況:`, {
            hasLocation,
            hasPrefectures,
            hasBuildingTypes,
            hasCompletionYears,
            architectsCount: buildingArchitects.length
          });
          
          return {
            id: building.building_id,
            uid: building.uid,
            slug: building.slug,
            title: building.title,
            titleEn: building.titleEn || building.title,
            thumbnailUrl: building.thumbnailUrl || '',
            youtubeUrl: building.youtubeUrl || '',
            completionYears: hasCompletionYears ? building.completionYears : null,
            parentBuildingTypes: building.parentBuildingTypes ? building.parentBuildingTypes.split(',').map(s => s.trim()).filter(s => s) : [],
            buildingTypes: hasBuildingTypes ? building.buildingTypes.split('/').map(s => s.trim()).filter(s => s) : [],
            parentStructures: building.parentStructures ? building.parentStructures.split(',').map(s => s.trim()).filter(s => s) : [],
            structures: building.structures ? building.structures.split(',').map(s => s.trim()).filter(s => s) : [],
            prefectures: hasPrefectures ? building.prefectures : null,
            prefecturesEn: building.prefecturesEn || null,
            areas: building.areas,
            location: hasLocation ? building.location : null,
            locationEn: building.locationEn_from_datasheetChunkEn || building.location,
            buildingTypesEn: building.buildingTypesEn ? building.buildingTypesEn.split('/').map(s => s.trim()).filter(s => s) : [],
            architectDetails: building.architectDetails || '',
            lat: parseFloat(building.lat) || 0,
            lng: parseFloat(building.lng) || 0,
            architects: buildingArchitects,
            photos: photos,
            likes: building.likes || 0,
            created_at: building.created_at || new Date().toISOString(),
            updated_at: building.updated_at || new Date().toISOString()
          };
        })
      );
      
      console.log(`✅ 建築物データ変換完了: ${transformedBuildings.length}件`);
      console.log(`🔍 最初の建築物の建築家情報:`, transformedBuildings[0]?.architects);
      console.log(`🔍 最初の建築物の用途情報:`, transformedBuildings[0]?.buildingTypes);
      console.log(`🔍 最初の建築物の完成年:`, transformedBuildings[0]?.completionYears);
      console.log(`🔍 建築家ページ用: 新しいテーブル構造から建築家情報を取得完了`);
      
      return {
        buildings: transformedBuildings,
        architectName: {
          ja: individualArchitect.name_ja,
          en: individualArchitect.name_en
        }
      };
      
    } catch (error) {
      console.error('❌ 建築家の作品取得エラー:', error);
      return { buildings: [], architectName: { ja: '', en: '' } };
    }
  }

  /**
   * ハイブリッド建築物データ変換（新しいテーブル構造優先）
   */
  async transformBuildingHybrid(data: any): Promise<Building> {
    try {
      // 1. 新しいテーブル構造で試行
      const newStructureResult = await this.transformBuildingWithNewStructure(data);
      if (newStructureResult) {
        console.log(`✅ 新しいテーブル構造で建築物変換成功: ${data.building_id}`);
        return newStructureResult;
      }
      
      // 2. フォールバック: 既存のtransformBuilding
      console.log(`🔄 フォールバック: 既存メソッドで建築物変換: ${data.building_id}`);
      return await this.transformBuilding(data);
    } catch (error) {
      console.error('❌ ハイブリッド建築物変換エラー:', error);
      // 最後の手段: 基本的なデータ構造で返す
      return {
        id: data.building_id,
        uid: data.uid || '',
        slug: data.slug || '',
        title: data.title || '',
        titleEn: data.titleEn || data.title || '',
        thumbnailUrl: data.thumbnailUrl || '',
        youtubeUrl: data.youtubeUrl || '',
        completionYears: 0,
        parentBuildingTypes: [],
        buildingTypes: [],
        parentStructures: [],
        structures: [],
        prefectures: data.prefectures || '',
        prefecturesEn: data.prefecturesEn || null,
        areas: data.areas || '',
        location: data.location || '',
        locationEn: data.locationEn || null,
        buildingTypesEn: [],
        architectDetails: data.architectDetails || '',
        lat: parseFloat(data.lat) || 0,
        lng: parseFloat(data.lng) || 0,
        architects: [],
        photos: [],
        likes: 0,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };
    }
  }

  /**
   * 移行状況の確認
   */
  async getMigrationStatus(): Promise<{
    newStructureAvailable: boolean;
    fallbackUsed: boolean;
    lastMigrationCheck: string;
  }> {
    try {
      // 新しいテーブル構造の可用性を確認
      const { data: individualCount, error: individualError } = await supabase
        .from('individual_architects')
        .select('individual_architect_id', { count: 'exact' });

      const { data: compositionCount, error: compositionError } = await supabase
        .from('architect_compositions')
        .select('architect_id', { count: 'exact' });

      const newStructureAvailable = !individualError && !compositionError && 
        (individualCount || 0) > 0 && (compositionCount || 0) > 0;

      return {
        newStructureAvailable,
        fallbackUsed: false, // この値は実際の使用状況で更新
        lastMigrationCheck: new Date().toISOString()
      };
    } catch (error) {
      console.error('移行状況確認エラー:', error);
      return {
        newStructureAvailable: false,
        fallbackUsed: false,
        lastMigrationCheck: new Date().toISOString()
      };
    }
  }

  // ========================================
  // 新しいテーブル構造での検索メソッド
  // ========================================

  /**
   * 新しいテーブル構造を使用した建築家検索
   */
  async searchArchitectsWithNewStructure(query: string, language: 'ja' | 'en' = 'ja'): Promise<Architect[]> {
    try {
      const { data, error } = await supabase
        .from('individual_architects')
        .select(`
          individual_architect_id,
          name_ja,
          name_en,
          slug,
          architect_compositions!inner(
            architect_id,
            order_index
          )
        `)
        .or(`name_ja.ilike.%${query}%,name_en.ilike.%${query}%`)
        .order('name_ja');

      if (error || !data) {
        console.error('新しいテーブル構造での建築家検索エラー:', error);
        return [];
      }

      return data.map(item => {
        // 最初のcompositionを取得（複数ある場合はorder_indexでソート）
        const composition = item.architect_compositions.sort((a: any, b: any) => a.order_index - b.order_index)[0];
        
        return {
          architect_id: composition.architect_id,
          architectJa: item.name_ja,
          architectEn: item.name_en,
          slug: item.slug,
          websites: []
        };
      });
    } catch (error) {
      console.error('新しいテーブル構造での建築家検索でエラーが発生:', error);
      return [];
    }
  }

  /**
   * 既存の建築家検索メソッド（ハイブリッド実装を使用）
   */
  async searchArchitects(query: string, language: 'ja' | 'en' = 'ja'): Promise<Architect[]> {
    // ハイブリッド実装を使用
    return await this.searchArchitectsHybrid(query, language);
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
    return data.map(item => {
      let filters = null;
      
      // 検索タイプに基づいてフィルター情報を復元
      if (item.search_type === 'architect') {
        filters = {
          architects: [item.query]
        };
      } else if (item.search_type === 'prefecture') {
        filters = {
          prefectures: [item.query]
        };
      }
      
      return {
        query: item.query,
        searchedAt: item.last_searched,
        count: item.total_searches,
        type: item.search_type as 'text' | 'architect' | 'prefecture',
        filters: filters
      };
    });
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
  // 時間制限チェック
  if (!sessionManager.canSearch(query, searchType)) {
    console.log('重複検索をスキップ:', query);
    return false;
  }

  try {
    const { error } = await supabase
      .from('global_search_history')
      .insert({
        query,
        search_type: searchType,
        user_id: userId || null,
        user_session_id: sessionManager.getSessionId(),
        filters: filters || null
      });

    if (error) {
      console.error('グローバル検索履歴の保存エラー:', error);
      return false;
    }

    console.log('グローバル検索履歴に保存完了:', query);
    return true;
  } catch (error) {
    console.error('グローバル検索履歴の保存でエラーが発生:', error);
    return false;
  }
}