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

      if (filters.q && filters.q.trim()) {
        if (language === 'ja') {
          query = query.ilike('title', `%${filters.q}%`);
        } else {
          query = query.ilike('titleEn', `%${filters.q}%`);
        }
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
        
        return {
          data: data || [],
          count: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        };
        
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
    if (filters.q && filters.q.trim()) {
      // 日本語の場合はタイトルでのみ検索、英語の場合は英語タイトルでのみ検索
      // 複数条件を避けて、単一条件のみを適用
      if (language === 'ja') {
        query = query.ilike('title', `%${filters.q}%`);
      } else {
        query = query.ilike('titleEn', `%${filters.q}%`);
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
