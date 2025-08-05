export const translations = {
  ja: {
    // Header
    siteTitle: '建築家.com - 建築作品データベース',
    login: 'ログイン',
    logout: 'ログアウト',
    adminPanel: '管理画面',
    hello: 'こんにちは',
    
    // Search
    searchPlaceholder: '建築物名、建築家名、地域名で検索...',
    currentLocation: '現在地',
    detailedSearch: '詳細検索',
    clearFilters: 'フィルターをクリア',
    buildingTypes: '建築種別',
    prefectures: '都道府県',
    areas: 'エリア',
    media: 'メディア',
    withPhotos: '写真あり',
    withVideos: '動画あり',
    searchingFromLocation: '現在地から検索中',
    radius: '半径',
    
    // Building List
    buildingList: '建築物一覧',
    itemsFound: '件',
    noResults: '検索条件に合う建築物が見つかりませんでした',
    architect: '建築家',
    like: 'いいね',
    imageSearch: '画像検索',
    viewMore: '他{count}枚を見る',
    close: '閉じる',
    hasVideo: '動画あり',
    
    // Building Detail
    address: '住所',
    architects: '建築家',
    buildingType: '建築種別',
    structure: '構造',
    details: '詳細',
    externalImageSearch: '外部画像検索',
    googleImageSearch: 'Google Images',
    bingImageSearch: 'Bing Images',
    postedPhotos: '投稿された写真',
    video: '動画',
    location: '位置情報',
    viewOnGoogleMap: 'Google Maps',
    getDirections: 'Get Directions',
    searchAround: 'Search Nearby',
    
    // Map
    map: '地図',
    loadingMap: '地図を読み込み中...',
    
    // Login
    loginTitle: 'ログイン',
    registerTitle: '新規登録',
    name: 'お名前',
    email: 'メールアドレス',
    password: 'パスワード',
    register: '登録',
    alreadyHaveAccount: 'すでにアカウントをお持ちの方',
    noAccount: 'アカウントをお持ちでない方',
    
    // Liked Buildings
    likedBuildings: 'いいねした建築物',
    noLikedBuildings: 'いいねした建築物がありません',
    
    // Search History
    recentSearches: '最近の検索',
    popularSearches: '人気の検索',
    noSearchHistory: '検索履歴がありません',
    
    // Admin
    buildingManagement: '建築物管理',
    import: 'インポート',
    export: 'エクスポート',
    addNew: '新規追加',
    edit: '編集',
    delete: '削除',
    update: '更新',
    add: '追加',
    cancel: 'キャンセル',
    
    // Common
    year: '年',
    loading: '読み込み中...',
    error: 'エラー',
    save: '保存',
    search: '検索'
  },
  en: {
    // Header
    siteTitle: 'kenchikuka.com - Architectural Works Database',
    login: 'Login',
    logout: 'Logout',
    adminPanel: 'Admin Panel',
    hello: 'Hello',
    
    // Search
    searchPlaceholder: 'Search by building name, architect, or location...',
    currentLocation: 'Current Location',
    detailedSearch: 'Advanced Search',
    clearFilters: 'Clear Filters',
    buildingTypes: 'Building Types',
    prefectures: 'Prefectures',
    areas: 'Areas',
    media: 'Media',
    withPhotos: 'With Photos',
    withVideos: 'With Videos',
    searchingFromLocation: 'Searching from current location',
    radius: 'Radius',
    
    // Building List
    buildingList: 'Buildings',
    itemsFound: 'items found',
    noResults: 'No buildings found matching your criteria',
    architect: 'Architect',
    like: 'Like',
    imageSearch: 'Image Search',
    viewMore: 'View {count} more',
    close: 'Close',
    hasVideo: 'Has Video',
    
    // Building Detail
    address: 'Address',
    architects: 'Architects',
    buildingType: 'Building Type',
    structure: 'Structure',
    details: 'Details',
    externalImageSearch: 'External Image Search',
    googleImageSearch: 'Google Images',
    bingImageSearch: 'Bing Images',
    postedPhotos: 'Posted Photos',
    video: 'Video',
    location: 'Location',
    viewOnGoogleMap: 'Google Maps',
    getDirections: 'Get Directions',
    searchAround: 'Search Nearby',
    
    // Map
    map: 'Map',
    loadingMap: 'Loading map...',
    
    // Login
    loginTitle: 'Login',
    registerTitle: 'Register',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    register: 'Register',
    alreadyHaveAccount: 'Already have an account?',
    noAccount: "Don't have an account?",
    
    // Liked Buildings
    likedBuildings: 'Liked Buildings',
    noLikedBuildings: 'No liked buildings yet',
    
    // Search History
    recentSearches: 'Recent Searches',
    popularSearches: 'Popular Searches',
    noSearchHistory: 'No search history',
    
    // Admin
    buildingManagement: 'Building Management',
    import: 'Import',
    export: 'Export',
    addNew: 'Add New',
    edit: 'Edit',
    delete: 'Delete',
    update: 'Update',
    add: 'Add',
    cancel: 'Cancel',
    
    // Common
    year: '',
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    search: 'Search'
  }
};

export function t(key: string, language: 'ja' | 'en', params?: Record<string, any>): string {
  const keys = key.split('.');
      let value: unknown = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] || match;
    });
  }
  
  return value;
}