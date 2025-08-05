import { supabase } from '../lib/supabase';

// SupabaseApiClientクラスを直接定義（簡略版）
class DebugSupabaseApiClient {
  async searchBuildings(filters: any, page: number = 1, limit: number = 10) {
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

    // 都道府県フィルター
    if (filters.prefectures.length > 0) {
      query = query.in('prefectures', filters.prefectures);
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data: buildings, error, count } = await query
      .order('building_id', { ascending: false })
      .range(start, end);

    if (error) {
      throw new Error(error.message);
    }

    return {
      buildings: buildings || [],
      total: count || 0
    };
  }
}

export async function debugSupabaseData() {
  console.log('=== Supabase Data Debug ===');
  
  try {
    // 三重県のデータを確認
    const { data: mieBuildings, error: mieError } = await supabase
      .from('buildings_table_2')
      .select('*')
      .eq('prefectures', '三重県')
      .limit(10);

    console.log('三重県の建築物データ:', mieBuildings);
    console.log('三重県データエラー:', mieError);
    console.log('三重県データ数:', mieBuildings?.length || 0);

    // 全データの都道府県分布を確認
    const { data: allPrefectures, error: prefecturesError } = await supabase
      .from('buildings_table_2')
      .select('prefectures')
      .not('prefectures', 'is', null);

    if (allPrefectures) {
      const prefectureCounts: Record<string, number> = {};
      allPrefectures.forEach(building => {
        const prefecture = building.prefectures;
        if (prefecture) {
          prefectureCounts[prefecture] = (prefectureCounts[prefecture] || 0) + 1;
        }
      });
      
      console.log('都道府県別データ数:', prefectureCounts);
    }

    // 全データ数を確認
    const { count: totalCount, error: countError } = await supabase
      .from('buildings_table_2')
      .select('*', { count: 'exact', head: true });

    console.log('全データ数:', totalCount);
    console.log('カウントエラー:', countError);

  } catch (error) {
    console.error('デバッグエラー:', error);
  }
}

export async function debugSearchProcess() {
  console.log('=== Search Process Debug ===');
  
  try {
    const apiClient = new DebugSupabaseApiClient();
    
    // 三重県で検索を実行
    const searchFilters = {
      query: '',
      radius: 10,
      architects: [],
      buildingTypes: [],
      prefectures: ['三重県'],
      areas: [],
      hasPhotos: false,
      hasVideos: false,
      currentLocation: null
    };

    console.log('検索フィルター:', searchFilters);
    
    const result = await apiClient.searchBuildings(searchFilters, 1, 10);
    
    console.log('検索結果:', {
      buildingsCount: result.buildings.length,
      total: result.total,
      buildings: result.buildings
    });

    // 最初の建築物の詳細を確認
    if (result.buildings.length > 0) {
      console.log('最初の建築物の詳細:', result.buildings[0]);
    }

  } catch (error) {
    console.error('検索プロセスデバッグエラー:', error);
  }
} 