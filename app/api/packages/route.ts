import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { rateLimit } from '@/lib/rate-limit';

// Cache configuration
const CACHE_TTL = 300; // 5 minutes
let packagesCache: { data: any[], timestamp: number } | null = null;

// Rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per minute
});

// GET - Fetch all packages with caching
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    await limiter.check(request, 10, 'CACHE_TOKEN');

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
    if (error.message === 'Rate limit exceeded') {
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
export async function POST(request: NextRequest) {
  try {
    await limiter.check(request, 5, 'CACHE_TOKEN');

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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

    const { data: newPackage, error } = await supabase
      .from('packages')
      .insert({
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        hours: parseInt(hours),
        features: Array.isArray(features) ? features : JSON.parse(features),
        popular: Boolean(popular)
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    packagesCache = null;

    return NextResponse.json({ package: newPackage }, { status: 201 });
  } catch (error) {
    if (error.message === 'Rate limit exceeded') {
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