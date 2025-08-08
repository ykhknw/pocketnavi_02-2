import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useSupabaseToggle } from '../../hooks/useSupabaseToggle';
import { useBuildingBySlug } from '../../hooks/useSupabaseBuildings';
import { useAppContext } from '../providers/AppProvider';
import { AppHeader } from '../layout/AppHeader';
import { BuildingDetail } from '../BuildingDetail';
import { Sidebar } from '../layout/Sidebar';
import { Footer } from '../layout/Footer';
import { SearchForm } from '../SearchForm';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';

// この関数は不要になったため削除

export function BuildingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { useApi } = useSupabaseToggle();
  const context = useAppContext();
  
  // 特定の建築物をslugで取得（slugフィールドを優先）
  const { building, loading, error } = useBuildingBySlug(slug, useApi);

  // URLのstateから建築物データを取得（優先）
  const buildingFromState = location.state?.building;
  const finalBuilding = buildingFromState || building;

  const handleClose = () => {
    // ブラウザの履歴を使用して前のページに戻る
    navigate(-1);
  };

  const handleLike = (buildingId: number) => {
    // Like処理（実装は省略）
    console.log('Like building:', buildingId);
  };

  const handlePhotoLike = (photoId: number) => {
    // Photo like処理（実装は省略）
    console.log('Like photo:', photoId);
  };

  const handleSearchAround = (lat: number, lng: number) => {
    navigate(`/?lat=${lat}&lng=${lng}&radius=2`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">読み込み中...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!finalBuilding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">建築物が見つかりません</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  // 表示インデックスを計算（簡易版）
  const displayIndex = 1; // 詳細ページでは常に1として表示

  if (!context) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader
        isAuthenticated={context.isAuthenticated}
        currentUser={context.currentUser}
        onLoginClick={() => context.setShowLoginModal(true)}
        onLogout={() => {/* handle logout */}}
        onAdminClick={() => context.setShowAdminPanel(true)}
        language={language}
        onLanguageToggle={context.toggleLanguage}
      />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* 一覧に戻るボタンと見出し */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {language === 'ja' ? '一覧に戻る' : 'Back to List'}
                </Button>
                <h2 className="text-xl font-bold">
                  {language === 'ja' ? '建築物詳細' : 'Building Details'}
                </h2>
              </div>

              {/* 建築物詳細 */}
              <div className="max-w-3xl mx-auto">
                <BuildingDetail
                  building={finalBuilding}
                  onLike={handleLike}
                  onPhotoLike={handlePhotoLike}
                  language={language}
                  displayIndex={displayIndex}
                />
              </div>

              {/* 検索フォーム */}
              <div className="max-w-3xl mx-auto">
                <SearchForm
                  filters={context.filters}
                  onFiltersChange={context.setFilters}
                  onGetLocation={context.getCurrentLocation}
                  locationLoading={context.locationLoading}
                  locationError={context.locationError}
                  language={language}
                  onSearchStart={context.handleSearchStart}
                />
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <Sidebar
              buildings={context.currentBuildings}
              selectedBuilding={finalBuilding}
              onBuildingSelect={context.handleBuildingSelect}
              currentLocation={context.filters.currentLocation}
              language={language}
              startIndex={context.startIndex}
              onSearchAround={context.handleSearchAround}
              likedBuildings={context.likedBuildings}
              onLikedBuildingClick={context.handleLikedBuildingClick}
              onRemoveLikedBuilding={context.handleRemoveLikedBuilding}
              recentSearches={context.searchHistory}
              popularSearches={context.popularSearches}
              onSearchClick={context.handleSearchFromHistory}
            />
          </div>
        </div>
      </div>
      
      <Footer language={language} />
    </div>
  );
} 