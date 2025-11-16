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
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check
    // Verify user is admin before allowing sync

    // Check environment variables
    const GOOGLE_LOCATION_ID = process.env.GOOGLE_LOCATION_ID;
    
    if (!GOOGLE_LOCATION_ID) {
      return NextResponse.json({ 
        error: 'Configuration missing',
        details: 'GOOGLE_LOCATION_ID is not configured. Please set up your Google Business location ID.'
      }, { status: 500 });
    }

    // Get service account access token using existing TokenManager
    const jwtConfig = TokenManager.getJWTConfigForUseCase('custom', [
      'https://www.googleapis.com/auth/business.manage'
    ]);
    
    const accessToken = await TokenManager.getServiceAccountToken(jwtConfig);
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: 'Failed to obtain access token from service account. Check your GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY.'
      }, { status: 500 });
    }

    // Create sync log entry
    await supabaseAdmin.from('review_sync_log').insert({
      id: syncLogId,
      source: 'google',
      status: 'in_progress',
      sync_started_at: new Date().toISOString()
    });

    let allReviews: GoogleReview[] = [];
    let nextPageToken: string | undefined;
    let totalFetched = 0;

    // Fetch all pages of reviews
    do {
      // Construct API URL using Google Business Profile API (newer version)
      const baseUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${GOOGLE_LOCATION_ID}/reviews`;
      const params = new URLSearchParams({
        pageSize: '50',
        ...(nextPageToken && { pageToken: nextPageToken })
      });

      const apiUrl = `${baseUrl}?${params.toString()}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google API Error:', response.status, errorText);
        
        // Update sync log with error
        await supabaseAdmin.from('review_sync_log').update({
          status: 'failed',
          sync_completed_at: new Date().toISOString(),
          error_message: `Google API error: ${response.status} - ${errorText}`,
          reviews_fetched: totalFetched
        }).eq('id', syncLogId);

        return NextResponse.json({ 
          error: 'Failed to fetch Google reviews',
          details: errorText,
          status: response.status
        }, { status: response.status });
      }

      const data: GoogleBusinessProfileResponse = await response.json();
      
      if (data.reviews && data.reviews.length > 0) {
        allReviews = allReviews.concat(data.reviews);
        totalFetched += data.reviews.length;
      }

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    // Process and import reviews
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
    console.error('Error syncing Google reviews:', error);
    
    // Update sync log with error
    await supabaseAdmin.from('review_sync_log').update({
      status: 'failed',
      sync_completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error'
    }).eq('id', syncLogId);

    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Get sync status and history
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
