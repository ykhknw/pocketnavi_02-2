// Pexels API utility functions
const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY'; // 実際のAPIキーに置き換えてください

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
  next_page?: string;
}

// ランダムな建築画像を取得
export async function getRandomArchitectureImage(): Promise<string> {
  try {
    const queries = [
      'modern architecture',
      'building exterior',
      'contemporary architecture',
      'architectural design',
      'urban architecture',
      'glass building',
      'concrete architecture',
      'minimalist building'
    ];
    
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    const randomPage = Math.floor(Math.random() * 10) + 1; // 1-10ページからランダム
    
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(randomQuery)}&per_page=20&page=${randomPage}`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Pexels API');
    }
    
    const data: PexelsResponse = await response.json();
    
    if (data.photos.length === 0) {
      return getDefaultArchitectureImage();
    }
    
    const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
    // カード表示に最適な横長サイズを取得
    return randomPhoto.src.landscape || randomPhoto.src.medium;
    
  } catch (error) {
    console.error('Error fetching random Pexels image:', error);
    return getDefaultArchitectureImage();
  }
}

// デフォルトの建築画像リスト（APIが使えない場合のフォールバック）
const DEFAULT_ARCHITECTURE_IMAGES = [
  // 横長画像（16:9 または 4:3 比率）- カード表示に最適
  'https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/1309766/pexels-photo-1309766.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/1370296/pexels-photo-1370296.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/1131458/pexels-photo-1131458.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/1831234/pexels-photo-1831234.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&cs=tinysrgb&w=800&h=450'
];

export function getDefaultArchitectureImage(): string {
  return DEFAULT_ARCHITECTURE_IMAGES[Math.floor(Math.random() * DEFAULT_ARCHITECTURE_IMAGES.length)];
}

// APIキーなしでランダム画像を取得（既存の画像リストから）
export function getRandomDefaultImage(): string {
  return getDefaultArchitectureImage();
}