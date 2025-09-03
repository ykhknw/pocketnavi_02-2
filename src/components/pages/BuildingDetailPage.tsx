// React import not required with JSX runtime
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseToggle } from '../../hooks/useSupabaseToggle';
import { useBuildingBySlug } from '../../hooks/useSupabaseBuildings';
import { useAppContext } from '../providers/AppProvider';
import { AppHeader } from '../layout/AppHeader';
import { BuildingDetail } from '../BuildingDetail';
import Sidebar from '../layout/Sidebar';
import { Footer } from '../layout/Footer';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { ScrollToTopButton } from '../ScrollToTopButton';

export function BuildingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { useApi } = useSupabaseToggle();
  const context = useAppContext();
  
  // slugを直接使用して建築物を取得
  const { building, loading, error } = useBuildingBySlug(slug || null, useApi);

  // URLのstateから建築物データを取得（優先）
  const buildingFromState = location.state?.building;
  const finalBuilding = buildingFromState || building;

  // navigate(-1) を直接ボタンで使用するため、handleCloseは削除

  const handleLike = (_buildingId: number) => {
    // Like処理（実装は省略）
  };

  const handlePhotoLike = (_photoId: number) => {
    // Photo like処理（実装は省略）
  };

  // 検索周辺機能はSidebarのMap側で処理、ここでは未使用

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

  // 表示インデックス: 一覧から渡された値を優先し、なければ一覧の並びで推定
  const displayIndex = (() => {
    if (!finalBuilding || !context) return 1;
    const fromState = location.state?.displayIndex as number | undefined;
    if (typeof fromState === 'number' && fromState > 0) return fromState;
    const idx = context.currentBuildings.findIndex(b => b.id === finalBuilding.id);
    return idx >= 0 ? context.startIndex + idx + 1 : 1;
  })();

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
        language={context.language}
        onLanguageToggle={context.toggleLanguage}
      />
      
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* 一覧に戻るボタンと見出し（カードと同じ左端に揃える） */}
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // 一覧ページに確実に戻る
                      if (location.state?.fromList) {
                        // 一覧ページから来た場合は履歴を戻る
                        navigate(-1);
                      } else {
                        // 直接アクセスや他のページからの場合は一覧ページに遷移
                        // 検索条件があれば保持して戻る
                        const searchParams = new URLSearchParams();
                        if (location.state?.filters) {
                          Object.entries(location.state.filters).forEach(([key, value]) => {
                            if (value && Array.isArray(value) && value.length > 0) {
                              searchParams.set(key, value.join(','));
                            } else if (value && typeof value === 'string') {
                              searchParams.set(key, value);
                            }
                          });
                        }
                        const queryString = searchParams.toString();
                        navigate(queryString ? `/?${queryString}` : '/');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {context.language === 'ja' ? '一覧に戻る' : 'Back to List'}
                  </Button>
                  <h2 className="text-xl font-bold">
                    {context.language === 'ja' ? '建築物詳細' : 'Building Details'}
                  </h2>
                </div>
              </div>

              {/* 建築物詳細 */}
              <div className="max-w-3xl mx-auto">
                <BuildingDetail
                  building={finalBuilding}
                  onLike={handleLike}
                  onPhotoLike={handlePhotoLike}
                  language={context.language}
                  displayIndex={displayIndex}
                />
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <Sidebar
              buildings={context.currentBuildings || []}
              selectedBuilding={finalBuilding}
              onBuildingSelect={() => {/* 詳細ページでは未使用 */}}
              currentLocation={context.locationLoading ? null : { lat: 0, lng: 0 }}
              startIndex={context.startIndex}
              onSearchAround={context.handleSearchAround}
              language={context.language}
              likedBuildings={context.likedBuildings}
              onLikedBuildingClick={context.handleLikedBuildingClick}
              onRemoveLikedBuilding={context.handleRemoveLikedBuilding}
              recentSearches={context.searchHistory || []}
              popularSearches={context.popularSearches || []}
              onSearchClick={context.handleSearchFromHistory}
            />
          </div>
        </div>
      </div>

      <Footer language={context.language} />

      {/* スクロールトップボタン */}
      <ScrollToTopButton 
        variant="fab" 
        language={context.language}
      />
    </div>
  );
} 