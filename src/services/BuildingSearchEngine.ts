import { supabase } from '../lib/supabase';
import { SearchFilters, Building } from '../types';

export class BuildingSearchEngine {
  // 基本的なクエリを構築
  buildBaseQuery() {
    return supabase
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
  }

  // 建築家名による建築物ID検索
  async searchBuildingIdsByArchitectName(query: string): Promise<number[]> {
    try {
      console.log('🔍 建築家名検索開始（新しいテーブル構造）:', query);
      
      // ステップ1: individual_architectsで建築家名を検索
      const { data: individualArchitects, error: individualError } = await supabase
        .from('individual_architects')
        .select('individual_architect_id')
        .or(`name_ja.ilike.%${query}%,name_en.ilike.%${query}%`);
      
      if (individualError) {
        console.warn('🔍 建築家名検索エラー（ステップ1）:', individualError);
        return [];
      }
      
      if (!individualArchitects || individualArchitects.length === 0) {
        return [];
      }
      
      const individualArchitectIds = individualArchitects.map(a => a.individual_architect_id);
      console.log('🔍 建築家名検索結果（individual_architect_id）:', individualArchitectIds.length, '件');
      
      // ステップ2: architect_compositionsからarchitect_idを取得
      const { data: compositions, error: compositionError } = await supabase
        .from('architect_compositions')
        .select('architect_id')
        .in('individual_architect_id', individualArchitectIds);
      
      if (compositionError) {
        console.warn('🔍 建築家名検索エラー（ステップ2）:', compositionError);
        return [];
      }
      
      if (!compositions || compositions.length === 0) {
        return [];
      }
      
      const architectIds = compositions.map(c => c.architect_id);
      console.log('🔍 建築家名検索結果（architect_id）:', architectIds.length, '件');
      
      // ステップ3: architect_idから建築物IDを取得
      const { data: buildingIds, error: buildingError } = await supabase
        .from('building_architects')
        .select('building_id')
        .in('architect_id', architectIds);
      
      if (buildingError) {
        console.warn('🔍 建築家名検索エラー（ステップ3）:', buildingError);
        return [];
      }
      
      if (!buildingIds || buildingIds.length === 0) {
        return [];
      }
      
      const allBuildingIds = buildingIds.map(b => b.building_id);
      console.log('🔍 建築家名検索結果（building_id）:', allBuildingIds.length, '件');
      
      return allBuildingIds;
    } catch (error) {
      console.warn('🔍 建築家名検索でエラー:', error);
      return [];
    }
  }

  // テキスト検索条件を構築
  buildTextSearchConditions(query: string, language: 'ja' | 'en'): string[] {
    const conditions: string[] = [];
    
    if (language === 'ja') {
      conditions.push(`title.ilike.%${query}%`);
      conditions.push(`buildingTypes.ilike.%${query}%`);
      conditions.push(`location.ilike.%${query}%`);
    } else {
      conditions.push(`titleEn.ilike.%${query}%`);
      conditions.push(`buildingTypesEn.ilike.%${query}%`);
      conditions.push(`locationEn_from_datasheetChunkEn.ilike.%${query}%`);
    }
    
    return conditions;
  }

  // フィルターをクエリに適用
  async applyFiltersToQuery(query: any, filters: SearchFilters, language: 'ja' | 'en'): Promise<any> {
    // クエリが既に実行されている場合は、新しいクエリを構築
    if (query && query.data !== undefined) {
      console.warn('🔍 クエリが既に実行されています。新しいクエリを構築します。');
      query = this.buildBaseQuery();
    }

    // クエリが正しいSupabaseクエリビルダーかチェック
    if (!query || typeof query.order !== 'function' || typeof query.range !== 'function') {
      console.warn('🔍 クエリが正しいSupabaseクエリビルダーではありません。新しいクエリを構築します。');
      query = this.buildBaseQuery();
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
              try {
                query = query.in('building_id', filterBuildingIds);
                // フィルター適用後にクエリの状態をチェック
                if (!query || typeof query.order !== 'function' || typeof query.range !== 'function') {
                  console.warn('🔍 建築家フィルター適用後、クエリが不正な状態になりました。新しいクエリを構築します。');
                  query = this.buildBaseQuery();
                }
              } catch (error) {
                console.warn('🔍 建築家フィルター適用エラー:', error);
                query = this.buildBaseQuery();
              }
              
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
      
      try {
        // .or()メソッドの代わりに、個別の条件を適用
        const conditions = filters.buildingTypes.map(type => 
          `${column}.ilike.%${String(type).replace(/[,]/g, '')}%`
        );
        
        // 最初の条件でクエリを開始
        query = query.or(conditions[0]);
        
        // 残りの条件を追加（最初の条件が既に適用されているため、スキップ）
        for (let i = 1; i < conditions.length; i++) {
          try {
            query = query.or(conditions[i]);
          } catch (error) {
            console.warn(`🔍 建物用途フィルター条件${i}の適用エラー:`, error);
            break;
          }
        }
        
        console.log('🔍 建物用途フィルター適用完了:', {
          filters: filters.buildingTypes,
          column,
          conditions: conditions.length
        });
        
        // フィルター適用後にクエリの状態をチェック
        if (!query || typeof query.order !== 'function' || typeof query.range !== 'function') {
          console.warn('🔍 建物用途フィルター適用後、クエリが不正な状態になりました。新しいクエリを構築します。');
          query = this.buildBaseQuery();
        }
      } catch (error) {
        console.warn('🔍 建物用途フィルター適用エラー:', error);
        // エラーが発生した場合は、新しいクエリを構築
        query = this.buildBaseQuery();
      }
    }

    // 都道府県フィルター（言語切替対応）
    if (filters.prefectures.length > 0) {
      const column = language === 'ja' ? 'prefectures' : 'prefecturesEn';
      try {
        query = query.in(column as any, filters.prefectures);
        // フィルター適用後にクエリの状態をチェック
        if (!query || typeof query.order !== 'function' || typeof query.range !== 'function') {
          console.warn('🔍 都道府県フィルター適用後、クエリが不正な状態になりました。新しいクエリを構築します。');
          query = this.buildBaseQuery();
        }
      } catch (error) {
        console.warn('🔍 都道府県フィルター適用エラー:', error);
        query = this.buildBaseQuery();
      }
    }

    // 動画フィルター
    if (filters.hasVideos) {
      try {
        query = query.not('youtubeUrl', 'is', null);
        // フィルター適用後にクエリの状態をチェック
        if (!query || typeof query.order !== 'function' || typeof query.range !== 'function') {
          console.warn('🔍 動画フィルター適用後、クエリが不正な状態になりました。新しいクエリを構築します。');
          query = this.buildBaseQuery();
        }
      } catch (error) {
        console.warn('🔍 動画フィルター適用エラー:', error);
        query = this.buildBaseQuery();
      }
    }

    // 建築年フィルター
    if (typeof filters.completionYear === 'number' && !isNaN(filters.completionYear)) {
      try {
        query = query.eq('completionYears', filters.completionYear);
        // フィルター適用後にクエリの状態をチェック
        if (!query || typeof query.order !== 'function' || typeof query.range !== 'function') {
          console.warn('🔍 建築年フィルター適用後、クエリが不正な状態になりました。新しいクエリを構築します。');
          query = this.buildBaseQuery();
        }
      } catch (error) {
        console.warn('🔍 建築年フィルター適用エラー:', error);
        query = this.buildBaseQuery();
      }
    }

    // 住宅系の除外（無効化 - クエリ破綻の原因）
    // if (filters.excludeResidential !== false) {
    //   try {
    //     console.log('🔍 住宅除外フィルター適用前のクエリ状態:', {
    //       queryType: typeof query,
    //       hasOrder: typeof query?.order,
    //       hasRange: typeof query?.range,
    //       queryConstructor: query?.constructor?.name
    //     });
        
    //     query = query
    //       .not('buildingTypes', 'eq', '住宅')
    //       .not('buildingTypesEn', 'eq', 'housing');
          
    //     console.log('🔍 住宅除外フィルター適用後のクエリ状態:', {
    //       queryType: typeof query,
    //       hasOrder: typeof query?.order,
    //       hasRange: typeof query?.range,
    //       queryConstructor: query?.constructor?.name,
    //       queryKeys: query ? Object.keys(query) : 'null'
    //     });
        
    //     // フィルター適用後にクエリの状態をチェック
    //     if (!query || typeof query.order !== 'function' || typeof query.range !== 'function') {
    //       console.warn('🔍 住宅除外フィルター適用後、クエリが不正な状態になりました。新しいクエリを構築します。');
    //       query = this.buildBaseQuery();
    //     }
    //   } catch (error) {
    //     console.warn('🔍 住宅除外フィルター適用エラー:', error);
    //     query = this.buildBaseQuery();
    //   }
    // }

    console.log('🔍 BuildingSearchEngine.applyFiltersToQuery 完了:', {
      queryType: typeof query,
      hasOrder: typeof query?.order,
      hasRange: typeof query?.range,
      queryConstructor: query?.constructor?.name,
      queryKeys: query ? Object.keys(query) : 'null',
      isSupabaseQuery: query && typeof query.order === 'function' && typeof query.range === 'function',
      hasData: query && query.data !== undefined,
      queryValue: query
    });

    return query;
  }

  // RPC関数用のフィルターパラメータを構築
  buildRPCFilterParams(filters: SearchFilters, language: 'ja' | 'en'): {
    hasFilters: boolean;
    params: any;
  } {
    const params: any = {};
    let hasFilters = false;

    // 建物用途フィルター
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      params.building_types = filters.buildingTypes;
      hasFilters = true;
    }

    // 都道府県フィルター
    if (filters.prefectures && filters.prefectures.length > 0) {
      params.prefectures = filters.prefectures;
      hasFilters = true;
    }

    // 動画フィルター
    if (filters.hasVideos) {
      params.has_videos = true;
      hasFilters = true;
    }

    // 建築年フィルター
    if (typeof filters.completionYear === 'number' && !isNaN(filters.completionYear)) {
      params.completion_year = filters.completionYear;
      hasFilters = true;
    }

    // 言語設定
    params.language = language;

    console.log('�� RPCフィルターパラメータ:', {
      hasFilters,
      params
    });

    return { hasFilters, params };
  }
}
