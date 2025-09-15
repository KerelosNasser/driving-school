import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // client for public reads (anon)
import { supabaseAdmin } from '@/lib/api/utils'; // service_role client (server-only)
import { auth } from '@clerk/nextjs/server';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

// Cache configuration
const CACHE_TTL = 300; // seconds
let packagesCache: { data: any[]; timestamp: number } | null = null;
let packagesFetchInFlight: Promise<void> | null = null;

// Utility: probe packages table existence with a minimal select
async function probePackagesTable(): Promise<{ exists: boolean; error?: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('packages')
      .select('id')
      .limit(1);

    if (error) {
      // PostgREST returns PGRST205 when relation not found.
      return { exists: false, error };
    }
    // If query succeeded (even with empty array), table exists
    return { exists: true };
  } catch (err) {
    return { exists: false, error: err };
  }
}

// Utility: fetch packages from DB (ordered)
async function fetchPackagesFromDb(): Promise<{ data?: any[]; error?: any }> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

// GET - Fetch all packages with caching + inflight dedupe
async function handlePackagesGetRequest(_request: NextRequest) {
  try {
    const now = Date.now();

    // Serve from in-memory cache if fresh
    if (packagesCache && now - packagesCache.timestamp < CACHE_TTL * 1000) {
      return NextResponse.json(
        { packages: packagesCache.data },
        {
          headers: {
            'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=600`,
            'X-Cache': 'HIT',
          },
        }
      );
    }

    // Prevent stampede: if a fetch is already in flight, await it
    if (packagesFetchInFlight) {
      await packagesFetchInFlight;
      if (packagesCache) {
        return NextResponse.json(
          { packages: packagesCache.data },
          {
            headers: {
              'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=600`,
              'X-Cache': 'HIT_AFTER_WAIT',
            },
          }
        );
      }
      // If still no cache, fall through to fetch below
    }

    // Start fetch and store promise to dedupe
    packagesFetchInFlight = (async () => {
      try {
        // Probe table existence using admin client (avoids information_schema)
        const probe = await probePackagesTable();
        if (!probe.exists) {
          // Keep packagesCache null in this case
          console.warn('Packages table missing or inaccessible', probe.error);
          return;
        }

        const { data, error } = await fetchPackagesFromDb();
        if (!error && Array.isArray(data)) {
          packagesCache = { data, timestamp: Date.now() };
        } else if (error) {
          console.error('Error fetching packages:', error);
        }
      } finally {
        // clear inflight marker
        packagesFetchInFlight = null;
      }
    })();

    // Wait for the fetch to complete
    await packagesFetchInFlight;

    if (packagesCache) {
      return NextResponse.json(
        { packages: packagesCache.data },
        {
          headers: {
            'Cache-Control': `public, s-maxage=${CACHE_TTL}, stale-while-revalidate=600`,
            'X-Cache': 'MISS',
          },
        }
      );
    }

    // If packagesCache still null, it likely means table missing or error
    // Probe once more to determine if table missing or error
    const probeFinal = await probePackagesTable();
    if (!probeFinal.exists) {
      // Graceful fallback for public API: return empty list with warning
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

    // Unexpected: table exists but fetch failed
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  } catch (err: any) {
    console.error('Error in GET /api/packages:', err);
    if (err?.message === 'Rate limit exceeded') {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

// POST - Create a package (server-side, requires auth)
async function handlePackagesPostRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Enforce admin/role check using Clerk (or your role system).
    // Example: fetch Clerk user metadata / roles and ensure admin access.
    // For now we assume authenticated users can create; change this to require admin.

    // Probe table existence
    const probe = await probePackagesTable();
    if (!probe.exists) {
      console.error('Error checking packages table existence (POST):', probe.error);
      return NextResponse.json(
        { error: 'Packages table not found. Please run database migrations.' },
        { status: 503 }
      );
    }

    // Parse body safely
    let body: any;
    try {
      body = await request.json();
    } catch (err: any) {
      return NextResponse.json(
        { error: 'Invalid or empty request body', details: err?.message },
        { status: 400 }
      );
    }

    const { name, description, price, hours, features, popular } = body ?? {};

    // Validation rules
    const errors: string[] = [];

    if (!name || typeof name !== 'string' || !name.trim()) errors.push('name is required');
    if (!description || typeof description !== 'string' || !description.trim()) errors.push('description is required');

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) errors.push('price must be a non-negative number');

    const parsedHours = Number(hours);
    if (!Number.isInteger(parsedHours) || parsedHours < 1) errors.push('hours must be an integer >= 1');

    // Parse features: accept array or JSON string representing array
    let parsedFeatures: any[] = [];
    if (Array.isArray(features)) {
      parsedFeatures = features;
    } else if (typeof features === 'string' && features.trim()) {
      try {
        const tmp = JSON.parse(features);
        if (!Array.isArray(tmp)) errors.push('features must be an array');
        else parsedFeatures = tmp;
      } catch (e: any) {
        errors.push('features must be a valid JSON array string');
      }
    } else {
      errors.push('features is required and must be an array or JSON string');
    }

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    // Optional: sanitize/normalize features content (require items to be objects or strings)
    parsedFeatures = parsedFeatures.map((f) => {
      if (f == null) return f;
      if (typeof f === 'string') return f.trim();
      if (typeof f === 'object') return f;
      return String(f);
    });

    // Use service role client for server-side writes
    const { data: newPackage, error: insertError } = await supabaseAdmin
      .from('packages')
      .insert({
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        hours: parsedHours,
        features: parsedFeatures,
        popular: Boolean(popular),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting package:', insertError);
      // If it's relation-not-found, surface a 503 for migrations needed
      if (insertError.code === 'PGRST205') {
        return NextResponse.json(
          { error: 'Packages table not found. Please run database migrations.' },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: 'Failed to create package', details: insertError.message }, { status: 500 });
    }

    // Clear and optionally pre-warm the cache
    packagesCache = null;
    // Optionally: pre-warm cache
    (async () => {
      try {
        const { data } = await fetchPackagesFromDb();
        if (Array.isArray(data)) {
          packagesCache = { data, timestamp: Date.now() };
        }
      } catch (e) {
        // do not block response
        console.warn('Failed to pre-warm packages cache', e);
      }
    })();

    return NextResponse.json({ package: newPackage }, { status: 201 });
  } catch (err: any) {
    console.error('Error in POST /api/packages:', err);
    if (err?.message === 'Rate limit exceeded') {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
}

export const GET = withCentralizedStateManagement(handlePackagesGetRequest, '/api/packages', {
  priority: 'medium',
  maxRetries: 2,
  requireAuth: false,
});

export const POST = withCentralizedStateManagement(handlePackagesPostRequest, '/api/packages', {
  priority: 'medium',
  maxRetries: 1,
  requireAuth: true,
});