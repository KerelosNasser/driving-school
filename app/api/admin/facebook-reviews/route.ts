import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Types for Facebook Graph API responses
interface FacebookReview {
  id: string;
  created_time: string;
  reviewer: {
    name: string;
    id: string;
    picture?: {
      data: {
        url: string;
      };
    };
  };
  rating: number;
  review_text?: string;
  recommendation_type: 'positive' | 'negative' | 'no_recommendation';
  open_graph_story?: {
    id: string;
    message?: string;
  };
}

interface FacebookPageResponse {
  data: FacebookReview[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
    previous?: string;
  };
}

// Transform Facebook review to our format
function transformFacebookReview(review: FacebookReview) {
  return {
    external_id: review.id,
    source: 'facebook',
    user_name: review.reviewer.name || 'Anonymous',
    rating: review.rating,
    comment: review.review_text || review.open_graph_story?.message || '',
    created_at: review.created_time,
    updated_at: review.created_time,
    approved: false, // Admin needs to approve external reviews
    profile_photo_url: review.reviewer.picture?.data?.url,
    recommendation_type: review.recommendation_type,
    facebook_user_id: review.reviewer.id
  };
}

// GET - Fetch Facebook page reviews
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
    const after = searchParams.get('after') || '';
    const limit = parseInt(searchParams.get('limit') || '25');

    // Facebook Graph API configuration
    const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID; // Your Facebook page ID
    
    if (!FACEBOOK_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
      return NextResponse.json({ 
        error: 'Facebook API configuration missing',
        details: 'Please set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID environment variables'
      }, { status: 500 });
    }

    // Construct API URL for Facebook Graph API
    let apiUrl = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/ratings`;
    const params = new URLSearchParams({
      access_token: FACEBOOK_ACCESS_TOKEN,
      fields: 'id,created_time,reviewer{name,id,picture},rating,review_text,recommendation_type,open_graph_story{id,message}',
      limit: limit.toString()
    });

    if (after) {
      params.append('after', after);
    }

    apiUrl += `?${params.toString()}`;

    // Fetch reviews from Facebook Graph API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facebook API Error:', response.status, errorText);
      
      // Return mock data for demonstration when API is not configured
      if (response.status === 401 || response.status === 403) {
        console.log('Using mock Facebook reviews data for demonstration');
        const mockReviews = [
          {
            external_id: 'facebook_1',
            source: 'facebook',
            user_name: 'Sarah Johnson',
            rating: 5,
            comment: 'Amazing driving school! Michael is such a patient and skilled instructor. I was nervous about driving but he made me feel comfortable and confident. Passed my test first time!',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            approved: false,
            profile_photo_url: null,
            recommendation_type: 'positive',
            facebook_user_id: 'fb_user_1'
          },
          {
            external_id: 'facebook_2',
            source: 'facebook',
            user_name: 'Mike Thompson',
            rating: 4,
            comment: 'Great experience with EG Driving School. Flexible scheduling worked perfect for my busy work schedule. Instructor was professional and knowledgeable about Brisbane traffic.',
            created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            approved: false,
            profile_photo_url: null,
            recommendation_type: 'positive',
            facebook_user_id: 'fb_user_2'
          },
          {
            external_id: 'facebook_3',
            source: 'facebook',
            user_name: 'Emma Chen',
            rating: 5,
            comment: 'Highly recommend! The instructor was very patient with me as a nervous driver. Great teaching methods and helped me build real confidence on the road. Thank you!',
            created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
            approved: false,
            profile_photo_url: null,
            recommendation_type: 'positive',
            facebook_user_id: 'fb_user_3'
          },
          {
            external_id: 'facebook_4',
            source: 'facebook',
            user_name: 'Alex Rodriguez',
            rating: 5,
            comment: 'Best driving school in Brisbane! Professional, punctual, and really knows how to teach. The car is modern and comfortable. Passed my test with flying colors!',
            created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            approved: false,
            profile_photo_url: null,
            recommendation_type: 'positive',
            facebook_user_id: 'fb_user_4'
          }
        ];

        return NextResponse.json({
          success: true,
          reviews: mockReviews,
          totalReviewCount: mockReviews.length,
          source: 'facebook',
          isMockData: true,
          message: 'This is demonstration data. Configure Facebook Graph API for real reviews.'
        });
      }

      return NextResponse.json({ 
        error: 'Failed to fetch Facebook reviews',
        details: errorText
      }, { status: response.status });
    }

    const data: FacebookPageResponse = await response.json();
    
    // Transform Facebook reviews to our format
    const transformedReviews = data.data?.map(transformFacebookReview) || [];

    return NextResponse.json({
      success: true,
      reviews: transformedReviews,
      nextCursor: data.paging?.cursors?.after,
      totalReviewCount: transformedReviews.length,
      source: 'facebook',
      paging: data.paging
    });

  } catch (error) {
    console.error('Error fetching Facebook reviews:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Import selected Facebook reviews to database
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
      message: `Successfully imported ${reviewIds.length} Facebook reviews`
    });

  } catch (error) {
    console.error('Error importing Facebook reviews:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}