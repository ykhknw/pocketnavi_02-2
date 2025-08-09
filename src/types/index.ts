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
}

export interface MapMarker {
  id: number;
  position: [number, number];
  title: string;
  architect: string;
  buildingType: string;
}