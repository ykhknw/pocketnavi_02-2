import { Building } from '../types';

// Leaflet型定義
interface LeafletMap {
  addLayer: (layer: LeafletMarker) => void;
  removeLayer: (layer: LeafletMarker) => void;
  setView: (latlng: [number, number], zoom: number) => void;
}

interface LeafletMarker {
  addTo: (map: LeafletMap) => LeafletMarker;
  bindPopup: (content: string) => LeafletMarker;
  on: (event: string, handler: () => void) => LeafletMarker;
}

interface LeafletIcon {
  iconSize: [number, number];
  iconAnchor: [number, number];
  className: string;
}

export interface MarkerConfig {
  type: 'building' | 'selected' | 'current-location';
  language: 'ja' | 'en';
  onClick?: (building: Building) => void;
  onSearchAround?: (lat: number, lng: number) => void;
}

export interface MarkerData {
  position: [number, number];
  icon: LeafletIcon;
  popup: string;
  onClick?: () => void;
}

export class MarkerService {
  private static readonly L = (window as any).L;

  /**
   * 建物マーカーを作成
   */
  static createBuildingMarker(building: Building, config: MarkerConfig): MarkerData {
    const { language, onClick } = config;
    
    // 座標の検証
    if (!this.isValidCoordinates(building.lat, building.lng)) {
      throw new Error(`Invalid coordinates for building: ${building.title}`);
    }

    const icon = this.createBuildingIcon();
    const popup = this.createBuildingPopup(building, language);
    
    return {
      position: [building.lat, building.lng],
      icon,
      popup,
      onClick: onClick ? () => onClick(building) : undefined
    };
  }

  /**
   * 選択された建物のマーカーを作成
   */
  static createSelectedBuildingMarker(building: Building, config: MarkerConfig): MarkerData {
    const { language, onClick } = config;
    
    if (!this.isValidCoordinates(building.lat, building.lng)) {
      throw new Error(`Invalid coordinates for selected building: ${building.title}`);
    }

    const icon = this.createSelectedBuildingIcon();
    const popup = this.createSelectedBuildingPopup(building, language);
    
    return {
      position: [building.lat, building.lng],
      icon,
      popup,
      onClick: onClick ? () => onClick(building) : undefined
    };
  }

  /**
   * 現在位置マーカーを作成
   */
  static createCurrentLocationMarker(lat: number, lng: number, config: MarkerConfig): MarkerData {
    const { onSearchAround } = config;
    
    if (!this.isValidCoordinates(lat, lng)) {
      throw new Error('Invalid current location coordinates');
    }

    const icon = this.createCurrentLocationIcon();
    const popup = this.createCurrentLocationPopup();
    
    return {
      position: [lat, lng],
      icon,
      popup,
      onClick: onSearchAround ? () => onSearchAround(lat, lng) : undefined
    };
  }

  /**
   * 建物アイコンを作成
   */
  private static createBuildingIcon() {
    return this.L.divIcon({
      html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
      className: 'building-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }

  /**
   * 選択された建物アイコンを作成
   */
  private static createSelectedBuildingIcon() {
    return this.L.divIcon({
      html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
      className: 'selected-building-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  /**
   * 現在位置アイコンを作成
   */
  private static createCurrentLocationIcon() {
    return this.L.divIcon({
      html: `<div style="background-color: #10b981; color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
      className: 'current-location-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }

  /**
   * 建物ポップアップを作成
   */
  private static createBuildingPopup(building: Building, language: 'ja' | 'en'): string {
    const title = language === 'ja' ? building.title : building.titleEn;
    const architects = building.architects.map(a => 
      language === 'ja' ? a.architectJa : a.architectEn
    ).join(', ');
    const location = language === 'ja' ? building.location : (building.locationEn || building.location);
    const buildingTypes = language === 'ja' ? building.buildingTypes : (building.buildingTypesEn || building.buildingTypes);
    const yearLabel = language === 'ja' ? '年' : '';

    return `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">${title}</h3>
        <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${architects}</p>
        <p style="font-size: 10px; color: #999; margin-bottom: 8px;">${location}</p>
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          <span style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${building.completionYears}${yearLabel}</span>
          ${buildingTypes.slice(0, 2).map(type => 
            `<span style="background-color: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${type}</span>`
          ).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 選択された建物ポップアップを作成
   */
  private static createSelectedBuildingPopup(building: Building, language: 'ja' | 'en'): string {
    const title = language === 'ja' ? building.title : building.titleEn;
    const architects = building.architects.map(a => 
      language === 'ja' ? a.architectJa : a.architectEn
    ).join(', ');
    const location = language === 'ja' ? building.location : (building.locationEn || building.location);

    return `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${title}</h3>
        <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${architects}</p>
        <p style="font-size: 10px; color: #999;">${location}</p>
      </div>
    `;
  }

  /**
   * 現在位置ポップアップを作成
   */
  private static createCurrentLocationPopup(): string {
    return `
      <div style="padding: 8px; min-width: 150px;">
        <h3 style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">現在位置</h3>
        <p style="font-size: 10px; color: #666;">この周辺を検索</p>
      </div>
    `;
  }

  /**
   * 座標の有効性を検証
   */
  private static isValidCoordinates(lat: number, lng: number): boolean {
    return typeof lat === 'number' && 
           typeof lng === 'number' &&
           !isNaN(lat) && !isNaN(lng) &&
           lat >= -90 && lat <= 90 &&
           lng >= -180 && lng <= 180;
  }

  /**
   * マーカーを地図に追加
   */
  static addMarkerToMap(markerData: MarkerData, map: LeafletMap): LeafletMarker {
    const marker = this.L.marker(markerData.position, {
      icon: markerData.icon,
      isMarker: true
    })
    .bindPopup(markerData.popup);

    if (markerData.onClick) {
      marker.on('click', markerData.onClick);
    }

    marker.addTo(map);
    return marker;
  }

  /**
   * マーカーを地図から削除
   */
  static removeMarkerFromMap(marker: LeafletMarker, map: LeafletMap): void {
    if (marker && map) {
      map.removeLayer(marker);
    }
  }

  /**
   * すべてのマーカーを地図から削除
   */
  static removeAllMarkers(markers: LeafletMarker[], map: LeafletMap): void {
    markers.forEach(marker => {
      if (marker && map) {
        map.removeLayer(marker);
      }
    });
  }
} 