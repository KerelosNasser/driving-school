// components/maps/LeafletServiceAreaMap.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Map, Marker, LatLngExpression, LeafletMouseEvent } from 'leaflet';

// Extend Map interface for web connections
declare module 'leaflet' {
  interface Map {
    _webConnections?: L.Polyline[];
  }
}

const MAP_CONFIG = {
  center: [-27.4698, 153.0251] as LatLngExpression,
  zoom: 11,
  maxZoom: 19,
};

const COVERAGE_COORDS: LatLngExpression[] = [
  [-27.3200, 153.0700], [-27.3200, 153.1735], [-27.4418, 153.1735],
  [-27.5777, 153.1000], [-27.5777, 152.9500], [-27.4447, 152.9500],
  [-27.3200, 152.9719],
];

interface ServiceArea {
  id: number;
  name: string;
  lat: number;
  lng: number;
  popular: boolean;
}

interface EditableServiceAreaMapProps {
  onAreaSelect?: (areaId: number) => void;
  selectedAreaId?: number | null;
  serviceAreas?: ServiceArea[];
  onMapClick?: (lat: number, lng: number) => void;
  isEditMode?: boolean;
}

interface MapMarkers {
  [key: number]: Marker;
}

function LeafletServiceAreaMap({
                                         onAreaSelect,
                                         selectedAreaId,
                                         serviceAreas = [],
                                         onMapClick,
                                         isEditMode = false,
                                       }: EditableServiceAreaMapProps) {
  const [leaflet, setLeaflet] = useState<typeof import('leaflet') | null>(null);
  const [markers, setMarkers] = useState<MapMarkers>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const isMountedRef = useRef(false);

  // Load Leaflet following 2025 best practices
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Only load if component is mounted and window is available
        if (typeof window === 'undefined') return;
        
        // Import Leaflet - CSS should be in global styles
        const L = await import('leaflet');
        
        // Fix default marker icons issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        setLeaflet(L);
        isMountedRef.current = true;
      } catch (err) {
        console.error('Failed to load Leaflet:', err);
        setError('Failed to load map library');
      } finally {
        setLoading(false);
      }
    };

    loadLeaflet();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Create custom icons
  const createAreaIcon = useCallback((L: typeof import('leaflet'), area: ServiceArea, isSelected: boolean) => {
    const size = isSelected ? 36 : 30;
    const color = isSelected ? '#ca8a04' : area.popular ? '#eab308' : '#94A3B8';

    return L.divIcon({
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${isSelected ? '16px' : '14px'};
          ${area.popular ? 'position: relative;' : ''}
        ">
          ${area.popular ? '<div style="position: absolute; top: -8px; right: -8px; font-size: 16px;">⭐</div>' : ''}
          ${isEditMode ? '<div style="position: absolute; bottom: -8px; right: -8px; background: white; color: #3b82f6; border: 1px solid #3b82f6; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px;">✎</div>' : ''}
        </div>
      `,
      className: 'custom-area-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }, [isEditMode]);

  const createOfficeIcon = useCallback((L: typeof import('leaflet')) => {
    return L.divIcon({
      html: `
        <div style="
          background: #ca8a04;
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 12px;
          text-align: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 3px solid white;
          white-space: nowrap;
        ">
          🏢 Main Office
        </div>
      `,
      className: 'custom-office-icon',
      iconSize: [120, 40],
      iconAnchor: [60, 20],
    });
  }, []);

  // Initialize map with improved error handling
  const initializeMap = useCallback(async () => {
    if (!leaflet || !mapContainerRef.current || !isMountedRef.current) return;

    const L = leaflet;

    try {
      // Clear existing map
      if (mapInstanceRef.current) {
        // Clean up web connections
        if (mapInstanceRef.current._webConnections) {
          mapInstanceRef.current._webConnections.forEach((connection: L.Polyline) => {
            try {
              mapInstanceRef.current?.removeLayer(connection);
            } catch (e) {
              console.warn('Error removing connection:', e);
            }
          });
        }
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Create new map instance
      const mapInstance = L.map(mapContainerRef.current, {
        ...MAP_CONFIG,
        preferCanvas: true, // Better performance for many markers
        zoomControl: true,
        scrollWheelZoom: true,
      });
      
      mapInstanceRef.current = mapInstance;

      // Add tile layer with error handling
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: MAP_CONFIG.maxZoom,
        minZoom: 8,
        errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y5ZjlmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIj5UaWxlIEVycm9yPC90ZXh0Pjwvc3ZnPg=='
      });
      
      tileLayer.addTo(mapInstance);

      // Add coverage area
      L.polygon(COVERAGE_COORDS, {
        color: isEditMode ? '#3b82f6' : '#eab308',
        weight: 2,
        opacity: 0.8,
        fillColor: '#fef3c7',
        fillOpacity: isEditMode ? 0.1 : 0.05,
        dashArray: isEditMode ? '5, 10' : '10, 10',
      }).addTo(mapInstance).bindPopup(`
        <div>
          <h3>🎯 Service Coverage Area</h3>
          <p>We provide driving lessons throughout Brisbane</p>
          ${isEditMode ? '<p style="color: #3b82f6; font-size: 12px;">💡 Click anywhere to add location</p>' : ''}
        </div>
      `);

      // Add office marker
      const officeIcon = createOfficeIcon(L);
      L.marker(MAP_CONFIG.center, { icon: officeIcon })
          .addTo(mapInstance)
          .bindPopup(`
          <div>
            <h3>🏢 EG Driving School</h3>
            <p>📍 Brisbane, Queensland</p>
            <p>📞 (07) 1234 5678</p>
            <p>✉️ info@egdrivingschool.com</p>
          </div>
        `);

      // Add spider web connections between service areas
      if (serviceAreas.length > 1) {
        const webConnections: L.Polyline[] = [];
        const mainOffice = MAP_CONFIG.center as [number, number];
        
        // Create connections from office to all popular areas
        const popularAreas = serviceAreas.filter(area => area.popular);
        popularAreas.forEach(area => {
          const connection = L.polyline([
            mainOffice,
            [area.lat, area.lng]
          ], {
            color: '#eab308',
            weight: 2,
            opacity: 0.4,
            dashArray: '5, 10'
          }).addTo(mapInstance);
          webConnections.push(connection);
        });

        // Create connections between nearby service areas (spider web effect)
        serviceAreas.forEach((area1, i) => {
          serviceAreas.slice(i + 1).forEach(area2 => {
            const distance = Math.sqrt(
              Math.pow(area1.lat - area2.lat, 2) + 
              Math.pow(area1.lng - area2.lng, 2)
            );
            
            // Connect areas that are relatively close (adjust threshold as needed)
            if (distance < 0.1) {
              const connection = L.polyline([
                [area1.lat, area1.lng],
                [area2.lat, area2.lng]
              ], {
                color: area1.popular && area2.popular ? '#fbbf24' : '#d1d5db',
                weight: area1.popular && area2.popular ? 2 : 1,
                opacity: area1.popular && area2.popular ? 0.6 : 0.3,
                dashArray: area1.popular && area2.popular ? '3, 6' : '2, 8'
              }).addTo(mapInstance);
              webConnections.push(connection);
            }
          });
        });

        // Store connections for cleanup
        mapInstance._webConnections = webConnections;
      }

      // Add map click handler for edit mode
      if (isEditMode && onMapClick) {
        mapInstance.on('click', (e: LeafletMouseEvent) => {
          // Don't trigger if clicking on marker
          if (e.originalEvent.target && (e.originalEvent.target as Element).closest('.leaflet-marker-icon')) {
            return;
          }
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
        mapInstance.getContainer().style.cursor = isEditMode ? 'crosshair' : '';
      }

      // Add service area markers
      const newMarkers: MapMarkers = {};
      serviceAreas.forEach((area) => {
        const isSelected = selectedAreaId === area.id;
        const areaIcon = createAreaIcon(L, area, isSelected);

        const marker = L.marker([area.lat, area.lng], {
          icon: areaIcon,
          riseOnHover: true,
        })
            .addTo(mapInstance)
            .bindPopup(`
            <div>
              <h4>${area.name}</h4>
              <p>📍 ${area.lat.toFixed(4)}, ${area.lng.toFixed(4)}</p>
              <p>Driving lessons available</p>
              ${area.popular ? '<span style="background: #fef3c7; color: #ca8a04; padding: 2px 8px; border-radius: 12px; font-size: 11px;">⭐ Popular</span>' : ''}
              ${isEditMode ? '<div style="margin-top: 8px; color: #3b82f6; font-size: 11px;">💡 Click to select</div>' : ''}
            </div>
          `);

        marker.on('click', (e) => {
          e.originalEvent.stopPropagation();
          onAreaSelect?.(area.id);
        });

        newMarkers[area.id] = marker;
      });

      setMarkers(newMarkers);

      // Fit bounds
      if (serviceAreas.length > 0) {
        const group = new L.FeatureGroup(Object.values(newMarkers));
        mapInstance.fitBounds(group.getBounds().pad(0.1));
      } else {
        const bounds = L.latLngBounds(COVERAGE_COORDS);
        mapInstance.fitBounds(bounds, { padding: [20, 20] });
      }

    } catch (err) {
      console.error('Map initialization failed:', err);
    }
  }, [leaflet, serviceAreas, selectedAreaId, isEditMode, onAreaSelect, onMapClick, createAreaIcon, createOfficeIcon]);

  // Update markers when selection changes
  const updateMarkers = useCallback(() => {
    if (!leaflet || !mapInstanceRef.current || Object.keys(markers).length === 0) return;

    serviceAreas.forEach((area) => {
      const marker = markers[area.id];
      if (!marker) return;

      const isSelected = selectedAreaId === area.id;
      const newIcon = createAreaIcon(leaflet, area, isSelected);
      marker.setIcon(newIcon);

      if (isSelected) {
        marker.openPopup();
        mapInstanceRef.current?.setView([area.lat, area.lng], Math.max(mapInstanceRef.current.getZoom(), 13), {
          animate: true,
          duration: 0.5
        });
      }
    });
  }, [leaflet, markers, serviceAreas, selectedAreaId, createAreaIcon]);

  // Initialize map when leaflet loads
  useEffect(() => {
    if (leaflet && !loading && !error) {
      initializeMap();
    }
  }, [leaflet, loading, error, initializeMap]);

  // Update markers when selection changes
  useEffect(() => {
    if (!loading && !error) {
      updateMarkers();
    }
  }, [updateMarkers, loading, error]);

  // Reinitialize when service areas change
  useEffect(() => {
    if (!leaflet || !mapInstanceRef.current) return;

    const currentIds = Object.keys(markers).map(Number);
    const newIds = serviceAreas.map(area => area.id);

    const hasChanges =
        newIds.length !== currentIds.length ||
        newIds.some(id => !currentIds.includes(id)) ||
        currentIds.some(id => !newIds.includes(id));

    if (hasChanges) {
      initializeMap();
    }
  }, [serviceAreas, leaflet, markers, initializeMap]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        // Clean up web connections
        if (mapInstanceRef.current._webConnections) {
          mapInstanceRef.current._webConnections.forEach((connection: L.Polyline) => {
            mapInstanceRef.current?.removeLayer(connection);
          });
        }
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
        <div className="w-full h-full bg-red-50 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <h3 className="font-semibold text-red-900">Map Error</h3>
            <p className="text-red-700 text-sm">Failed to load map</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="w-full h-full relative">
        <div
            ref={mapContainerRef}
            className="w-full h-full rounded-lg"
            style={{
              cursor: isEditMode ? 'crosshair' : 'default',
              background: '#f8f9fa'
            }}
        />
        {loading && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
        )}
      </div>
  );
}

// Export as dynamic component with better error boundaries
const LeafletServiceAreaMapDynamic = dynamic(
    () => Promise.resolve(LeafletServiceAreaMap),
    {
      ssr: false,
      loading: () => (
          <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600">Loading interactive map...</p>
            </div>
          </div>
      ),
    }
);

export default LeafletServiceAreaMapDynamic;