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

  useEffect(() => {
    let isCancelled = false;

    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Load CSS first
        await import('leaflet/dist/leaflet.css');
        const L = await import('leaflet');

        if (!isCancelled) {
          setLeaflet(L);
        }
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      }
    };

    loadLeaflet();

    return () => {
      isCancelled = true;
    };
  }, []);

  return leaflet;
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
  const leaflet = useLeaflet();

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

    } catch (error) {
      console.error('Failed to initialize map:', error);
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
    initializeMap();
  }, [initializeMap]);

  // Update markers when selection changes
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
      <>
        <div className={`leaflet-map-container ${className}`}>
          <div
              ref={mapContainerRef}
              className="leaflet-map"
              role="application"
              aria-label="Interactive service area map"
          />
          {!leaflet && (
              <div className="map-loading">
                <div className="loading-spinner" />
                <p>Loading map...</p>
              </div>
          )}
        </div>

        <style jsx global>{`
          

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

// Export with dynamic loading to prevent SSR issues
export default dynamic(() => Promise.resolve(LeafletServiceAreaMap), {
  ssr: false,
  loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
        <div className="text-gray-500">Loading map...</div>
      </div>
  ),
});