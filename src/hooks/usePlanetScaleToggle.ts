import { useState, useEffect } from 'react';

// PlanetScale API使用の切り替えを管理するフック
export function usePlanetScaleToggle() {
  const [useApi, setUseApi] = useState(() => {
    // 環境変数でAPI使用を制御
    return import.meta.env.VITE_USE_PLANETSCALE === 'true';
  });

  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    // PlanetScale API接続テスト
    const checkApiStatus = async () => {
      if (!useApi) {
        setApiStatus('unavailable');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://your-vercel-api.vercel.app'}/api/health`);
        if (response.ok) {
          const data = await response.json();
          if (data.database === 'planetscale') {
            setApiStatus('available');
          } else {
            setApiStatus('unavailable');
            setUseApi(false);
          }
        } else {
          setApiStatus('unavailable');
          setUseApi(false);
        }
      } catch (error) {
        console.warn('PlanetScale API not available, using mock data:', error);
        setApiStatus('unavailable');
        setUseApi(false);
      }
    };

    checkApiStatus();
  }, [useApi]);

  return {
    useApi,
    setUseApi,
    apiStatus,
    isApiAvailable: apiStatus === 'available',
    isPlanetScaleConnected: apiStatus === 'available',
  };
}