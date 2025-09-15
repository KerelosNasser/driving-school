import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/api/utils';

// Cache configuration
const CACHE_TTL = 300; // 5 minutes
let packagesCache: { data: any[], timestamp: number } | null = null;

// Centralized state management replaces individual rate limiting

// GET - Fetch all packages with caching
async function handlePackagesGetRequest(_request: NextRequest) {
  try {

    // Check cache first
    const now = Date.now();
    if (packagesCache && (now - packagesCache.timestamp) < CACHE_TTL * 1000) {
      return NextResponse.json(
        { packages: packagesCache.data },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'X-Cache': 'HIT',
          },
        }
      );
    }

    // Check if packages table exists by attempting a simple query
    const { error: tableCheckError } = await supabase
      .from('packages')
      .select('id')
      .limit(1)
      .single();

    // If table doesn't exist, we'll get a specific error
    if (tableCheckError && tableCheckError.code === 'PGRST106') {
      return NextResponse.json(
        { packages: [], warning: 'Packages table not found. Please run database migrations.' },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
            'X-DB-Warning': 'packages table missing',
          },
        }
      );
    }

    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Update cache
    packagesCache = {
      data: packages,
      timestamp: now,
    };

    return NextResponse.json(
      { packages },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Rate limit exceeded') {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

// POST with enhanced validation
async function handlePackagesPostRequest(request: NextRequest) {
  try {

    // TEMPORARILY DISABLED FOR TESTING
    // const { userId } = await auth();
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Check if packages table exists by attempting a simple query
    const { error: tableCheckError } = await supabase
      .from('packages')
      .select('id')
      .limit(1)
      .single();

    // If table doesn't exist, we'll get a specific error
    if (tableCheckError && tableCheckError.code === 'PGRST106') {
      return NextResponse.json(
        { error: 'Packages table not found. Please run database migrations.' },
        { status: 503 }
      );
    }

    // Safely parse JSON body
    let body: any;
    try {
      body = await request.json();
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Invalid or empty request body', details: err?.message },
        { status: 400 }
      );
    }

    const { name, description, price, hours, features, popular } = body;

    // Enhanced validation
    if (!name?.trim() || !description?.trim() || !price || !hours || !features) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    if (price < 0 || hours < 1) {
      return NextResponse.json(
        { error: 'Price and hours must be positive numbers' },
        { status: 400 }
      );
    }

    // Safely parse features field
    let parsedFeatures: any[];
    if (Array.isArray(features)) {
      parsedFeatures = features;
    } else if (typeof features === 'string') {
      try {
        const tmp = JSON.parse(features);
        if (!Array.isArray(tmp)) {
          return NextResponse.json(
            { error: 'Invalid features format: must be an array' },
            { status: 400 }
          );
        }
        parsedFeatures = tmp;
      } catch (e: any) {
        return NextResponse.json(
          { error: 'Invalid features JSON string', details: e?.message },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid features format: must be an array or JSON string' },
        { status: 400 }
      );
    }

    const { data: newPackage, error } = await supabaseAdmin
      .from('packages')
      .insert({
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        hours: parseInt(hours),
        features: parsedFeatures,
        popular: Boolean(popular)
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating package:', error);
      throw error;
    }

    packagesCache = null;

    return NextResponse.json({ package: newPackage }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Rate limit exceeded') {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}

export const GET = withCentralizedStateManagement(handlePackagesGetRequest, '/api/packages', {
  priority: 'medium',
  maxRetries: 2,
  requireAuth: false
});

export const POST = withCentralizedStateManagement(handlePackagesPostRequest, '/api/packages', {
  priority: 'medium',
  maxRetries: 1,
  requireAuth: false
});