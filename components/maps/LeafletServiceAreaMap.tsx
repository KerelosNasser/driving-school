'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Service areas in Brisbane
const serviceAreas = [
  { id: 1, name: 'Brisbane CBD', lat: -27.4698, lng: 153.0251, popular: true },
  { id: 2, name: 'South Brisbane', lat: -27.4809, lng: 153.0176, popular: true },
  { id: 3, name: 'West End', lat: -27.4818, lng: 153.0120, popular: false },
  { id: 4, name: 'Fortitude Valley', lat: -27.4570, lng: 153.0344, popular: true },
  { id: 5, name: 'New Farm', lat: -27.4677, lng: 153.0520, popular: false },
  { id: 6, name: 'Paddington', lat: -27.4610, lng: 153.0024, popular: false },
  { id: 7, name: 'Milton', lat: -27.4709, lng: 152.9999, popular: false },
  { id: 8, name: 'Toowong', lat: -27.4845, lng: 152.9928, popular: true },
  { id: 9, name: 'St Lucia', lat: -27.4975, lng: 153.0095, popular: false },
  { id: 10, name: 'Indooroopilly', lat: -27.5016, lng: 152.9719, popular: true },
  { id: 11, name: 'Kelvin Grove', lat: -27.4476, lng: 153.0153, popular: false },
  { id: 12, name: 'Chermside', lat: -27.3861, lng: 153.0344, popular: true },
  { id: 13, name: 'Carindale', lat: -27.5047, lng: 153.1000, popular: false },
  { id: 14, name: 'Mount Gravatt', lat: -27.5397, lng: 153.0785, popular: false },
  { id: 15, name: 'Sunnybank', lat: -27.5777, lng: 153.0571, popular: true },
  { id: 16, name: 'Wynnum', lat: -27.4418, lng: 153.1735, popular: false },
  { id: 17, name: 'Sandgate', lat: -27.3200, lng: 153.0700, popular: false },
  { id: 18, name: 'The Gap', lat: -27.4447, lng: 152.9500, popular: false },
];

interface ServiceAreaMapProps {
  onAreaSelect?: (areaId: number) => void;
  selectedAreaId?: number | null;
}

const LeafletServiceAreaMapComponent = ({ onAreaSelect, selectedAreaId }: ServiceAreaMapProps) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<Map<number, L.Marker>>(new Map());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        // Brisbane center coordinates
        const center: L.LatLngExpression = [-27.4698, 153.0251];
        
        // Initialize map
        const mapInstance = L.map('service-area-map', {
          center: center,
          zoom: 11,
          scrollWheelZoom: true,
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstance);

        // Create coverage area polygon (covers most of Brisbane)
        const coverageArea = L.polygon([
          [-27.3200, 153.0700], // Sandgate (North)
          [-27.3200, 153.1735], // Wynnum (Northeast)
          [-27.4418, 153.1735], // Wynnum (East)
          [-27.5777, 153.1000], // Sunnybank (Southeast)
          [-27.5777, 152.9500], // The Gap (Southwest)
          [-27.4447, 152.9500], // The Gap (West)
          [-27.3200, 152.9719], // Northwest
        ], {
          color: '#eab308',
          weight: 2,
          opacity: 0.8,
          fillColor: '#fef3c7',
          fillOpacity: 0.2,
          dashArray: '10, 10',
        }).addTo(mapInstance);

        // Add a decorative pattern overlay for the coverage area
        const patternOverlay = L.polygon([
          [-27.3200, 153.0700],
          [-27.3200, 153.1735],
          [-27.4418, 153.1735],
          [-27.5777, 153.1000],
          [-27.5777, 152.9500],
          [-27.4447, 152.9500],
          [-27.3200, 152.9719],
        ], {
          color: 'transparent',
          fillColor: '#eab308',
          fillOpacity: 0.05,
          className: 'coverage-pattern',
        }).addTo(mapInstance);

        // Main office marker
        const officeIcon = L.divIcon({
          html: `
            <div style="
              background-color: #ca8a04;
              padding: 8px 12px;
              border-radius: 8px;
              color: white;
              font-weight: bold;
              font-size: 14px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              white-space: nowrap;
            ">Main Office</div>
          `,
          className: 'custom-div-icon',
          iconSize: [100, 35],
          iconAnchor: [50, 17],
        });

        L.marker(center, { icon: officeIcon }).addTo(mapInstance);

        // Add service area markers
        const markerMap = new Map<number, L.Marker>();
        
        serviceAreas.forEach((area) => {
          const isSelected = selectedAreaId === area.id;
          
          const areaIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${isSelected ? '#ca8a04' : (area.popular ? '#eab308' : '#94A3B8')};
                width: ${isSelected ? '36px' : '30px'};
                height: ${isSelected ? '36px' : '30px'};
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
              "></div>
            `,
            className: 'custom-div-icon',
            iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
            iconAnchor: [isSelected ? 18 : 15, isSelected ? 18 : 15],
          });

          const marker = L.marker([area.lat, area.lng], { icon: areaIcon })
            .addTo(mapInstance)
            .bindPopup(`
              <div style="min-width: 150px;">
                <h4 style="margin: 0 0 4px 0; font-weight: bold;">${area.name}</h4>
                <p style="margin: 0; font-size: 14px; color: #666;">
                  Driving lessons available
                  ${area.popular ? '<br><span style="color: #eab308;">⭐ Popular area</span>' : ''}
                </p>
              </div>
            `);

          marker.on('click', () => {
            if (onAreaSelect) {
              onAreaSelect(area.id);
            }
          });

          markerMap.set(area.id, marker);
        });

        setMarkers(markerMap);
        setMap(mapInstance);

        // Cleanup on unmount
        return () => {
          mapInstance.remove();
        };
      });
    }
  }, []);

  // Update marker styles when selection changes
  useEffect(() => {
    if (map && markers.size > 0) {
      serviceAreas.forEach((area) => {
        const marker = markers.get(area.id);
        if (marker) {
          const isSelected = selectedAreaId === area.id;
          
          const areaIcon = L.divIcon({
            html: `
              <div style="
                background-color: ${isSelected ? '#ca8a04' : (area.popular ? '#eab308' : '#94A3B8')};
                width: ${isSelected ? '36px' : '30px'};
                height: ${isSelected ? '36px' : '30px'};
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
              "></div>
            `,
            className: 'custom-div-icon',
            iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
            iconAnchor: [isSelected ? 18 : 15, isSelected ? 18 : 15],
          });
          
          marker.setIcon(areaIcon);
          
          if (isSelected) {
            marker.openPopup();
          }
        }
      });
    }
  }, [selectedAreaId, markers, map]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg">
      <div id="service-area-map" className="w-full h-full" />
      <style jsx global>{`
        .coverage-pattern {
          background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(234, 179, 8, 0.03) 10px,
            rgba(234, 179, 8, 0.03) 20px
          );
        }
      `}</style>
    </div>
  );
};

// Export as dynamic component to avoid SSR issues
const LeafletServiceAreaMap = dynamic(
  () => Promise.resolve(LeafletServiceAreaMapComponent),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center rounded-xl">
        <p>Loading map...</p>
      </div>
    ),
  }
);

export default LeafletServiceAreaMap;

export { serviceAreas };
