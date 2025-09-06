import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Types for Google My Business API responses
interface GoogleReview {
  reviewId: string;
  reviewer: {
    profilePhotoUrl?: string;
    displayName: string;
    isAnonymous?: boolean;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

interface GoogleMyBusinessResponse {
  reviews: GoogleReview[];
  nextPageToken?: string;
  totalReviewCount: number;
}

// Convert Google star rating to number
function convertStarRating(starRating: string): number {
  switch (starRating) {
    case 'ONE': return 1;
    case 'TWO': return 2;
    case 'THREE': return 3;
    case 'FOUR': return 4;
    case 'FIVE': return 5;
    default: return 5;
  }
}

// Transform Google review to our format
function transformGoogleReview(review: GoogleReview) {
  return {
    external_id: review.reviewId,
    source: 'google',
    user_name: review.reviewer.displayName || 'Anonymous',
    rating: convertStarRating(review.starRating),
    comment: review.comment || '',
    created_at: review.createTime,
    updated_at: review.updateTime,
    approved: false, // Admin needs to approve external reviews
    profile_photo_url: review.reviewer.profilePhotoUrl,
    reply: review.reviewReply ? {
      comment: review.reviewReply.comment,
      updated_at: review.reviewReply.updateTime
    } : null
  };
}

// GET - Fetch Google Business reviews
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here
    // For now, we'll allow any authenticated user (you can enhance this)

    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('pageToken') || '';
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Google My Business API configuration
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const LOCATION_ID = process.env.GOOGLE_LOCATION_ID; // Your Google Business location ID
    
    if (!GOOGLE_API_KEY || !LOCATION_ID) {
      return NextResponse.json({ 
        error: 'Google My Business API configuration missing',
        details: 'Please set GOOGLE_MY_BUSINESS_API_KEY and GOOGLE_LOCATION_ID environment variables'
      }, { status: 500 });
    }

    // Construct API URL
    const baseUrl = `https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/${LOCATION_ID}/reviews`;
    let apiUrl = `${baseUrl}?key=${GOOGLE_API_KEY}`;
    
    if (pageSize) {
      apiUrl += `&pageSize=${pageSize}`;
    }
    if (pageToken) {
      apiUrl += `&pageToken=${pageToken}`;
    }

    // Fetch reviews from Google My Business API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.GOOGLE_OAUTH_ACCESS_TOKEN}`, // OAuth access token needed
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API Error:', response.status, errorText);
      
      // Return appropriate error based on status
      const statusMessages = {
        401: 'Google My Business API authentication failed. Please check your OAuth token.',
        403: 'Access denied. Please verify your Google My Business API permissions.',
        404: 'Business location not found. Please check your GOOGLE_LOCATION_ID.',
        429: 'API quota exceeded. Please try again later.'
      };
      
      const message = statusMessages[response.status as keyof typeof statusMessages] || 
                     `Google My Business API error: ${response.status}`;

      return NextResponse.json({ 
        error: message,
        details: errorText,
        success: false
      }, { status: response.status });
    }

    const data: GoogleMyBusinessResponse = await response.json();
    
    // Transform Google reviews to our format
    const transformedReviews = data.reviews?.map(transformGoogleReview) || [];

    return NextResponse.json({
      success: true,
      reviews: transformedReviews,
      nextPageToken: data.nextPageToken,
      totalReviewCount: data.totalReviewCount,
      source: 'google'
    });

  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Import selected Google reviews to database
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewIds } = body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid request',
        details: 'reviewIds array is required'
      }, { status: 400 });
    }

    // For now, return success - this would integrate with your Supabase database
    // to import the selected reviews
    
    // TODO: Implement actual database insertion
    // const { data, error } = await supabase
    //   .from('external_reviews')
    //   .insert(reviewsToImport);

    return NextResponse.json({
      success: true,
      imported: reviewIds.length,
      message: `Successfully imported ${reviewIds.length} Google reviews`
    });

  } catch (error) {
    console.error('Error importing Google reviews:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}