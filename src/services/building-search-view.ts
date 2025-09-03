import { supabase } from '../lib/supabase';
import { SearchFilters } from '../types';

/**
 * データベースビューを使用した建築物検索サービス
 * Supabaseクエリビルダーの問題を回避するため、シンプルなクエリを使用
 */
export class BuildingSearchViewService {
  /**
   * フィルター条件に基づいて建築物を検索
   */
  async searchBuildings(
    filters: SearchFilters,
    language: 'ja' | 'en' = 'ja',
    page: number = 1,
        limit: number = 20
  ) {
    try {
      console.log('🔍 ビュー検索開始:', { filters, language, page, limit });

      // 複数建物用途フィルターの場合は特別処理
      if (filters.buildingTypes && filters.buildingTypes.length > 1) {
        return this.searchBuildingsWithMultipleTypes(filters, language, page, limit);
      }

      // フィルター条件に基づいて個別クエリを実行
      console.log('🔧 個別クエリ方式で検索を実行します');
      console.log('🔍 受け取ったフィルター:', {
        completionYear: filters.completionYear,
        completionYearType: typeof filters.completionYear,
        isNumber: typeof filters.completionYear === 'number',
        isNaN: typeof filters.completionYear === 'number' ? isNaN(filters.completionYear) : 'N/A'
      });
      
      // 基本クエリの構築
      let query = supabase
        .from('buildings_search_view')
        .select('*', { count: 'exact' });

      // フィルター条件を個別に適用
      if (filters.buildingTypes && filters.buildingTypes.length === 1) {
        const column = language === 'ja' ? 'buildingTypes' : 'buildingTypesEn';
        query = query.ilike(column, `%${filters.buildingTypes[0]}%`);
      }

      if (filters.prefectures && filters.prefectures.length > 0) {
        const column = language === 'ja' ? 'prefectures' : 'prefecturesEn';
        query = query.in(column, filters.prefectures);
      }

      if (filters.hasVideos) {
        query = query.not('youtubeUrl', 'is', null);
      }

      if (typeof filters.completionYear === 'number' && !isNaN(filters.completionYear)) {
        console.log('🔍 建築年フィルター適用:', { completionYear: filters.completionYear, type: typeof filters.completionYear });
        query = query.eq('completionYears', filters.completionYear);
        console.log('🔍 建築年フィルター適用後:', { queryType: typeof query, hasEq: typeof query?.eq });
      }

      if (filters.architects && filters.architects.length > 0) {
        const column = language === 'ja' ? 'architect_names_ja' : 'architect_names_en';
        query = query.ilike(column, `%${filters.architects[0]}%`);
      }

      if (filters.areas && filters.areas.length > 0) {
        const column = language === 'ja' ? 'areas' : 'areasEn';
        query = query.in(column, filters.areas);
      }

      if (filters.hasPhotos) {
        query = query.not('thumbnailUrl', 'is', null);
      }

      if (filters.query && filters.query.trim()) {
        if (language === 'ja') {
          query = query.ilike('title', `%${filters.query}%`);
        } else {
          query = query.ilike('titleEn', `%${filters.query}%`);
        }
      }

      // 距離フィルタリング（現在地が指定されている場合）
      if (filters.currentLocation && filters.radius) {
        console.log('🔍 距離フィルタリング適用:', { 
          currentLocation: filters.currentLocation, 
          radius: filters.radius 
        });
        
        // 緯度・経度の範囲を計算（概算）
        const latRange = filters.radius / 111.0; // 1度 ≈ 111km
        const lngRange = filters.radius / (111.0 * Math.cos(filters.currentLocation.lat * Math.PI / 180));
        
        // 緯度・経度の範囲で絞り込み
        query = query
          .gte('lat', filters.currentLocation.lat - latRange)
          .lte('lat', filters.currentLocation.lat + latRange)
          .gte('lng', filters.currentLocation.lng - lngRange)
          .lte('lng', filters.currentLocation.lng + lngRange);
        
        console.log('🔍 距離フィルタリング適用後:', { 
          latRange, 
          lngRange,
          latMin: filters.currentLocation.lat - latRange,
          latMax: filters.currentLocation.lat + latRange,
          lngMin: filters.currentLocation.lng - lngRange,
          lngMax: filters.currentLocation.lng + lngRange
        });
        
        // 距離フィルタリングが適用される場合は、ページネーションを後で適用
        // 全データを取得して距離でソートしてからページネーション
        console.log('🔍 距離フィルタリング適用のため、全データ取得後にページネーション適用');
        return this.searchBuildingsWithDistanceSorting(filters, language, page, limit);
      }

      // ページネーションの適用
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      try {
        query = query.range(start, end);
      } catch (error) {
        console.error('❌ range適用でエラー:', error);
        throw new Error('range適用でエラーが発生しました');
      }

      // ソート順の設定（建築物IDの降順）
      try {
        query = query.order('building_id', { ascending: false });
      } catch (error) {
        console.error('❌ order適用でエラー:', error);
        throw new Error('order適用でエラーが発生しました');
      }

      // クエリオブジェクトの最終状態を確認
      console.log('🔍 最終クエリオブジェクト:', {
        queryType: typeof query,
        hasRange: typeof query?.range,
        hasOrder: typeof query?.order,
        queryKeys: query ? Object.keys(query) : 'null'
      });

      console.log('🔍 ビュー検索クエリ実行:', { start, end, limit });

      // クエリの実行
      console.log('🔍 クエリ実行開始...');
      
      try {
        console.log('🔍 クエリ実行中...');
        const { data, error, count } = await query;
        console.log('🔍 クエリ実行完了:', { hasData: !!data, hasError: !!error, count });
        
        if (error) {
          console.error('❌ ビュー検索エラー:', error);
          throw error;
        }
        
        console.log('✅ ビュー検索完了:', {
          resultCount: data?.length || 0,
          totalCount: count || 0,
          page,
          limit
        });
        
        // 最初の数件の建築年を確認
        if (data && data.length > 0) {
          console.log('🔍 検索結果の建築年サンプル:', data.slice(0, 3).map(building => ({
            id: building.building_id,
            title: building.title,
            completionYears: building.completionYears,
            completionYearsType: typeof building.completionYears
          })));
        }
        
        const result = {
          data: data || [],
          count: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        };
        
        console.log('🔍 BuildingSearchViewService 戻り値:', result);
        
        return result;
        
      } catch (queryError) {
        console.error('❌ クエリ実行でエラー:', queryError);
        throw queryError;
      }

    } catch (error) {
      console.error('❌ ビュー検索でエラーが発生:', error);
      throw error;
    }
  }

  /**
   * 複数建物用途フィルター用の特別検索
   */
  private async searchBuildingsWithMultipleTypes(
    filters: SearchFilters,
    language: 'ja' | 'en',
    page: number,
    limit: number
  ) {
    try {
      console.log('🔍 複数建物用途フィルター検索開始:', { filters, language, page, limit });
      
      const column = language === 'ja' ? 'buildingTypes' : 'buildingTypesEn';
      const allResults: any[] = [];
      const seenIds = new Set<number>();
      
      for (const buildingType of filters.buildingTypes) {
        const { data, error } = await supabase
          .from('buildings_search_view')
          .select('*', { count: 'exact' })
          .ilike(column, `%${buildingType}%`)
          .order('building_id', { ascending: false });
        
        if (error) {
          console.warn(`建物用途フィルター "${buildingType}" でエラー:`, error);
          continue;
        }
        
        if (data) {
          // 重複を除去して結果を統合
          for (const building of data) {
            if (!seenIds.has(building.building_id)) {
              seenIds.add(building.building_id);
              allResults.push(building);
            }
          }
        }
      }
      
      // 結果をソート（建築物IDの降順）
      allResults.sort((a, b) => b.building_id - a.building_id);
      
      // ページネーションを適用
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedResults = allResults.slice(start, end);
      
      console.log('🔍 複数建物用途フィルター結果:', {
        totalResults: allResults.length,
        paginatedResults: paginatedResults.length,
        page,
        limit
      });
      
      return {
        data: paginatedResults,
        count: allResults.length,
        page,
        limit,
        totalPages: Math.ceil(allResults.length / limit)
      };
      
    } catch (error) {
      console.error('❌ 複数建物用途フィルター検索でエラー:', error);
      throw error;
    }
  }

  /**
   * フィルター条件をクエリに適用
   */
  private async applyFilters(
    query: any,
    filters: SearchFilters,
    language: 'ja' | 'en'
  ) {
    console.log('🔍 ビューフィルター適用開始:', { filters, language });

         // 建物用途フィルター（単一条件のみ）
     if (filters.buildingTypes && filters.buildingTypes.length === 1) {
       try {
         const column = language === 'ja' ? 'buildingTypes' : 'buildingTypesEn';
         query = query.ilike(column, `%${filters.buildingTypes[0]}%`);
         
         // フィルター適用後の状態確認
         if (!query || typeof query.range !== 'function' || typeof query.order !== 'function') {
           console.error('❌ 建物用途フィルター適用後にクエリオブジェクトが破損');
           throw new Error('建物用途フィルター適用後にクエリオブジェクトが破損');
         }
       } catch (error) {
         console.error('❌ 建物用途フィルター適用でエラー:', error);
         throw new Error('建物用途フィルター適用でエラーが発生しました');
       }
     }

         // 都道府県フィルター
     if (filters.prefectures && filters.prefectures.length > 0) {
       try {
         const column = language === 'ja' ? 'prefectures' : 'prefecturesEn';
         query = query.in(column, filters.prefectures);
         
         // フィルター適用後の状態確認
         if (!query || typeof query.range !== 'function' || typeof query.order !== 'function') {
           console.error('❌ 都道府県フィルター適用後にクエリオブジェクトが破損');
           throw new Error('都道府県フィルター適用後にクエリオブジェクトが破損');
         }
       } catch (error) {
         console.error('❌ 都道府県フィルター適用でエラー:', error);
         throw new Error('都道府県フィルター適用でエラーが発生しました');
       }
     }
 
     // 動画フィルター
     if (filters.hasVideos) {
       try {
         query = query.not('youtubeUrl', 'is', null);
         
         // フィルター適用後の状態確認
         if (!query || typeof query.range !== 'function' || typeof query.order !== 'function') {
           console.error('❌ 動画フィルター適用後にクエリオブジェクトが破損');
           throw new Error('動画フィルター適用後にクエリオブジェクトが破損');
         }
       } catch (error) {
         console.error('❌ 動画フィルター適用でエラー:', error);
         throw new Error('動画フィルター適用でエラーが発生しました');
       }
     }
 
     // 建築年フィルター
     if (typeof filters.completionYear === 'number' && !isNaN(filters.completionYear)) {
       try {
         query = query.eq('completionYears', filters.completionYear);
         
         // フィルター適用後の状態確認
         if (!query || typeof query.range !== 'function' || typeof query.order !== 'function') {
           console.error('❌ 建築年フィルター適用後にクエリオブジェクトが破損');
           throw new Error('建築年フィルター適用後にクエリオブジェクトが破損');
         }
       } catch (error) {
         console.error('❌ 建築年フィルター適用でエラー:', error);
         throw new Error('建築年フィルター適用でエラーが発生しました');
       }
     }

    // 建築家名フィルター
    if (filters.architects && filters.architects.length > 0) {
      const column = language === 'ja' ? 'architect_names_ja' : 'architect_names_en';
      const conditions = filters.architects.map(architect => 
        `${column}.ilike.%${architect}%`
      );
      
      if (conditions.length === 1) {
        query = query.ilike(column, `%${filters.architects[0]}%`);
      }
    }

    // エリアフィルター
    if (filters.areas && filters.areas.length > 0) {
      const column = language === 'ja' ? 'areas' : 'areasEn';
      query = query.in(column, filters.areas);
    }

    // 写真フィルター
    if (filters.hasPhotos) {
      query = query.not('thumbnailUrl', 'is', null);
    }

    // キーワード検索
    if (filters.query && filters.query.trim()) {
      // 日本語の場合はタイトルでのみ検索、英語の場合は英語タイトルでのみ検索
      // 複数条件を避けて、単一条件のみを適用
      if (language === 'ja') {
        query = query.ilike('title', `%${filters.query}%`);
      } else {
        query = query.ilike('titleEn', `%${filters.query}%`);
      }
    }

    console.log('🔍 ビューフィルター適用完了');
    
    // フィルター適用後のクエリ状態を確認
    console.log('🔍 フィルター適用後のクエリ状態:', {
      queryType: typeof query,
      hasRange: typeof query?.range,
      hasOrder: typeof query?.order,
      isSupabaseQuery: query && typeof query.range === 'function' && typeof query.order === 'function'
    });
    
    // クエリオブジェクトの整合性チェック
    if (!query || typeof query.range !== 'function' || typeof query.order !== 'function') {
      console.error('❌ クエリオブジェクトが破損しています:', {
        query,
        queryType: typeof query,
        hasRange: typeof query?.range,
        hasOrder: typeof query?.order,
        queryKeys: query ? Object.keys(query) : 'null',
        queryConstructor: query?.constructor?.name
      });
      throw new Error('クエリオブジェクトが破損しています');
    }
    
         // 追加の安全チェック
     console.log('🔍 クエリオブジェクト詳細:', {
       constructor: query?.constructor?.name,
       prototype: query?.__proto__?.constructor?.name,
       methods: {
         range: typeof query?.range,
         order: typeof query?.order,
         select: typeof query?.select
       }
     });
     
     // クエリオブジェクトの完全性チェック（実際に使用するメソッドのみ）
     const requiredMethods = ['range', 'order'];
     const missingMethods = requiredMethods.filter(method => typeof query[method] !== 'function');
     
     if (missingMethods.length > 0) {
       console.error('❌ 必要なメソッドが不足しています:', missingMethods);
       throw new Error(`必要なメソッドが不足しています: ${missingMethods.join(', ')}`);
     }
     
     console.log('✅ クエリオブジェクトの完全性チェック完了');
    
    return query;
  }

  /**
   * 複数条件の建物用途フィルターを処理
   * 個別クエリを実行して結果を統合
   */
  async searchWithMultipleBuildingTypes(
    buildingTypes: string[],
    language: 'ja' | 'en' = 'ja',
    page: number = 1,
    limit: number = 20
  ) {
    try {
      console.log('🔍 複数建物用途フィルター検索開始:', { buildingTypes, language });

      const column = language === 'ja' ? 'buildingTypes' : 'buildingTypesEn';
      const allResults: any[] = [];
      const seenIds = new Set<number>();

      // 各建物用途で個別に検索
      for (const buildingType of buildingTypes) {
        const { data, error } = await supabase
          .from('buildings_search_view')
          .select('*', { count: 'exact' })
          .ilike(column, `%${buildingType}%`)
          .order('building_id', { ascending: false });

        if (error) {
          console.warn(`🔍 建物用途「${buildingType}」の検索エラー:`, error);
          continue;
        }

        // 重複を除去して結果を統合
        if (data) {
          for (const building of data) {
            if (!seenIds.has(building.building_id)) {
              seenIds.add(building.building_id);
              allResults.push(building);
            }
          }
        }
      }

      // 結果をソート（建築物IDの降順）
      allResults.sort((a, b) => b.building_id - a.building_id);

      // ページネーションの適用
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedResults = allResults.slice(start, end);

      console.log('✅ 複数建物用途フィルター検索完了:', {
        totalResults: allResults.length,
        paginatedResults: paginatedResults.length,
        page,
        limit
      });

      return {
        data: paginatedResults,
        count: allResults.length,
        page,
        limit,
        totalPages: Math.ceil(allResults.length / limit)
      };

    } catch (error) {
      console.error('❌ 複数建物用途フィルター検索でエラー:', error);
      throw error;
    }
  }

  /**
   * 距離ソート用の検索（全データ取得後に距離でソートしてページネーション）
   */
  private async searchBuildingsWithDistanceSorting(
    filters: SearchFilters,
    language: 'ja' | 'en',
    page: number,
    limit: number
  ) {
    try {
      console.log('🔍 距離ソート検索開始:', { filters, language, page, limit });
      
      // allData変数を宣言
      let allData: any[] = [];
      
      // 基本クエリの構築（ページネーションなし）
      // 検索元の座標に近い建築物を優先的に取得するため、座標範囲で絞り込み
      let query = supabase
        .from('buildings_search_view')
        .select('*', { count: 'exact' });
      
             // 検索元の座標周辺の建築物を優先的に取得
       if (filters.currentLocation) {
         // より広い範囲で取得してから距離フィルタリングを適用
         const latRange = (filters.radius || 5) * 3 / 111.0; // 半径の3倍の範囲
         const lngRange = (filters.radius || 5) * 3 / (111.0 * Math.cos(filters.currentLocation.lat * Math.PI / 180));
         
         query = query
           .gte('lat', filters.currentLocation.lat - latRange)
           .lte('lat', filters.currentLocation.lat + latRange)
           .gte('lng', filters.currentLocation.lng - lngRange)
           .lte('lng', filters.currentLocation.lng + lngRange);
         
         console.log('🔍 座標範囲絞り込み適用:', {
           latRange,
           lngRange,
           latMin: filters.currentLocation.lat - latRange,
           latMax: filters.currentLocation.lat + latRange,
           lngMin: filters.currentLocation.lng - lngRange,
           lngMax: filters.currentLocation.lng + lngRange
         });
       }

      // フィルター条件を個別に適用
      if (filters.buildingTypes && filters.buildingTypes.length === 1) {
        const column = language === 'ja' ? 'buildingTypes' : 'buildingTypesEn';
        query = query.ilike(column, `%${filters.buildingTypes[0]}%`);
      }

      if (filters.prefectures && filters.prefectures.length > 0) {
        const column = language === 'ja' ? 'prefectures' : 'prefecturesEn';
        query = query.in(column, filters.prefectures);
      }

      if (filters.hasVideos) {
        query = query.not('youtubeUrl', 'is', null);
      }

      if (typeof filters.completionYear === 'number' && !isNaN(filters.completionYear)) {
        query = query.eq('completionYears', filters.completionYear);
      }

      if (filters.architects && filters.architects.length > 0) {
        const column = language === 'ja' ? 'architect_names_ja' : 'architect_names_en';
        query = query.ilike(column, `%${filters.architects[0]}%`);
      }

      if (filters.areas && filters.areas.length > 0) {
        const column = language === 'ja' ? 'areas' : 'areasEn';
        query = query.in(column, filters.areas);
      }

      if (filters.hasPhotos) {
        query = query.not('thumbnailUrl', 'is', null);
      }

      if (filters.query && filters.query.trim()) {
        if (language === 'ja') {
          query = query.ilike('title', `%${filters.query}%`);
        } else {
          query = query.ilike('titleEn', `%${filters.query}%`);
        }
      }

             // 座標範囲フィルタリングが適用されている場合は、rangeを使用せずに全データを取得
       console.log('🔍 座標範囲フィルタリングが適用されているため、rangeなしで全データを取得');
       
       try {
         const { data: fullData, error: fullError } = await query;
         
         if (fullError) {
           console.error('❌ 全データ取得エラー:', fullError);
           throw fullError;
         }
         
         if (!fullData || fullData.length === 0) {
           console.log('🔍 座標範囲内にデータが存在しません');
           return {
             data: [],
             count: 0,
             page,
             limit,
             totalPages: 0
           };
         }
         
         allData = fullData;
         console.log(`✅ 全データ取得成功: ${fullData.length}件`);
         
       } catch (fullError) {
         console.error('❌ 全データ取得でエラー:', fullError);
         throw fullError;
       }
      
      console.log('🔍 全データ取得完了:', {
        totalPages: page - 1, // currentPage - 1 は未定義なので、page - 1 に修正
        totalDataCount: allData.length
      });
      
      if (allData.length === 0) {
        return {
          data: [],
          count: 0,
          page,
          limit,
          totalPages: 0
        };
      }

      // 検索元の座標をログ出力
      console.log('🔍 検索元座標:', {
        lat: filters.currentLocation!.lat,
        lng: filters.currentLocation!.lng,
        radius: filters.radius
      });

      // 取得されたデータの座標範囲をログ出力
      const coordinates = allData.map(b => ({
        id: b.building_id,
        title: b.title,
        lat: b.lat,
        lng: b.lng
      }));
      console.log('🔍 取得されたデータの座標:', coordinates.slice(0, 5));

      // 距離を計算して各建築物に追加
      const buildingsWithDistance = allData.map(building => {
        const distance = this.calculateDistance(
          filters.currentLocation!.lat,
          filters.currentLocation!.lng,
          building.lat || 0,
          building.lng || 0
        );
        return { ...building, distance };
      });

      // 距離計算結果をログ出力
      console.log('🔍 距離計算結果:', buildingsWithDistance.slice(0, 5).map(b => ({
        id: b.building_id,
        title: b.title,
        distance: b.distance,
        distanceType: typeof b.distance,
        isZero: b.distance === 0,
        lat: b.lat,
        lng: b.lng
      })));
      
      // 0kmの建築物を特別にログ出力
      const zeroDistanceBuildings = buildingsWithDistance.filter(b => b.distance === 0);
      if (zeroDistanceBuildings.length > 0) {
        console.log('🔍 0kmの建築物:', zeroDistanceBuildings.map(b => ({
          id: b.building_id,
          title: b.title,
          distance: b.distance,
          lat: b.lat,
          lng: b.lng
        })));
      }

      // radiusでフィルタリング（距離が指定された半径内の建築物のみ）
      let filteredBuildings = buildingsWithDistance;
      if (filters.radius) {
        filteredBuildings = buildingsWithDistance.filter(building => 
          building.distance <= filters.radius!
        );
        
        console.log('🔍 radiusフィルタリング結果:', {
          beforeFiltering: buildingsWithDistance.length,
          afterFiltering: filteredBuildings.length,
          radius: filters.radius,
          maxDistance: Math.max(...filteredBuildings.map(b => b.distance || 0))
        });
      }

      // 距離でソート（昇順）
      filteredBuildings.sort((a, b) => {
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;
        
        // 0kmの場合は確実に最上位に
        if (distanceA === 0 && distanceB !== 0) return -1;
        if (distanceB === 0 && distanceA !== 0) return 1;
        
        // その他の場合は通常の数値比較
        return distanceA - distanceB;
      });
      
      // ソート結果の詳細ログ
      console.log('🔍 距離ソート詳細:', {
        totalBuildings: filteredBuildings.length,
        sortedDistances: filteredBuildings.slice(0, 10).map((b, index) => ({
          index,
          title: b.title,
          distance: b.distance,
          distanceType: typeof b.distance,
          isZero: b.distance === 0
        }))
      });

      console.log('🔍 距離ソート結果:', {
        totalBuildings: filteredBuildings.length,
        sortedDistances: filteredBuildings.slice(0, 10).map(b => ({
          title: b.title,
          distance: b.distance
        }))
      });

      // ページネーションを適用
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedResults = filteredBuildings.slice(start, end);

      return {
        data: paginatedResults,
        count: filteredBuildings.length,
        page,
        limit,
        totalPages: Math.ceil(filteredBuildings.length / limit)
      };

    } catch (error) {
      console.error('❌ 距離ソート検索でエラーが発生:', {
        error,
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : 'N/A'
      });
      
      // エラーの詳細をログ出力
      if (error && typeof error === 'object') {
        console.error('❌ エラーオブジェクトの詳細:', {
          keys: Object.keys(error),
          hasMessage: 'message' in error,
          hasCode: 'code' in error,
          hasDetails: 'details' in error,
          hasHint: 'hint' in error
        });
      }
      
      throw error;
    }
  }

  /**
   * 2点間の距離を計算（Haversine公式）
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // 地球の半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 総件数を取得
   */
  async getTotalCount(filters: SearchFilters, language: 'ja' | 'en' = 'ja') {
    try {
      let query = supabase
        .from('buildings_search_view')
        .select('building_id', { count: 'exact', head: true });

      query = this.applyFilters(query, filters, language);

      const { count, error } = await query;

      if (error) {
        console.error('❌ 総件数取得エラー:', error);
        return 0;
      }

      return count || 0;

    } catch (error) {
      console.error('❌ 総件数取得でエラー:', error);
      return 0;
    }
  }
}
