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

      // 基本クエリの構築
      let query = supabase
        .from('buildings_search_view')
        .select('*');

      // フィルター条件の適用
      query = this.applyFilters(query, filters, language);

      // ページネーションの適用
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end);

      // ソート順の設定（建築物IDの降順）
      query = query.order('building_id', { ascending: false });

      // クエリオブジェクトの最終状態を確認
      console.log('🔍 最終クエリオブジェクト:', {
        queryType: typeof query,
        hasRange: typeof query?.range,
        hasOrder: typeof query?.order,
        queryKeys: query ? Object.keys(query) : 'null'
      });

      console.log('🔍 ビュー検索クエリ実行:', { start, end, limit });

      // クエリの実行（タイムアウト付き）
      console.log('🔍 クエリ実行開始...');
      
      // 30秒のタイムアウトを設定
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('クエリタイムアウト（30秒）')), 30000);
      });
      
      const queryPromise = query;
      
      const { data, error, count } = await Promise.race([queryPromise, timeoutPromise]);
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

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };

    } catch (error) {
      console.error('❌ ビュー検索でエラーが発生:', error);
      throw error;
    }
  }

  /**
   * フィルター条件をクエリに適用
   */
  private applyFilters(
    query: any,
    filters: SearchFilters,
    language: 'ja' | 'en'
  ) {
    console.log('🔍 ビューフィルター適用開始:', { filters, language });

    // 建物用途フィルター
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      const column = language === 'ja' ? 'buildingTypes' : 'buildingTypesEn';
      const conditions = filters.buildingTypes.map(type => 
        `${column}.ilike.%${String(type).replace(/[,]/g, '')}%`
      );
      
      // 複数条件をORで結合
      if (conditions.length === 1) {
        query = query.ilike(column, `%${filters.buildingTypes[0]}%`);
      } else {
        // 複数条件の場合は、個別にクエリを実行して結果を統合
        console.log('🔍 複数建物用途フィルター検出:', conditions);
      }
    }

    // 都道府県フィルター
    if (filters.prefectures && filters.prefectures.length > 0) {
      const column = language === 'ja' ? 'prefectures' : 'prefecturesEn';
      query = query.in(column, filters.prefectures);
    }

    // 動画フィルター
    if (filters.hasVideos) {
      query = query.not('youtubeUrl', 'is', null);
    }

    // 建築年フィルター
    if (typeof filters.completionYear === 'number' && !isNaN(filters.completionYear)) {
      query = query.eq('completionYears', filters.completionYear);
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
      const titleColumn = language === 'ja' ? 'title' : 'titleEn';
      const locationColumn = language === 'ja' ? 'location' : 'locationEn';
      
      query = query.or(
        `${titleColumn}.ilike.%${filters.q}%,${locationColumn}.ilike.%${filters.q}%`
      );
    }

    console.log('🔍 ビューフィルター適用完了');
    
    // フィルター適用後のクエリ状態を確認
    console.log('🔍 フィルター適用後のクエリ状態:', {
      queryType: typeof query,
      hasRange: typeof query?.range,
      hasOrder: typeof query?.order,
      isSupabaseQuery: query && typeof query.range === 'function' && typeof query.order === 'function'
    });
    
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
          .select('*')
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
