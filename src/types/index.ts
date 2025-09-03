export interface Building {
  id: number;
  uid: string;
  slug?: string;
  title: string;
  titleEn: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  completionYears: number;
  parentBuildingTypes: string[];
  buildingTypes: string[];
  parentStructures: string[];
  structures: string[];
  prefectures: string;
  prefecturesEn?: string;
  areas: string;
  areasEn?: string;
  location: string;
  locationEn?: string;
  buildingTypesEn?: string[];
  architectDetails: string;
  lat: number;
  lng: number;
  architects: Architect[];
  photos: Photo[];
  likes: number;
  distance?: number;
  created_at: string;
  updated_at: string;
}

export interface Architect {
  architect_id: number;
  architectJa: string;
  architectEn: string;
  slug?: string;
  order_index?: number; // order_indexプロパティを追加
  websites: Website[];
}

// 新しいテーブル構造の型定義
export interface IndividualArchitect {
  individual_architect_id: number;
  name_ja: string;
  name_en: string;
  slug: string;
}

export interface ArchitectComposition {
  architect_id: number;
  individual_architect_id: number;
  order_index: number;
}

// 新しいテーブル構造を使用した建築家情報（既存Architect型との互換性を保つ）
export interface NewArchitect {
  architect_id: number;
  architectJa: string; // name_jaから取得
  architectEn: string; // name_enから取得
  slug?: string; // individual_architectのslugから取得
  individual_architect_id: number;
  order_index: number;
  websites: Website[];
}

export interface Website {
  website_id: number;
  url: string;
  title: string;
  invalid: boolean;
  architectJa: string;
  architectEn: string;
}

export interface Photo {
  id: number;
  building_id: number;
  url: string;
  thumbnail_url: string;
  likes: number;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface SearchFilters {
  query: string;
  radius: number;
  architects?: string[];
  buildingTypes: string[];
  prefectures: string[];
  areas: string[];
  hasPhotos: boolean;
  hasVideos: boolean;
  currentLocation: { lat: number; lng: number } | null;
  completionYear?: number | null;
  excludeResidential?: boolean;
}

export interface Language {
  code: 'ja' | 'en';
  name: string;
}

export interface LikedBuilding {
  id: number;
  title: string;
  titleEn: string;
  likedAt: string;
}

export interface SearchHistory {
  query: string;
  searchedAt: string;
  count: number;
  type: 'text' | 'architect' | 'prefecture';
  filters?: Partial<SearchFilters>;
}

export interface MapMarker {
  id: number;
  position: [number, number];
  title: string;
  architect: string;
  buildingType: string;
}