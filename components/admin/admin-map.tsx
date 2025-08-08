'use client';

import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface MapProps {
  bookings: any[];
}

const AdminMap = ({ bookings }: MapProps) => {
  const [selectedMarker, setSelectedMarker] = useState(null);

  const mapContainerStyle = {
    width: '100%',
    height: '500px'
  };

  const center = {
    lat: -33.8688, // Sydney default center
    lng: 151.2093
  };

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!googleMapsApiKey) {
    return <div>Google Maps API key is missing</div>;
  }

  return (
    <LoadScript googleMapsApiKey={googleMapsApiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={11}
      >
        {bookings.map((booking) => (
          booking.user && booking.user.latitude && booking.user.longitude && (
            <Marker
              key={booking.id}
              position={{
                lat: booking.user.latitude,
                lng: booking.user.longitude
              }}
              onClick={() => setSelectedMarker(booking)}
            />
          )
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default AdminMap;