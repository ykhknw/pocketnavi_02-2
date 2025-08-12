import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../providers/AppProvider';
import { AppHeader } from '../layout/AppHeader';
import { Footer } from '../layout/Footer';
import { BuildingCard } from '../BuildingCard';
import { Building } from '../../types';
import { supabaseApiClient } from '../../services/supabase-api';

export function ArchitectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const context = useAppContext();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [architectName, setArchitectName] = useState<string>('');

  useEffect(() => {
    const loadArchitectBuildings = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // 建築家のslugから建築家IDを取得
        const { data: architect, error: architectError } = await supabaseApiClient.supabase
          .from('architects_table')
          .select('architect_id, architectJa, architectEn')
          .eq('slug', slug)
          .single();

        if (architectError || !architect) {
          setError('建築家が見つかりません');
          return;
        }

        setArchitectName(context.language === 'ja' ? architect.architectJa : architect.architectEn);

        // その建築家の作品を取得
        const { data: buildingsData, error: buildingsError } = await supabaseApiClient.supabase
          .from('buildings_table_2')
          .select(`
            *,
            building_architects!inner(
              architects_table(*)
            )
          `)
          .eq('building_architects.architect_id', architect.architect_id);

        if (buildingsError) {
          setError('作品の取得に失敗しました');
          return;
        }

        // 建築物データを変換
        const transformedBuildings = await Promise.all(
          buildingsData.map(building => supabaseApiClient.transformBuilding(building))
        );

        setBuildings(transformedBuildings);
      } catch (err) {
        setError('エラーが発生しました');
        console.error('建築家ページエラー:', err);
      } finally {
        setLoading(false);
      }
    };

    loadArchitectBuildings();
  }, [slug, context.language]);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {architectName}
          </h1>
          <p className="text-gray-600">
            {language === 'ja' ? '作品一覧' : 'Works'} ({buildings.length})
          </p>
        </div>

        {buildings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {language === 'ja' ? '作品が見つかりません' : 'No works found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building, index) => (
              <BuildingCard
                key={building.id}
                building={building}
                onSelect={context.handleBuildingSelect}
                onLike={context.handleLike}
                onPhotoLike={context.handlePhotoLike}
                isSelected={false}
                index={index}
                language={language}
              />
            ))}
          </div>
        )}
      </div>
      
      <Footer language={language} />
    </div>
  );
}
