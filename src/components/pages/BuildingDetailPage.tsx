import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import { useSupabaseToggle } from '../../hooks/useSupabaseToggle';
import { useBuildingById } from '../../hooks/useSupabaseBuildings';
import { Header } from '../Header';
import { BuildingDetail } from '../BuildingDetail';

// slugから建築物IDを抽出する関数
function extractIdFromSlug(slug: string): number {
  const id = slug.split('-')[0];
  return parseInt(id, 10);
}

export function BuildingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { useApi } = useSupabaseToggle();
  
  // slugから建築物IDを抽出
  const buildingId = slug ? extractIdFromSlug(slug) : null;
  
  // 特定の建築物IDを取得
  const { building, loading, error } = useBuildingById(buildingId, useApi);

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

  return (
    <div className="min-h-screen bg-background">
      <Header
        isAuthenticated={false}
        currentUser={null}
        onLoginClick={() => {}}
        onLogout={() => {}}
        onAdminClick={() => {}}
        language={language}
        onLanguageToggle={() => {}}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BuildingDetail
          building={finalBuilding}
          onLike={handleLike}
          onPhotoLike={handlePhotoLike}
          language={language}
          displayIndex={displayIndex}
        />
      </main>
    </div>
  );
} 