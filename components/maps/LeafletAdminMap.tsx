'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

interface MapProps {
  bookings: {
    id: string;
    user: {
      latitude: number;
      longitude: number;
    };
  }[];
}

const LeafletAdminMapComponent = ({ bookings }: MapProps) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        const center: L.LatLngExpression = [-27.4698, 153.0251];
        
        const mapInstance = L.map('admin-map', {
          center: center,
          zoom: 11,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstance);

        // Create different icons for different statuses
        const createIcon = (status: string) => {
          const colors = {
            pending: '#eab308',
            confirmed: '#3b82f6',
            completed: '#10b981',
            cancelled: '#ef4444',
            rejected: '#6b7280'
          };
          
          return L.divIcon({
            html: `
              <div style="
                background-color: ${colors[status as keyof typeof colors] || '#6b7280'};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 12px;
              ">
                ${status.charAt(0).toUpperCase()}
              </div>
            `,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });
        };

        // Add markers for confirmed bookings only
        bookings
          .filter(booking => booking.status === 'confirmed' && booking.user?.latitude && booking.user?.longitude)
          .forEach((booking) => {
            const marker = L.marker(
              [booking.user.latitude, booking.user.longitude], 
              { icon: createIcon(booking.status) }
            ).addTo(mapInstance);

            marker.bindPopup(`
              <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; font-weight: bold;">${booking.user.full_name}</h4>
                <p style="margin: 4px 0;"><strong>Package:</strong> ${booking.package?.name}</p>
                <p style="margin: 4px 0;"><strong>Date:</strong> ${booking.date}</p>
                <p style="margin: 4px 0;"><strong>Time:</strong> ${booking.time}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: ${colors[booking.status]}; font-weight: bold;">${booking.status}</span></p>
              </div>
            `);
          });

        return () => {
          mapInstance.remove();
        };
      });
    }
  }, [bookings]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <div id="admin-map" className="w-full h-full" />
    </div>
  );
};

// Export as dynamic component to avoid SSR issues
const LeafletAdminMap = dynamic(
  () => Promise.resolve(LeafletAdminMapComponent),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-gray-100 animate-pulse flex items-center justify-center rounded-lg">
        <p>Loading map...</p>
      </div>
    ),
  }
);

export default LeafletAdminMap;
