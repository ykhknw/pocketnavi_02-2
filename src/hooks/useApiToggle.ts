import { useState, useEffect } from 'react';

// API使用の切り替えを管理するフック
export function useApiToggle() {
  const [useApi, setUseApi] = useState(() => {
    // 環境変数でAPI使用を制御
    return import.meta.env.VITE_USE_API === 'true';
  });

  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    // API接続テスト
    const checkApiStatus = async () => {
      if (!useApi) {
        setApiStatus('unavailable');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/health`);
        if (response.ok) {
          setApiStatus('available');
        } else {
          setApiStatus('unavailable');
          setUseApi(false); // API使用不可の場合はモックデータに切り替え
        }
      } catch (error) {
        console.warn('API not available, using mock data:', error);
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
  };
}