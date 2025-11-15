// app/api/reviews/route.ts
import { supabaseAdmin } from '@/lib/api/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('API route hit: /api/reviews GET');
  
  try {
    // Log environment check
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Attempting to fetch reviews from Supabase...');
    
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error fetching reviews:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch reviews',
        details: error.message,
        code: error.code,
        hint: error.hint || ''
      }, { status: 500 });
    }

    console.log('Successfully fetched reviews:', reviews?.length || 0);
    
    return NextResponse.json({
      success: true,
      reviews,
      total: reviews?.length || 0
    });
  } catch (error) {
    console.error('Error in reviews API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch reviews',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : '',
      hint: error instanceof Error && 'hint' in error ? (error as any).hint : '',
      code: error instanceof Error && 'code' in error ? (error as any).code : ''
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, rating, comment } = body;

    if (!name || !email || !rating || !comment) {
      return NextResponse.json({ 
        error: 'Name, email, rating, and comment are required' 
      }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        name,
        email,
        rating,
        comment,
        approved: false, // <- use approved column
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json({ 
        error: 'Failed to create review',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review,
      message: 'Review submitted successfully and is pending approval'
    });
  } catch (error) {
    console.error('Error in reviews POST API:', error);
    return NextResponse.json({ 
      error: 'Failed to create review',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}