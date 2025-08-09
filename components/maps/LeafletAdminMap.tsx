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
      // Import Leaflet only on client side
      import('leaflet').then((L) => {
        // Brisbane center coordinates
        const center: L.LatLngExpression = [-27.4698, 153.0251];
        
        // Initialize map
        const mapInstance = L.map('admin-map', {
          center: center,
          zoom: 11,
          scrollWheelZoom: true,
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapInstance);

        // Custom icon for bookings
        const bookingIcon = L.divIcon({
          html: `
            <div style="
              background-color: #eab308;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            "></div>
          `,
          className: 'custom-div-icon',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        // Add markers for bookings
        bookings.forEach((booking) => {
          if (booking.user && booking.user.latitude && booking.user.longitude) {
            const marker = L.marker([booking.user.latitude, booking.user.longitude], {
              icon: bookingIcon,
            }).addTo(mapInstance);

            // Add popup with booking info
            marker.bindPopup(`
              <div style="min-width: 200px;">
                <h4 style="margin: 0 0 8px 0; font-weight: bold;">Booking #${booking.id.slice(0, 8)}</h4>
                <p style="margin: 4px 0;">Location: ${booking.user.latitude.toFixed(4)}, ${booking.user.longitude.toFixed(4)}</p>
              </div>
            `);
          }
        });

        // Cleanup on unmount
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
