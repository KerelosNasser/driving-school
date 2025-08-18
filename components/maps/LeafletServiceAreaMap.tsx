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
        Main Office
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
  const size = isSelected ? 36 : 30;
  const color = isSelected
      ? COLORS.primary
      : isPopular
          ? COLORS.secondary
          : COLORS.inactive;

  return L.divIcon({
    html: `
      <div class="area-marker ${isSelected ? 'selected' : ''}" 
           style="background-color: ${color}; width: ${size}px; height: ${size}px;">
      </div>
    `,
    className: 'custom-area-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
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
    </div>
  `;
};

function LeafletServiceAreaMap({
                                 onAreaSelect,
                                 selectedAreaId,
                                 className = ''
                               }: ServiceAreaMapProps) {
  const [map, setMap] = useState<Map | null>(null);
  const [markers, setMarkers] = useState<MapMarkers>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
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
      if (map) {
        map.remove();
      }

      const mapInstance = L.map(mapContainerRef.current, MAP_CONFIG);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: MAP_CONFIG.maxZoom,
      }).addTo(mapInstance);

      // Add coverage area
      const coveragePolygon = L.polygon(COVERAGE_COORDS, {
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
      L.marker(MAP_CONFIG.center, { icon: officeIcon }).addTo(mapInstance);

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
      setMap(mapInstance);

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }, [leaflet, map, processedAreas, onAreaSelect]);

  // Update markers when selection changes
  const updateMarkers = useCallback(() => {
    if (!leaflet || !map || Object.keys(markers).length === 0) return;

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
  }, [leaflet, map, markers, processedAreas]);

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
      if (map) {
        map.remove();
      }
    };
  }, [map]);

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
        .leaflet-map-container {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .leaflet-map {
          width: 100%;
          height: 100%;
        }
        
        .map-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          color: #64748b;
          z-index: 1000;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid ${COLORS.secondary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Custom marker styles */
        .custom-office-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .office-marker {
          background-color: ${COLORS.primary};
          padding: 8px 12px;
          border-radius: 8px;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
          text-align: center;
        }
        
        .custom-area-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .area-marker {
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .area-marker:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        
        .area-marker.selected {
          box-shadow: 0 4px 12px rgba(202, 138, 4, 0.5);
          transform: scale(1.05);
        }
        
        /* Popup styles */
        .area-popup {
          min-width: 150px;
        }
        
        .popup-title {
          margin: 0 0 4px 0;
          font-weight: bold;
          font-size: 16px;
          color: #1f2937;
        }
        
        .popup-description {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.4;
        }
        
        .popular-badge {
          color: ${COLORS.secondary};
          font-weight: 600;
        }
        
        /* Coverage pattern animation */
        .coverage-pattern {
          animation: pulse-coverage 3s ease-in-out infinite;
        }
        
        @keyframes pulse-coverage {
          0%, 100% { fill-opacity: 0.05; }
          50% { fill-opacity: 0.1; }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .office-marker {
            font-size: 12px;
            padding: 6px 10px;
          }
          
          .area-marker {
            border-width: 2px;
          }
          
          .popup-title {
            font-size: 14px;
          }
          
          .popup-description {
            font-size: 13px;
          }
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