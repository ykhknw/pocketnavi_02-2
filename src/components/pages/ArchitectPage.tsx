import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../providers/AppProvider';
import { AppHeader } from '../layout/AppHeader';
import { Footer } from '../layout/Footer';
import { BuildingCard } from '../BuildingCard';
import { Building } from '../../types';
import { supabaseApiClient } from '../../services/supabase-api';
import Sidebar from '../layout/Sidebar';
import { ScrollToTopButton } from '../ScrollToTopButton';

export function ArchitectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const context = useAppContext();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [architectName, setArchitectName] = useState<string>('');
  
  // ページャー用の状態
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [currentBuildings, setCurrentBuildings] = useState<Building[]>([]);

  console.log('🔍 ArchitectPage レンダリング, slug:', slug);

  // ページ変更処理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setCurrentBuildings(buildings.slice(startIndex, endIndex));
  };

  // ページ変更時のuseEffect
  useEffect(() => {
    if (buildings.length > 0) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setCurrentBuildings(buildings.slice(startIndex, endIndex));
    }
  }, [currentPage, itemsPerPage, buildings]);

  // ページャー範囲計算
  const getPaginationRange = () => {
    const totalPages = Math.ceil(buildings.length / itemsPerPage);
    const delta = 2; // 現在のページの前後2ページずつ表示
    const range = [];
    const rangeWithDots = [];

    // 現在のページの前後のページを取得
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // 最初のページ
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    // 中間のページ
    rangeWithDots.push(...range);

    // 最後のページ
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      // 最後のページがまだ含まれていない場合のみ追加
      if (!rangeWithDots.includes(totalPages)) {
        rangeWithDots.push(totalPages);
      }
    }

    return { pages: rangeWithDots, totalPages };
  };

  useEffect(() => {
    const loadArchitectBuildings = async () => {
      if (!slug) return;

      console.log('🔍 建築家ページ読み込み開始:', slug);

      try {
        setLoading(true);
        setError(null);

        // 建築家のslugから建築家IDを取得（ハイブリッド実装）
        console.log('🔍 建築家情報取得開始');
        const architect = await supabaseApiClient.getArchitectBySlugHybrid(slug);
        if (!architect) {
          console.log('❌ 建築家が見つかりません:', slug);
          setError('建築家が見つかりません');
          return;
        }
        console.log('✅ 建築家情報取得成功:', architect);

        // 建築家の名前は後でgetArchitectBuildingsBySlugから取得するため、ここでは設定しない

        // その建築家の作品を取得（slugベース）
        console.log('🔍 建築家の作品取得開始');
        const result = await supabaseApiClient.getArchitectBuildingsBySlug(slug);
        console.log('✅ 建築家の作品取得完了:', result);
        
        // 建築物データの構造を確認
        if (result.buildings.length > 0) {
          console.log('🔍 最初の建築物データ構造:', result.buildings[0]);
          console.log('🔍 建築家情報:', result.buildings[0].architects);
          console.log('🔍 用途情報:', result.buildings[0].buildingTypes);
          console.log('🔍 完成年:', result.buildings[0].completionYears);
          console.log('🔍 住所情報:', result.buildings[0].location);
          console.log('🔍 都道府県:', result.buildings[0].prefectures);
          
          // 複数の建築物の情報も確認
          if (result.buildings.length > 1) {
            console.log('🔍 2番目の建築物:', {
              architects: result.buildings[1].architects,
              buildingTypes: result.buildings[1].buildingTypes,
              location: result.buildings[1].location,
              prefectures: result.buildings[1].prefectures
            });
          }
        }
        
        // SQLレベルでフィルタリング済みのため、クライアントサイドでの追加フィルタリングは不要
        setBuildings(result.buildings);
        setArchitectName(context.language === 'ja' ? result.architectName.ja : result.architectName.en);
        
        // ページャー計算
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setCurrentBuildings(result.buildings.slice(startIndex, endIndex));
      } catch (err) {
        console.error('❌ 建築家ページエラー:', err);
        setError('エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    loadArchitectBuildings();
  }, [slug, context.language]); // currentPage, itemsPerPageを依存関係から削除

  if (!context) {
    return <div>Loading...</div>;
  }

  const {
    isAuthenticated,
    currentUser,
    showLoginModal,
    setShowLoginModal,
    showAdminPanel,
    setShowAdminPanel,
    language,
    toggleLanguage
  } = context;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={() => {/* handle logout */}}
          onAdminClick={() => setShowAdminPanel(true)}
          language={language}
          onLanguageToggle={toggleLanguage}
        />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader
          isAuthenticated={isAuthenticated}
          currentUser={currentUser}
          onLoginClick={() => setShowLoginModal(true)}
          onLogout={() => {/* handle logout */}}
          onAdminClick={() => setShowAdminPanel(true)}
          language={language}
          onLanguageToggle={toggleLanguage}
        />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              {language === 'ja' ? 'ホームに戻る' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={() => {/* handle logout */}}
        onAdminClick={() => setShowAdminPanel(true)}
        language={language}
        onLanguageToggle={toggleLanguage}
      />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* 建築家情報ヘッダー */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {architectName}
              </h1>
              <p className="text-gray-600">
                {language === 'ja' ? '作品一覧' : 'Works'} ({buildings.length})
              </p>
            </div>

            {/* 建築物リスト */}
            {buildings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {language === 'ja' ? '作品が見つかりません' : 'No works found'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {currentBuildings.map((building, index) => {
                    const globalIndex = (currentPage - 1) * itemsPerPage + index;
                    
                    // デバッグ用: 建築家情報の確認
                    console.log(`🔍 建築物 ${building.id} (${building.title}) の建築家情報:`, {
                      architects: building.architects,
                      architectsLength: building.architects?.length,
                      firstArchitect: building.architects?.[0],
                      architectJa: building.architects?.[0]?.architectJa,
                      architectEn: building.architects?.[0]?.architectEn,
                      slug: building.architects?.[0]?.slug
                    });
                    
                    return (
                      <BuildingCard
                        key={building.id}
                        building={building}
                        onSelect={context.handleBuildingSelect}
                        onLike={context.handleLike}
                        onPhotoLike={context.handlePhotoLike}
                        isSelected={false}
                        index={globalIndex}
                        language={language}
                      />
                    );
                  })}
                </div>
                
                {/* ページャー */}
                {buildings.length > itemsPerPage && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-6 py-3 rounded-lg bg-white border border-gray-300 text-base font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 min-w-[80px] min-h-[44px] flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {language === 'ja' ? '前へ' : 'Previous'}
                      </button>
                      
                      {getPaginationRange().pages.map((page, index) => (
                        <button
                          key={index}
                          onClick={() => typeof page === 'number' ? handlePageChange(page) : undefined}
                          disabled={typeof page !== 'number'}
                          className={`px-3 py-2 rounded-md text-sm font-medium ${
                            typeof page === 'number'
                              ? page === currentPage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              : 'text-gray-400 cursor-default'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getPaginationRange().totalPages}
                        className="px-6 py-3 rounded-lg bg-white border border-gray-300 text-base font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 min-w-[80px] min-h-[44px] flex items-center justify-center gap-2"
                      >
                        {language === 'ja' ? '次へ' : 'Next'}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <Sidebar
              buildings={currentBuildings}
              selectedBuilding={null}
              onBuildingSelect={context.handleBuildingSelect}
              currentLocation={context.filters?.currentLocation}
              language={language}
              startIndex={(currentPage - 1) * itemsPerPage}
              onSearchAround={context.handleSearchAround}
              likedBuildings={context.likedBuildings || []}
              onLikedBuildingClick={context.handleLikedBuildingClick}
              onRemoveLikedBuilding={context.handleRemoveLikedBuilding}
              recentSearches={context.searchHistory || []}
              popularSearches={context.popularSearches || []}
              popularSearchesLoading={context.popularSearchesLoading || false}
              popularSearchesError={context.popularSearchesError || null}
              onSearchClick={context.handleSearchFromHistory}
              onRemoveRecentSearch={context.handleRemoveRecentSearch}
              onFilterSearchClick={(filters) => {
                if (filters) {
                  // Architectページではトップへ遷移し、クエリで反映
                  const params = new URLSearchParams();
                  if (filters.buildingTypes && filters.buildingTypes.length > 0) {
                    params.set('buildingTypes', filters.buildingTypes[0]);
                  }
                  if (filters.prefectures && filters.prefectures.length > 0) {
                    params.set('prefectures', filters.prefectures[0]);
                  }
                  if (params.toString()) {
                    navigate(`/?${params.toString()}`);
                  }
                }
              }}
              showAdminPanel={false}
            />
          </div>
        </div>
      </div>
      
      <Footer language={language} />

      {/* スクロールトップボタン */}
      <ScrollToTopButton 
        variant="fab" 
        language={language}
      />
    </div>
  );
}
