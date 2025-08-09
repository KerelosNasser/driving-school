'use client';

import { useEffect, useState, useRef } from 'react';
import type { Map, Marker, LatLngExpression } from 'leaflet';
import { serviceAreas } from '@/lib/data'; // Updated import path

interface ServiceAreaMapProps {
  onAreaSelect?: (areaId: number) => void;
  selectedAreaId?: number | null;
}

export default function LeafletServiceAreaMap({ onAreaSelect, selectedAreaId }: ServiceAreaMapProps) {
  const [map, setMap] = useState<Map | null>(null);
  const [markers, setMarkers] = useState<Map<number, Marker>>(new Map());
  const leafletRef = useRef<typeof import('leaflet') | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet/dist/leaflet.css');
      import('leaflet').then((L) => {
        leafletRef.current = L;
        
        const center: LatLngExpression = [-27.4698, 153.0251];
        
        const mapInstance = L.map('service-area-map', {
          center: center,
          zoom: 11,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstance);

        const coverageCoords: LatLngExpression[] = [
          [-27.3200, 153.0700], [-27.3200, 153.1735], [-27.4418, 153.1735],
          [-27.5777, 153.1000], [-27.5777, 152.9500], [-27.4447, 152.9500],
          [-27.3200, 152.9719],
        ];

        L.polygon(coverageCoords, {
          color: '#eab308', weight: 2, opacity: 0.8, fillColor: '#fef3c7',
          fillOpacity: 0.2, dashArray: '10, 10',
        }).addTo(mapInstance);

        L.polygon(coverageCoords, {
          color: 'transparent', fillColor: '#eab308', fillOpacity: 0.05,
          className: 'coverage-pattern',
        }).addTo(mapInstance);

        const officeIcon = L.divIcon({
          html: `<div style=\"background-color: #ca8a04; padding: 8px 12px; border-radius: 8px; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap;\">Main Office</div>`,
          className: 'custom-div-icon', iconSize: [100, 35], iconAnchor: [50, 17],
        });
        L.marker(center, { icon: officeIcon }).addTo(mapInstance);

        const markerMap = new Map<number, Marker>();
        serviceAreas.forEach((area) => {
          const isSelected = selectedAreaId === area.id;
          const areaIcon = L.divIcon({
            html: `<div style=\"background-color: ${isSelected ? '#ca8a04' : (area.popular ? '#eab308' : '#94A3B8')}; width: ${isSelected ? '36px' : '30px'}; height: ${isSelected ? '36px' : '30px'}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: all 0.3s ease;\"></div>`,
            className: 'custom-div-icon', iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
            iconAnchor: [isSelected ? 18 : 15, isSelected ? 18 : 15],
          });
          const marker = L.marker([area.lat, area.lng], { icon: areaIcon })
            .addTo(mapInstance)
            .bindPopup(`<div style=\"min-width: 150px;\"><h4 style=\"margin: 0 0 4px 0; font-weight: bold;\">${area.name}</h4><p style=\"margin: 0; font-size: 14px; color: #666;\">Driving lessons available${area.popular ? '<br><span style=\"color: #eab308;\">⭐ Popular area</span>' : ''}</p></div>`);
          marker.on('click', () => {
            if (onAreaSelect) onAreaSelect(area.id);
          });
          markerMap.set(area.id, marker);
        });

        setMarkers(markerMap);
        setMap(mapInstance);

        return () => {
          mapInstance.remove();
        };
      });
    }
  }, [onAreaSelect, selectedAreaId]);

  useEffect(() => {
    const L = leafletRef.current;
    if (map && markers.size > 0 && L) {
      serviceAreas.forEach((area) => {
        const marker = markers.get(area.id);
        if (marker) {
          const isSelected = selectedAreaId === area.id;
          const areaIcon = L.divIcon({
            html: `<div style=\"background-color: ${isSelected ? '#ca8a04' : (area.popular ? '#eab308' : '#94A3B8')}; width: ${isSelected ? '36px' : '30px'}; height: ${isSelected ? '36px' : '30px'}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); transition: all 0.3s ease;\"></div>`,
            className: 'custom-div-icon', iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
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
      `}</style>
    </div>
  );
}
