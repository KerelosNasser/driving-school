import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug packages endpoint hit');
    
    // Check if packages table exists and has data
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Packages query result:', { packages, error });

    if (error) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      packagesCount: packages?.length || 0,
      packages: packages || [],
      message: packages?.length ? 'Packages found' : 'No packages in database'
    });

  } catch (error) {
    console.error('Debug packages error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}