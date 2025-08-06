// Unsplash API utility functions
const UNSPLASH_ACCESS_KEY = 'QpWcEN2OZybWmLQ0sFYTRgD0jjEMsBKzl7cyyHvYi4c';

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
  };
}

export interface UnsplashResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

// デフォルトの自然画像リスト（APIが使えない場合のフォールバック）
const DEFAULT_NATURE_IMAGES = [
  // 確実に表示される自然風景画像（横長、800x450）
  'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/572897/pexels-photo-572897.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=800&h=450',
  'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=800&h=450'
];

// 建築物IDに基づいて安定した画像を返す関数
export function getStableNatureImage(buildingId: number): string {
  const index = buildingId % DEFAULT_NATURE_IMAGES.length;
  return DEFAULT_NATURE_IMAGES[index];
}

// ランダムな自然画像を取得
export async function getRandomNatureImage(): Promise<string> {
  try {
    // フォールバックとしてデフォルト画像を直接返す
    return getDefaultNatureImage();
    
  } catch (error) {
    console.error('Error fetching random Unsplash image:', error);
    return getDefaultNatureImage();
  }
}

export function getDefaultNatureImage(): string {
  return DEFAULT_NATURE_IMAGES[Math.floor(Math.random() * DEFAULT_NATURE_IMAGES.length)];
}

// ランダムなデフォルト画像を取得（後方互換性のため残す）
export function getRandomDefaultNatureImage(): string {
  return getDefaultNatureImage();
}