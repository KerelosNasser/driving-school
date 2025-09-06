import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

// Rate limiting configuration for location autocomplete
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Allow 500 unique tokens per interval
});

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return '127.0.0.1'; // Fallback
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting - 30 requests per minute per IP
    const identifier = getClientIP(request);
    try {
      await limiter.check(request, 30, identifier,);
    } catch {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    // Get query parameter
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query || query.length < 3) {
      return NextResponse.json(
        { message: 'Query must be at least 3 characters' },
        { status: 400 }
      );
    }
    
    // Check if Google Places API key is configured
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          message: 'Google Places API not configured. Please set GOOGLE_API_KEY environment variable.',
          predictions: [],
          status: 'REQUEST_DENIED'
        },
        { status: 503 }
      );
    }
    
    // Call Google Places Autocomplete API
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    googleUrl.searchParams.set('input', query);
    googleUrl.searchParams.set('key', apiKey);
    googleUrl.searchParams.set('types', 'geocode'); // Only return geographic locations
    googleUrl.searchParams.set('language', 'en');
    
    // Add session token for billing optimization (optional)
    const sessionToken = searchParams.get('sessionToken');
    if (sessionToken) {
      googleUrl.searchParams.set('sessiontoken', sessionToken);
    }
    
    // Add country restriction if needed (optional)
    const country = searchParams.get('country') || 'us';
    googleUrl.searchParams.set('components', `country:${country}`);
    
    const response = await fetch(googleUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Google Places API error:', response.status, response.statusText);
      return NextResponse.json(
        { message: 'Location service temporarily unavailable' },
        { status: 503 }
      );
    }
    
    const data = await response.json();
    
    // Check for API errors
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      
      // Return appropriate error based on status
      switch (data.status) {
        case 'OVER_QUERY_LIMIT':
          return NextResponse.json(
            { message: 'Location service quota exceeded. Please try again later.' },
            { status: 503 }
          );
        case 'REQUEST_DENIED':
          return NextResponse.json(
            { message: 'Location service access denied.' },
            { status: 403 }
          );
        case 'INVALID_REQUEST':
          return NextResponse.json(
            { message: 'Invalid location query.' },
            { status: 400 }
          );
        default:
          return NextResponse.json(
            { message: 'Location service error.' },
            { status: 500 }
          );
      }
    }
    
    // Filter and format predictions
    const predictions = (data.predictions || []).map((prediction: any) => ({
      place_id: prediction.place_id,
      description: prediction.description,
      structured_formatting: {
        main_text: prediction.structured_formatting?.main_text || prediction.description,
        secondary_text: prediction.structured_formatting?.secondary_text || ''
      },
      types: prediction.types || []
    }));
    
    return NextResponse.json({
      predictions,
      status: data.status
    });
    
  } catch (error) {
    console.error('Location autocomplete error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}