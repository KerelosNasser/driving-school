'use client';

import { useEffect, useRef } from 'react';
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

// Define proper types
type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';

interface User {
  id: string;
  full_name: string;
  latitude: number;
  longitude: number;
}

interface Package {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  status: BookingStatus;
  date: string;
  time: string;
  user: User;
  package?: Package;
}

interface MapProps {
  bookings: Booking[];
}

const LeafletAdminMapComponent = ({ bookings }: MapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cleanup previous map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    if (!mapContainerRef.current || typeof window === 'undefined') return;

    // Initialize map
    const center: L.LatLngExpression = [-27.4698, 153.0251];
    
    const mapInstance = L.map(mapContainerRef.current, {
      center: center,
      zoom: 11,
      scrollWheelZoom: true,
    });

    mapRef.current = mapInstance;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    // Status colors mapping
    const statusColors: Record<BookingStatus, string> = {
      pending: '#eab308',
      confirmed: '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444',
      rejected: '#6b7280'
    };

    // Create custom icon based on booking status
    const createStatusIcon = (status: BookingStatus): L.DivIcon => {
      const color = statusColors[status];
      const letter = status.charAt(0).toUpperCase();
      
      return L.divIcon({
        html: `
          <div style="
            background-color: ${color};
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
            ${letter}
          </div>
        `,
        className: 'custom-booking-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
    };

    // Filter and add markers for valid bookings
    const validBookings = bookings.filter(
      (booking): booking is Booking => 
        booking.status === 'confirmed' && 
        booking.user?.latitude != null && 
        booking.user?.longitude != null &&
        typeof booking.user.latitude === 'number' &&
        typeof booking.user.longitude === 'number'
    );

    validBookings.forEach((booking) => {
      try {
        const { latitude, longitude } = booking.user;
        const marker = L.marker(
          [latitude, longitude], 
          { icon: createStatusIcon(booking.status) }
        ).addTo(mapInstance);

        // Create popup content
        const popupContent = `
          <div style="min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <h4 style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${booking.user.full_name}</h4>
            ${booking.package ? `<p style="margin: 4px 0; color: #374151;"><strong>Package:</strong> ${booking.package.name}</p>` : ''}
            <p style="margin: 4px 0; color: #374151;"><strong>Date:</strong> ${booking.date}</p>
            <p style="margin: 4px 0; color: #374151;"><strong>Time:</strong> ${booking.time}</p>
            <p style="margin: 4px 0; color: #374151;">
              <strong>Status:</strong> 
              <span style="color: ${statusColors[booking.status]}; font-weight: 600; text-transform: capitalize;">
                ${booking.status}
              </span>
            </p>
          </div>
        `;

        marker.bindPopup(popupContent);
      } catch (error) {
        console.error('Error adding marker for booking:', booking.id, error);
      }
    });

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [bookings]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg bg-gray-50">
      <div 
        ref={mapContainerRef}
        className="w-full h-full" 
        id="admin-map"
      />
      {bookings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <p className="text-gray-600 text-sm">No bookings to display</p>
        </div>
      )}
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
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default LeafletAdminMap;