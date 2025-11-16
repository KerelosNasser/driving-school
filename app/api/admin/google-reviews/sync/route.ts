import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { TokenManager } from '@/lib/oauth/token-manager';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Types for Google My Business API
interface GoogleReview {
  name: string; // Format: accounts/{account}/locations/{location}/reviews/{review}
  reviewId: string;
  reviewer: {
    profilePhotoUrl?: string;
    displayName: string;
    isAnonymous?: boolean;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'STAR_RATING_UNSPECIFIED';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

interface GoogleBusinessProfileResponse {
  reviews: GoogleReview[];
  nextPageToken?: string;
  totalReviewCount: number;
  averageRating: number;
}

// Convert Google star rating to number
function convertStarRating(starRating: string): number {
  const ratings: Record<string, number> = {
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5,
    'STAR_RATING_UNSPECIFIED': 5
  };
  return ratings[starRating] || 5;
}

// POST - Sync Google Business reviews to database
export async function POST(request: NextRequest) {
  const syncLogId = crypto.randomUUID();
  
  try {
    // Check authentication
    const authResult = await auth();
    const userId = authResult?.userId;
    
    console.log('[Google Reviews Sync] Auth check:', { 
      hasUserId: !!userId,
      userId: userId ? userId.substring(0, 8) + '...' : 'none'
    });
    
    if (!userId) {
      console.error('[Google Reviews Sync] Authentication failed - no userId');
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You must be logged in to sync reviews. Please sign in and try again.'
      }, { status: 401 });
    }

    // TODO: Add admin role check
    // For now, allow any authenticated user
    console.log('[Google Reviews Sync] User authenticated, proceeding with sync...');

    // Check environment variables
    const GOOGLE_LOCATION_ID = process.env.GOOGLE_LOCATION_ID;
    const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
    
    console.log('[Google Reviews Sync] Environment check:', {
      hasLocationId: !!GOOGLE_LOCATION_ID,
      hasClientEmail: !!GOOGLE_CLIENT_EMAIL,
      hasPrivateKey: !!GOOGLE_PRIVATE_KEY,
      locationId: GOOGLE_LOCATION_ID ? GOOGLE_LOCATION_ID.substring(0, 30) + '...' : 'missing'
    });
    
    if (!GOOGLE_LOCATION_ID) {
      console.error('[Google Reviews Sync] GOOGLE_LOCATION_ID not configured');
      return NextResponse.json({ 
        error: 'Configuration missing',
        details: 'GOOGLE_LOCATION_ID is not configured. Please add it to your environment variables.',
        hint: 'Format: accounts/YOUR_ACCOUNT_ID/locations/YOUR_LOCATION_ID'
      }, { status: 500 });
    }

    if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      console.error('[Google Reviews Sync] Service account credentials missing');
      return NextResponse.json({ 
        error: 'Service account not configured',
        details: 'GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY is missing.',
        hint: 'These should already be configured for your Calendar integration.'
      }, { status: 500 });
    }

    // Get service account access token using existing TokenManager
    console.log('[Google Reviews Sync] Requesting service account token...');
    const jwtConfig = TokenManager.getJWTConfigForUseCase('custom', [
      'https://www.googleapis.com/auth/business.manage'
    ]);
    
    const accessToken = await TokenManager.getServiceAccountToken(jwtConfig);
    
    if (!accessToken) {
      console.error('[Google Reviews Sync] Failed to obtain access token');
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: 'Failed to obtain access token from service account.',
        hint: 'Check that GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY are correctly configured.',
        troubleshooting: 'Run: node test-google-business-reviews.js to diagnose the issue'
      }, { status: 500 });
    }
    
    console.log('[Google Reviews Sync] Access token obtained successfully');

    // Create sync log entry
    console.log('[Google Reviews Sync] Creating sync log entry...');
    const { error: logError } = await supabaseAdmin.from('review_sync_log').insert({
      id: syncLogId,
      source: 'google',
      status: 'in_progress',
      sync_started_at: new Date().toISOString()
    });
    
    if (logError) {
      console.error('[Google Reviews Sync] Failed to create sync log:', logError);
      // Continue anyway - logging failure shouldn't stop the sync
    }

    let allReviews: GoogleReview[] = [];
    let nextPageToken: string | undefined;
    let totalFetched = 0;

    // Fetch all pages of reviews
    console.log('[Google Reviews Sync] Starting to fetch reviews...');
    do {
      // Construct API URL using Google Business Profile API (newer version)
      const baseUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${GOOGLE_LOCATION_ID}/reviews`;
      const params = new URLSearchParams({
        pageSize: '50',
        ...(nextPageToken && { pageToken: nextPageToken })
      });

      const apiUrl = `${baseUrl}?${params.toString()}`;
      console.log(`[Google Reviews Sync] Fetching from: ${apiUrl.substring(0, 100)}...`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Google Reviews Sync] Google API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Update sync log with error
        await supabaseAdmin.from('review_sync_log').update({
          status: 'failed',
          sync_completed_at: new Date().toISOString(),
          error_message: `Google API error: ${response.status} - ${errorText}`,
          reviews_fetched: totalFetched
        }).eq('id', syncLogId);

        const errorMessages: Record<number, string> = {
          401: 'Authentication failed. Service account token may be invalid.',
          403: 'Access denied. Service account needs Manager access to your Google Business Profile.',
          404: 'Location not found. Check your GOOGLE_LOCATION_ID format.',
          429: 'Rate limit exceeded. Please try again later.'
        };

        return NextResponse.json({ 
          error: 'Failed to fetch Google reviews',
          details: errorMessages[response.status] || errorText,
          status: response.status,
          troubleshooting: response.status === 403 
            ? 'Add your service account as Manager in Google Business Profile'
            : response.status === 404
            ? 'Verify GOOGLE_LOCATION_ID format: accounts/{account}/locations/{location}'
            : 'Run: node test-google-business-reviews.js to diagnose'
        }, { status: response.status });
      }

      const data: GoogleBusinessProfileResponse = await response.json();
      console.log(`[Google Reviews Sync] Fetched ${data.reviews?.length || 0} reviews from this page`);
      
      if (data.reviews && data.reviews.length > 0) {
        allReviews = allReviews.concat(data.reviews);
        totalFetched += data.reviews.length;
      }

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);
    
    console.log(`[Google Reviews Sync] Total reviews fetched: ${totalFetched}`);

    // Process and import reviews
    console.log('[Google Reviews Sync] Processing and importing reviews...');
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const review of allReviews) {
      try {
        const reviewData = {
          user_id: null, // External reviews don't have user_id
          user_name: review.reviewer.displayName || 'Anonymous',
          rating: convertStarRating(review.starRating),
          comment: review.comment || '',
          approved: true, // Auto-approve Google reviews
          source: 'google',
          external_id: review.reviewId || review.name.split('/').pop(),
          profile_photo_url: review.reviewer.profilePhotoUrl,
          reply: review.reviewReply ? {
            comment: review.reviewReply.comment,
            updated_at: review.reviewReply.updateTime
          } : null,
          created_at: review.createTime,
          updated_at: review.updateTime,
          synced_at: new Date().toISOString()
        };

        // Check if review already exists
        const { data: existing } = await supabaseAdmin
          .from('reviews')
          .select('id, updated_at')
          .eq('source', 'google')
          .eq('external_id', reviewData.external_id)
          .single();

        if (existing) {
          // Update existing review if it has changed
          const { error } = await supabaseAdmin
            .from('reviews')
            .update(reviewData)
            .eq('id', existing.id);

          if (error) {
            console.error('Error updating review:', error);
            skipped++;
          } else {
            updated++;
          }
        } else {
          // Insert new review
          const { error } = await supabaseAdmin
            .from('reviews')
            .insert(reviewData);

          if (error) {
            console.error('Error inserting review:', error);
            skipped++;
          } else {
            imported++;
          }
        }
      } catch (error) {
        console.error('Error processing review:', error);
        skipped++;
      }
    }

    // Update sync log with success
    await supabaseAdmin.from('review_sync_log').update({
      status: 'completed',
      sync_completed_at: new Date().toISOString(),
      reviews_fetched: totalFetched,
      reviews_imported: imported,
      reviews_updated: updated,
      reviews_skipped: skipped,
      metadata: {
        total_reviews: allReviews.length,
        sync_duration_ms: Date.now() - new Date().getTime()
      }
    }).eq('id', syncLogId);

    console.log('[Google Reviews Sync] Sync completed successfully:', {
      fetched: totalFetched,
      imported,
      updated,
      skipped
    });

    return NextResponse.json({
      success: true,
      message: 'Google reviews synced successfully',
      stats: {
        fetched: totalFetched,
        imported,
        updated,
        skipped,
        total: imported + updated
      },
      syncLogId
    });

  } catch (error) {
    console.error('[Google Reviews Sync] Fatal error:', error);
    
    // Update sync log with error
    await supabaseAdmin.from('review_sync_log').update({
      status: 'failed',
      sync_completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error'
    }).eq('id', syncLogId);

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET - Get sync status and history
export async function GET(request: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    
    console.log('[Google Reviews Sync] GET request - Auth check:', { hasUserId: !!userId });
    
    if (!userId) {
      console.error('[Google Reviews Sync] GET - Authentication failed');
      return NextResponse.json({ 
        error: 'Unauthorized',
        details: 'You must be logged in to view sync status.'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent sync logs
    const { data: syncLogs, error } = await supabaseAdmin
      .from('review_sync_log')
      .select('*')
      .eq('source', 'google')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Get last successful sync
    const lastSync = syncLogs?.find(log => log.status === 'completed');

    return NextResponse.json({
      success: true,
      lastSync: lastSync ? {
        syncedAt: lastSync.sync_completed_at,
        reviewsImported: lastSync.reviews_imported,
        reviewsUpdated: lastSync.reviews_updated,
        totalReviews: lastSync.reviews_fetched
      } : null,
      syncHistory: syncLogs
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
