import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron job endpoint to automatically sync Google Business reviews daily
 * 
 * To set up in Vercel:
 * 1. Add to vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/sync-reviews",
 *        "schedule": "0 2 * * *"
 *      }]
 *    }
 * 
 * 2. Set CRON_SECRET in environment variables
 * 3. This will run daily at 2 AM UTC
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting automatic review sync...');

    // Call the sync endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const syncUrl = `${baseUrl}/api/admin/google-reviews/sync`;

    // Use a service account or admin token for authentication
    // For now, we'll use the CRON_SECRET as a simple auth mechanism
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret || '',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[CRON] Sync failed:', data);
      return NextResponse.json({
        success: false,
        error: 'Sync failed',
        details: data,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log('[CRON] Sync completed successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Reviews synced successfully',
      stats: data.stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CRON] Error in automatic sync:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Also support POST for manual testing
export async function POST(request: NextRequest) {
  return GET(request);
}
