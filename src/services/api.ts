// API通信を管理するサービス層
import { Building, SearchFilters, Architect, Photo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new ApiError(response.status, `API Error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 建築物関連API
  async getBuildings(page: number = 1, limit: number = 10): Promise<{ buildings: Building[], total: number }> {
    return this.request(`/api/buildings?page=${page}&limit=${limit}`);
  }

  async getBuildingById(id: number): Promise<Building> {
    return this.request(`/api/buildings/${id}`);
  }

  async searchBuildings(filters: SearchFilters): Promise<{ buildings: Building[], total: number }> {
    return this.request('/api/buildings/search', {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  }

  async getNearbyBuildings(lat: number, lng: number, radius: number): Promise<Building[]> {
    return this.request(`/api/buildings/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // いいね機能
  async likeBuilding(buildingId: number): Promise<{ likes: number }> {
    return this.request(`/api/buildings/${buildingId}/like`, {
      method: 'POST',
    });
  }

  async likePhoto(photoId: number): Promise<{ likes: number }> {
    return this.request(`/api/photos/${photoId}/like`, {
      method: 'POST',
    });
  }

  // 建築家関連
  async getArchitects(): Promise<Architect[]> {
    return this.request('/api/architects');
  }

  // 統計・検索候補
  async getSearchSuggestions(query: string): Promise<string[]> {
    return this.request(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  async getPopularSearches(): Promise<{ query: string; count: number }[]> {
    return this.request('/api/search/popular');
  }
}

export const apiClient = new ApiClient();