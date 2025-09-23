// components/maps/LeafletServiceAreaMap.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import defaultGlobalContentJson from '@/data/global-content.json';
import dynamic from 'next/dynamic';
import type { Map, Marker, LatLngExpression, LeafletMouseEvent } from 'leaflet';

// Extend Map interface for web connections and coverage polygon
declare module 'leaflet' {
  interface Map {
    _webConnections?: L.Polyline[];
    _connectionIndex?: Record<number, L.Polyline[]>;
    _coveragePolygon?: L.Polygon;
  }
}

// Compute a convex hull (Monotone chain) for an array of [lat, lng] points
function convexHull(points: [number, number][]) {
  if (points.length <= 2) return points.slice();

  // Sort by x (lng), then y (lat)
  const pts = points.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]);

  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);

  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Concatenate lower and upper to get full hull; remove last point of each to avoid duplication
  lower.pop();
  upper.pop();
  return lower.concat(upper);
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
  // Render a professional SVG pin for service areas. Uses a divIcon with inline SVG so we can
  // easily style and animate it on hover/selection.
  const createAreaIcon = useCallback((L: typeof import('leaflet'), area: ServiceArea, isSelected: boolean) => {
    const width = isSelected ? 40 : 34;
    const height = isSelected ? 50 : 42;
    const color = isSelected ? '#ca8a04' : area.popular ? '#f59e0b' : '#3b82f6';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 32 42" aria-hidden="true">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.25" />
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <path d="M16 0C9.372 0 4 5.372 4 12c0 7.5 10.667 18.667 11.167 19.167a1 1 0 0 0 1.666 0C17.333 30.667 28 19.5 28 12 28 5.372 22.628 0 16 0z" fill="${color}"/>
          <circle cx="16" cy="12" r="6" fill="white" />
          <text x="16" y="15" font-size="8" font-weight="700" text-anchor="middle" fill="${color}">${area.name ? area.name.charAt(0) : ''}</text>
        </g>
      </svg>
    `;

    const html = `
      <div class="leaflet-pin-wrapper" style="width: ${width}px; height: ${height}px; display:flex; align-items:flex-start; justify-content:center;">
        ${svg}
      </div>
    `;

    return L.divIcon({
      html,
      className: 'professional-pin-icon',
      iconSize: [width, height],
      iconAnchor: [width / 2, height - 6],
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
        // Clean up web connections and connection index
        if (mapInstanceRef.current._webConnections) {
          mapInstanceRef.current._webConnections.forEach((connection: L.Polyline) => {
            try {
              mapInstanceRef.current?.removeLayer(connection);
            } catch (e) {
              console.warn('Error removing connection:', e);
            }
          });
          mapInstanceRef.current._webConnections = [];
        }
        if (mapInstanceRef.current._connectionIndex) {
          try {
            Object.values(mapInstanceRef.current._connectionIndex).forEach(arr => arr.forEach(line => {
              try { mapInstanceRef.current?.removeLayer(line); } catch (e) { /* ignore */ }
            }));
          } catch (e) {
            // ignore
          }
          // delete the index map
          delete mapInstanceRef.current._connectionIndex;
        }
        // Stop any ongoing animations and remove remaining layers safely before removal.
        try {
          const mAny = mapInstanceRef.current as any;
          if (mAny && typeof mAny.stop === 'function') {
            mAny.stop();
          }
        } catch (e) {
          // ignore
        }

        try {
          mapInstanceRef.current.eachLayer((layer: any) => {
            try { mapInstanceRef.current?.removeLayer(layer); } catch (e) { /* ignore */ }
          });
        } catch (e) {
          // ignore
        }

        try {
          const mAny = mapInstanceRef.current as any;
          if (mAny && typeof mAny.stop === 'function') {
            mAny.stop();
          }
        } catch (e) {}

        try {
          mapInstanceRef.current.eachLayer((layer: any) => {
            try { mapInstanceRef.current?.removeLayer(layer); } catch (e) { /* ignore */ }
          });
        } catch (e) {}

        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore
        }
        mapInstanceRef.current = null;
      }

      // Create new map instance with consistent controls and theme-friendly classes
      const mapInstance = L.map(mapContainerRef.current, {
        ...MAP_CONFIG,
        // preferCanvas disabled to avoid runtime canvas context errors in some environments
        preferCanvas: false,
        zoomControl: true,
        scrollWheelZoom: true,
        // disable animated transitions to avoid internal position reads during teardown
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      });
      
      mapInstanceRef.current = mapInstance;

      // Use a cleaner basemap that fits a modern UI (Carto Positron). Keep a robust fallback to OSM.
      const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: MAP_CONFIG.maxZoom,
        minZoom: 8,
        errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y5ZjlmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIj5UaWxlIEVycm9yPC90ZXh0Pjwvc3ZnPg=='
      });

      tileLayer.addTo(mapInstance);

      // Remove default zoom control and add a themed one in bottom-right
      try {
        if (mapInstance.zoomControl) {
          mapInstance.zoomControl.remove();
        }
        L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
        const newZoom = document.querySelector('.leaflet-control-zoom');
        if (newZoom) {
          newZoom.classList.add('rounded-md', 'bg-white/80', 'backdrop-blur-sm', 'shadow-sm');
          (newZoom as HTMLElement).style.margin = '0.5rem';
        }
      } catch (e) {
        // ignore control styling errors
      }

      // Coverage area/polygon will be created later from actual service area points

      // We'll add spider-web connections after creating markers (below) so connections
      // can be indexed per-marker for hover highlighting.

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
          pane: 'markerPane'
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

        // No hover animations: keep markers visually stable. Any tooltip/popups still work.

        newMarkers[area.id] = marker;
      });

      setMarkers(newMarkers);

      // Build a convex hull polygon around all service area points to represent the coverage border
      const pts = serviceAreas.map(a => [a.lat, a.lng] as [number, number]);
      let hullPoints: [number, number][] = [];
      if (pts.length >= 3) {
        // convexHull expects [lat, lng] pairs, but sorts by lng then lat - it will work
        hullPoints = convexHull(pts.map(p => [p[0], p[1]]));
      }

      if (hullPoints.length >= 3) {
        // convert hullPoints to [lat, lng] tuples for Leaflet (already in that form)
            const hullPolygon = L.polygon(hullPoints, {
              color: '#10b981', // emerald-500
              weight: 2,
              opacity: 0.95,
              fillColor: '#06b6d4', // teal-400 subtle fill
              fillOpacity: 0.06,
              dashArray: '8,6'
            }).addTo(mapInstance);

        // Store polygon for cleanup and hover interactions
        mapInstance._coveragePolygon = hullPolygon as L.Polygon;

        // When hovering a marker, highlight the hull briefly
        Object.values(newMarkers).forEach((m) => {
          m.on('mouseover', () => {
            try {
              mapInstance._coveragePolygon?.setStyle({ weight: 3, fillOpacity: 0.12 });
            } catch (e) {}
          });
          m.on('mouseout', () => {
            try {
              mapInstance._coveragePolygon?.setStyle({ weight: 2, fillOpacity: 0.06 });
            } catch (e) {}
          });
        });
      } else {
        // Fallback: draw a soft coverage area around default coords if not enough points
        const fallback = L.polygon(COVERAGE_COORDS, {
          color: isEditMode ? '#3b82f6' : '#eab308',
          weight: 2,
          opacity: 0.8,
          fillColor: '#fef3c7',
          fillOpacity: isEditMode ? 0.1 : 0.05,
          dashArray: isEditMode ? '5, 10' : '10, 10',
        }).addTo(mapInstance);
        mapInstance._coveragePolygon = fallback as L.Polygon;
      }

      // Fit bounds: if there is exactly one marker, setView to avoid fitBounds creating
      // a tiny bounds that can lead to grey/blank tiles in some tile servers.
      if (serviceAreas.length === 1) {
        const only = serviceAreas[0];
        mapInstance.setView([only.lat, only.lng], Math.max(MAP_CONFIG.zoom, 13));
      } else if (serviceAreas.length > 1) {
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
        // Clean up web connections and coverage polygon
        try {
          mapInstanceRef.current.off();
        } catch (e) {
          // ignore
        }

        if (mapInstanceRef.current._webConnections) {
          mapInstanceRef.current._webConnections.forEach((connection: L.Polyline) => {
            try { mapInstanceRef.current?.removeLayer(connection); } catch (e) { /* ignore */ }
          });
        }
        if (mapInstanceRef.current._coveragePolygon) {
          try { mapInstanceRef.current.removeLayer(mapInstanceRef.current._coveragePolygon); } catch (e) { /* ignore */ }
          delete mapInstanceRef.current._coveragePolygon;
        }
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // ignore
        }
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
              className="w-full h-full"
              style={{
                cursor: isEditMode ? 'crosshair' : 'default',
                background: 'linear-gradient(90deg, rgba(16,185,129,0.06), rgba(14,165,233,0.04))'
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