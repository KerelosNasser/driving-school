// Geocoding service using Nominatim (OpenStreetMap)
// This is a free service that doesn't require an API key

interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  address?: {
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    // Add Brisbane, Queensland to the search for better results
    const searchQuery = address.includes('Brisbane') 
      ? address 
      : `${address}, Brisbane, Queensland, Australia`;
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        q: searchQuery,
        format: 'json',
        addressdetails: '1',
        limit: '1',
      }),
      {
        headers: {
          'User-Agent': 'EGDrivingSchool/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.length === 0) {
      console.error('No results found for address:', address);
      return null;
    }

    const result = data[0];
    
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
      }),
      {
        headers: {
          'User-Agent': 'EGDrivingSchool/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Reverse geocoding failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    return {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      display_name: data.display_name,
      address: data.address,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// Check if an address is within our service area
export function isInServiceArea(lat: number, lng: number): boolean {
  // Define Brisbane service area boundaries
  const bounds = {
    north: -27.3200,
    south: -27.5777,
    east: 153.1735,
    west: 152.9500,
  };
  
  return lat >= bounds.south && lat <= bounds.north &&
         lng >= bounds.west && lng <= bounds.east;
}
