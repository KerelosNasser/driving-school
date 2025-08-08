# Driving School Web App - Integration Guide

## Overview
This driving school web application has been updated with the following integrations:
- **Leaflet.js** for all map displays (replacing Google Maps)
- **Stripe Payment** integration for package purchases
- **Google Forms** integration for collecting customer location data
- **Location geocoding** for address validation

## Key Features

### 1. Leaflet.js Maps Integration

All Google Maps components have been replaced with Leaflet.js:

#### Components:
- **`/components/maps/LeafletServiceAreaMap.tsx`**: Service area map with coverage polygon
- **`/components/maps/LeafletAdminMap.tsx`**: Admin dashboard map showing customer locations
- **`/components/admin/admin-map.tsx`**: Wrapper for admin map
- **`/components/home/service-area-map.tsx`**: Home page service area display

#### Features:
- OpenStreetMap tiles (free, no API key required)
- Coverage area visualization with polygon overlay
- Interactive markers with popups
- Custom styling for different marker types
- Responsive and mobile-friendly

### 2. Payment Flow

The payment flow now works as follows:

1. **User selects package and booking details**
2. **Location validation** using geocoding service
3. **Stripe checkout session** created via `/api/create-checkout-session`
4. **After successful payment**, user is redirected to Google Form
5. **Google Form** collects detailed location information
6. **Data saved to Google Sheets** automatically

### 3. Google Forms Integration

After successful Stripe payment, users are redirected to a Google Form with pre-filled data:
- Customer name
- Email
- Selected package
- Booking date/time
- Initial location

The form allows collection of additional location details that are automatically saved to Google Sheets.

## Setup Instructions

### 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `NEXT_PUBLIC_GOOGLE_FORM_URL`: Your Google Form URL
- Other existing variables (Clerk, Supabase)

### 2. Google Form Setup

1. Create a Google Form with these fields:
   - Name (Short answer)
   - Email (Short answer)
   - Location/Address (Short answer)
   - Package (Dropdown)
   - Date/Time (Short answer)
   - Additional Notes (Paragraph)

2. Get the form field IDs:
   - Preview the form
   - Inspect each field in browser DevTools
   - Find the `entry.XXXXXXXXX` IDs
   - Update these IDs in `/app/api/create-checkout-session/route.ts`

3. Connect form to Google Sheets:
   - In form editor, click "Responses" tab
   - Click spreadsheet icon to create/link a sheet

### 3. Stripe Setup

1. Create products in Stripe Dashboard (optional, as we create them dynamically)
2. Set up webhook endpoint for payment confirmation (optional for production)
3. Configure success and cancel URLs

### 4. Leaflet Map Icons

The app uses custom markers. If you want default Leaflet markers:

1. Download marker images from: https://unpkg.com/leaflet@1.9.4/dist/images/
2. Place them in `/public/leaflet/`:
   - marker-icon.png
   - marker-icon-2x.png
   - marker-shadow.png

Or use CDN by updating the icon URLs in the map components.

## File Structure

```
components/
├── maps/
│   ├── LeafletAdminMap.tsx       # Admin dashboard map
│   └── LeafletServiceAreaMap.tsx # Service area display
├── admin/
│   └── admin-map.tsx             # Admin map wrapper
└── home/
    └── service-area-map.tsx      # Home page map

app/
├── api/
│   └── create-checkout-session/
│       └── route.ts              # Stripe checkout handler
├── book/
│   └── page.tsx                 # Booking page with payment
└── about/
    └── page.tsx                 # About page with map

lib/
└── geocoding.ts                 # Address geocoding utilities
```

## API Endpoints

### POST `/api/create-checkout-session`
Creates a Stripe checkout session and returns the checkout URL.

**Request Body:**
```json
{
  "packageId": "string",
  "packageName": "string",
  "price": number,
  "bookingDetails": {
    "userId": "string",
    "userName": "string",
    "userEmail": "string",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "location": "string",
    "hours": number,
    "notes": "string",
    "latitude": number,
    "longitude": number
  }
}
```

## Geocoding Service

The app uses Nominatim (OpenStreetMap) for free geocoding:

```typescript
import { geocodeAddress, isInServiceArea } from '@/lib/geocoding';

// Geocode an address
const result = await geocodeAddress("Brisbane CBD");

// Check if location is in service area
const inArea = isInServiceArea(lat, lng);
```

## Map Customization

### Change Map Tiles
Edit the tile URL in map components:
```typescript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(map);
```

### Modify Service Area
Edit the coverage polygon in `/components/maps/LeafletServiceAreaMap.tsx`:
```typescript
const coverageArea = L.polygon([
  // Add your coordinates here
  [-27.3200, 153.0700], // North point
  // ... more points
], {
  color: '#eab308',
  fillColor: '#fef3c7',
  fillOpacity: 0.2,
});
```

### Add New Locations
Update the `serviceAreas` array in the map components:
```typescript
const serviceAreas = [
  { id: 1, name: 'Brisbane CBD', lat: -27.4698, lng: 153.0251, popular: true },
  // Add more areas
];
```

## Testing

1. **Test Map Display**:
   - Visit homepage, about page
   - Check marker interactions
   - Verify coverage area display

2. **Test Booking Flow**:
   - Create a booking
   - Verify location validation
   - Complete Stripe payment (use test card: 4242 4242 4242 4242)
   - Check Google Form redirect

3. **Test Admin Map**:
   - Visit `/admin` dashboard
   - Check booking locations display

## Production Deployment

1. Set production environment variables
2. Update `NEXT_PUBLIC_APP_URL` to your domain
3. Configure Stripe webhook for payment confirmation
4. Set up proper CORS headers if needed
5. Consider using a paid map tile service for better performance

## Troubleshooting

### Maps not displaying
- Check browser console for errors
- Verify Leaflet CSS is loaded
- Check if map container has height

### Stripe payment fails
- Verify API keys are correct
- Check Stripe dashboard for errors
- Ensure price is in correct format (cents)

### Google Form redirect issues
- Verify form URL is correct
- Check field IDs match your form
- Test with form in preview mode first

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all environment variables are set
3. Review the Stripe and Google Forms documentation
4. Check Leaflet.js documentation for map issues
