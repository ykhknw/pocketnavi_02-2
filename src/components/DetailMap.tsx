import React, { useEffect, useRef, useState } from 'react';
import { Building } from '../types';
import { MapPin, ExternalLink, Navigation, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { t } from '../utils/translations';

interface DetailMapProps {
  building: Building;
  language: 'ja' | 'en';
  onSearchAround: (lat: number, lng: number) => void;
}

export function DetailMap({ building, language, onSearchAround }: DetailMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || isInitializingRef.current) return;
    
    // Validate building coordinates before initialization
    if (!building || 
        typeof building.lat !== 'number' || 
        typeof building.lng !== 'number' ||
        isNaN(building.lat) || isNaN(building.lng) ||
        building.lat < -90 || building.lat > 90 ||
        building.lng < -180 || building.lng > 180) {
      console.error('Invalid building coordinates for DetailMap:', building);
      return;
    }
    
    isInitializingRef.current = true;

    const initMap = async () => {
      try {
        await loadLeaflet();
        
        const L = (window as any).L;
        if (!L) {
          console.error('Leaflet failed to load');
          isInitializingRef.current = false;
          return;
        }
        
        // Double check that container is not already initialized
        if (mapInstanceRef.current) {
          isInitializingRef.current = false;
          return;
        }
        
        const map = L.map(mapRef.current, {
          center: [building.lat, building.lng],
          zoom: 16,
          zoomControl: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = null;
        setIsMapReady(true);
        isInitializingRef.current = false;
      } catch (error) {
        console.error('Failed to initialize map:', error);
        isInitializingRef.current = false;
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        try {
          // Clear marker first
          if (markerRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
          }
          
          // Remove map instance
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error('Error cleaning up detail map:', error);
        }
        mapInstanceRef.current = null;
        markerRef.current = null;
        isInitializingRef.current = false;
        setIsMapReady(false);
      }
    };
  }, [building.id]); // Add building.id as dependency to reinitialize when building changes

  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || isInitializingRef.current) return;
    
    // Validate building coordinates before updating
    if (!building || 
        typeof building.lat !== 'number' || 
        typeof building.lng !== 'number' ||
        isNaN(building.lat) || isNaN(building.lng) ||
        building.lat < -90 || building.lat > 90 ||
        building.lng < -180 || building.lng > 180) {
      console.error('Invalid building coordinates for marker update:', building);
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    try {
      // Clear existing marker
      if (markerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // Add building marker
      try {
        const customIcon = L.divIcon({
          html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: bold; border: 6px solid white; box-shadow: 0 6px 12px rgba(0,0,0,0.3);"><svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
          className: 'custom-marker',
          iconSize: [72, 72],
          iconAnchor: [36, 36]
        });

        const marker = L.marker([building.lat, building.lng], { 
          icon: customIcon,
          isMarker: true
        })
        .bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #111827;">${language === 'ja' ? building.title : building.titleEn}</h3>
            <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${building.architects.map(a => language === 'ja' ? a.architectJa : a.architectEn).join(', ')}</p>
            <p style="font-size: 10px; color: #9ca3af;">${building.location}</p>
          </div>
        `, {
          closeButton: true,
          autoClose: false,
          closeOnClick: false
        })
        .addTo(mapInstanceRef.current);

        markerRef.current = marker;

        // Set view to building location
        mapInstanceRef.current.setView([building.lat, building.lng], 16);
      } catch (error) {
        console.error('Error creating building marker:', error);
      }
    } catch (error) {
      console.error('Error updating detail map marker:', error);
    }
  }, [building, language, isMapReady]);

  const loadLeaflet = () => {
    return new Promise((resolve) => {
      if ((window as any).L) {
        resolve(null);
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve(null);
      script.onerror = () => {
        console.error('Failed to load Leaflet');
        resolve(null);
      };
      document.head.appendChild(script);
    });
  };

  const handleViewOnGoogleMap = () => {
    if (!building || 
        typeof building.lat !== 'number' || 
        typeof building.lng !== 'number' ||
        isNaN(building.lat) || isNaN(building.lng)) {
      console.error('Invalid coordinates for Google Maps');
      return;
    }
    const url = `https://www.google.com/maps?q=${building.lat},${building.lng}`;
    window.open(url, '_blank');
  };

  const handleGetDirections = () => {
    if (!building || 
        typeof building.lat !== 'number' || 
        typeof building.lng !== 'number' ||
        isNaN(building.lat) || isNaN(building.lng)) {
      console.error('Invalid coordinates for directions');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${building.lat},${building.lng}`;
    window.open(url, '_blank');
  };

  const handleSearchAround = () => {
    if (!building || 
        typeof building.lat !== 'number' || 
        typeof building.lng !== 'number' ||
        isNaN(building.lat) || isNaN(building.lng)) {
      console.error('Invalid coordinates for search around');
      return;
    }
    onSearchAround(building.lat, building.lng);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          className="w-full h-64 rounded-t-lg"
        >
          {!isMapReady && (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
              <div className="text-gray-500">{t('loadingMap', language)}</div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4">
          <Button
            onClick={handleViewOnGoogleMap}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('viewOnGoogleMap', language)}
          </Button>
          
          <Button
            onClick={handleGetDirections}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {t('getDirections', language)}
          </Button>
          
          <Button
            onClick={handleSearchAround}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Search className="h-4 w-4 mr-2" />
            {language === 'ja' ? 'Search Nearby' : 'Search Nearby'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}