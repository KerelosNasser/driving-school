'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Map, Marker, LatLngExpression, DivIcon } from 'leaflet';
import { serviceAreas } from '@/lib/data';

// Constants moved outside component to prevent recreation
const MAP_CONFIG = {
  center: [-27.4698, 153.0251] as LatLngExpression,
  zoom: 11,
  maxZoom: 19,
  scrollWheelZoom: true,
} as const;

const COVERAGE_COORDS: LatLngExpression[] = [
  [-27.3200, 153.0700], [-27.3200, 153.1735], [-27.4418, 153.1735],
  [-27.5777, 153.1000], [-27.5777, 152.9500], [-27.4447, 152.9500],
  [-27.3200, 152.9719],
];

const COLORS = {
  primary: '#ca8a04',
  secondary: '#eab308',
  inactive: '#94A3B8',
  background: '#fef3c7',
} as const;

interface ServiceAreaMapProps {
  onAreaSelect?: (areaId: number) => void;
  selectedAreaId?: number | null;
  className?: string;
}

interface MapMarkers {
  [key: number]: Marker;
}

// Custom hook for Leaflet initialization
const useLeaflet = () => {
  const [leaflet, setLeaflet] = useState<typeof import('leaflet') | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;

      try {
        setLoading(true);
        setError(null);
        
        // Load CSS first
        await import('leaflet/dist/leaflet.css');
        const L = await import('leaflet');

        if (!isCancelled) {
          setLeaflet(L);
        }
      } catch (err) {
        if (!isCancelled) {
          setError('Failed to load map library');
          console.error('Failed to load Leaflet:', err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadLeaflet();

    return () => {
      isCancelled = true;
    };
  }, []);

  return { leaflet, loading, error };
};

// Icon factory functions
const createOfficeIcon = (L: typeof import('leaflet')): DivIcon => {
  return L.divIcon({
    html: `
      <div class="office-marker">
        <div class="office-marker-inner">Main Office</div>
      </div>
    `,
    className: 'custom-office-icon',
    iconSize: [100, 35],
    iconAnchor: [50, 17],
  });
};

const createAreaIcon = (
    L: typeof import('leaflet'),
    isSelected: boolean,
    isPopular: boolean
): DivIcon => {
  const sizeClass = isSelected 
      ? 'area-marker-large' 
      : 'area-marker-small';
      
  const colorClass = isSelected 
      ? 'area-marker-primary' 
      : isPopular 
          ? 'area-marker-secondary' 
          : 'area-marker-inactive';

  return L.divIcon({
    html: `
      <div class="area-marker ${colorClass} ${sizeClass} ${isSelected ? 'selected' : ''} ${isPopular ? 'popular' : ''}">
        ${isPopular ? '<div class="popular-star">★</div>' : ''}
      </div>
    `,
    className: 'custom-area-icon',
    iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
    iconAnchor: [isSelected ? 18 : 15, isSelected ? 18 : 15],
  });
};

const createPopupContent = (area: typeof serviceAreas[0]): string => {
  return `
    <div class="area-popup">
      <h4 class="popup-title">${area.name}</h4>
      <p class="popup-description">
        Driving lessons available
        ${area.popular ? '<br><span class="popular-badge">⭐ Popular area</span>' : ''}
      </p>
      <div class="popup-stats">
        <span class="popup-stat">Emael Ghobrial</span>
        <span class="popup-stat"> 9+ years service</span>
      </div>
    </div>
  `;
};

function LeafletServiceAreaMap({
                                 onAreaSelect,
                                 selectedAreaId,
                                 className = ''
                               }: ServiceAreaMapProps) {
  const [markers, setMarkers] = useState<MapMarkers>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const { leaflet, loading, error } = useLeaflet();

  // Memoize service areas processing
  const processedAreas = useMemo(() => {
    return serviceAreas.map(area => ({
      ...area,
      isSelected: selectedAreaId === area.id,
    }));
  }, [selectedAreaId]);

  // Initialize map
  const initializeMap = useCallback(async () => {
    if (!leaflet || !mapContainerRef.current) return;

    const L = leaflet;

    try {
      // Clear existing map if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const mapInstance = L.map(mapContainerRef.current, MAP_CONFIG);

      // Store reference to the map instance
      mapInstanceRef.current = mapInstance;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: MAP_CONFIG.maxZoom,
      }).addTo(mapInstance);

      // Add coverage area
      L.polygon(COVERAGE_COORDS, {
        color: COLORS.secondary,
        weight: 2,
        opacity: 0.8,
        fillColor: COLORS.background,
        fillOpacity: 0.2,
        dashArray: '10, 10',
      }).addTo(mapInstance);
// Add pattern overlay
      L.polygon(COVERAGE_COORDS, {
        color: 'transparent',
        fillColor: COLORS.secondary,
        fillOpacity: 0.05,
        className: 'coverage-pattern',
      }).addTo(mapInstance);

      // Add office marker
      const officeIcon = createOfficeIcon(L);
      L.marker(MAP_CONFIG.center, { icon: officeIcon })
          .addTo(mapInstance)
          .bindPopup(`
          <div class="office-popup">
            <h3>EG Driving School</h3>
            <p>📍 123 Main Street, Brisbane</p>
            <p>📞 (07) 1234 5678</p>
            <p>✉️ info@egdrivingschool.com</p>
          </div>
        `);
// Add service area markers
      const newMarkers: MapMarkers = {};
      processedAreas.forEach((area) => {
        const areaIcon = createAreaIcon(L, area.isSelected, area.popular);
        const marker = L.marker([area.lat, area.lng], { icon: areaIcon })
            .addTo(mapInstance)
            .bindPopup(createPopupContent(area));

        marker.on('click', () => {
          onAreaSelect?.(area.id);
        });

        newMarkers[area.id] = marker;
      });

      setMarkers(newMarkers);

      // Fit map to bounds
      const bounds = L.latLngBounds(COVERAGE_COORDS);
      mapInstance.fitBounds(bounds, { padding: [50, 50] });

    } catch (err) {
      console.error('Failed to initialize map:', err);
    }
  }, [leaflet, processedAreas, onAreaSelect]);

  // Update markers when selection changes
  const updateMarkers = useCallback(() => {
    if (!leaflet || !mapInstanceRef.current || Object.keys(markers).length === 0) return;

    const L = leaflet;

    processedAreas.forEach((area) => {
      const marker = markers[area.id];
      if (!marker) return;

      const newIcon = createAreaIcon(L, area.isSelected, area.popular);
      marker.setIcon(newIcon);

      if (area.isSelected) {
        marker.openPopup();
      } else {
        marker.closePopup();
      }
    });
  }, [leaflet, markers, processedAreas]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className={`leaflet-map-container ${className}`}>
        <div className="map-error">
          <p>Failed to load map. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
      <>
        <div className={`leaflet-map-container ${className}`}>
          <div
              ref={mapContainerRef}
              className="leaflet-map"
              role="application"
              aria-label="Interactive service area map"
          />
          {loading && (
              <div className="map-loading">
                <div className="loading-spinner" />
                <p>Loading map...</p>
              </div>
          )}
        </div>

        <style jsx global>{`
          .leaflet-map-container {
            position: relative;
            width: 100%;
            height: 100%;
          }
          
          .leaflet-map {
            width: 100%;
            height: 100%;
            background: #f8f9fa;
            border-radius: 0.5rem;
          }
          
          .map-loading {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.8);
            z-index: 1000;
          }
          
          .loading-spinner {
            width: 2rem;
            height: 2rem;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #ca8a04;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 0.5rem;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .map-error {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: #f8f9fa;
            color: #64748b;
            border-radius: 0.5rem;
          }
          
          .custom-office-icon {
            background: ${COLORS.primary};
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 12px;
            text-align: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid white;
          }
          
          .custom-area-icon {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .area-marker {
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid white;
            transition: all 0.2s ease-in-out;
          }
          
          .area-marker-primary {
            background: ${COLORS.primary};
            color: white;
          }
          
          .area-marker-secondary {
            background: ${COLORS.secondary};
            color: #333;
          }
          
          .area-marker-inactive {
            background: ${COLORS.inactive};
            color: white;
          }
          
          .area-marker-large {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }
          
          .area-marker-small {
            width: 30px;
            height: 30px;
            font-size: 15px;
          }
          
          .popular-star {
            position: absolute;
            top: -5px;
            right: -5px;
            font-size: 16px;
            color: #f59e0b;
            text-shadow: 0 0 2px rgba(0,0,0,0.5);
          }
          
          .area-popup {
            min-width: 200px;
          }
          
          .popup-title {
            margin: 0 0 8px 0;
            font-weight: bold;
            font-size: 16px;
            color: #1f2937;
          }
          
          .popup-description {
            margin: 4px 0;
            font-size: 14px;
            color: #4b5563;
          }
          
          .popular-badge {
            background: #fef3c7;
            color: #ca8a04;
            padding: 2px 6px;
            border-radius: 12px;
            font-weight: bold;
          }
          
          .popup-stats {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            display: flex;
            justify-content: space-between;
          }
          
          .office-popup h3 {
            margin: 0 0 8px 0;
            font-weight: bold;
            font-size: 18px;
            color: #1f2937;
            text-align: center;
          }
          
          @keyframes pulse-coverage {
            0%, 100% {
              fill-opacity: 0.05;
            }
            50% {
              fill-opacity: 0.1;
            }
          }
          
          .office-popup h3 {
            font-size: 16px;
          }

          /* Add smooth transitions for all interactive elements */
          *, *:before, *:after {
            transition-property: all;
            transition-duration: 0.3s;
            transition-timing-function: ease-out;
          }
        `}</style>
      </>
  );
}

// Export as dynamic component to avoid SSR issues
const LeafletServiceAreaMapComponent = LeafletServiceAreaMap;

const LeafletServiceAreaMapDynamic = dynamic(
  () => Promise.resolve(LeafletServiceAreaMapComponent),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gray-100 animate-pulse flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default LeafletServiceAreaMapDynamic;
