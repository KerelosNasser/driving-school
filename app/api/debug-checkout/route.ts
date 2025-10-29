import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Debug checkout endpoint hit');
    
    const { userId: clerkUserId } = await auth();
    console.log('Clerk User ID:', clerkUserId);
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Check environment variables
    const hasBaseUrl = !!process.env.NEXT_PUBLIC_BASE_URL;
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    console.log('Environment check:', {
      hasBaseUrl,
      hasSupabaseUrl,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    });
    
    return NextResponse.json({
      success: true,
      clerkUserId,
      body,
      env: {
        hasBaseUrl,
        hasSupabaseUrl,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL
      }
    });
    
  } catch (error) {
    console.error('Debug checkout error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}