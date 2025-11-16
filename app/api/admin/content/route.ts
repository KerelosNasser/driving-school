import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Create admin Supabase client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Check if user is admin
async function isAdmin() {
  const { userId, sessionClaims } = await auth();
  
  if (!userId) {
    return false;
  }

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const userEmail = sessionClaims?.email as string | undefined;

  return userEmail === adminEmail;
}

// GET - Load content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 'home';
    const key = searchParams.get('key');

    const supabase = getSupabaseAdmin();
    
    let query = supabase
      .from('content')
      .select('*')
      .eq('page', page);

    if (key) {
      query = query.eq('key', key);
    }

    const { data, error } = key 
      ? await query.maybeSingle()
      : await query;

    if (error) {
      console.error('Error loading content:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || null });
  } catch (error: any) {
    console.error('Error in GET /api/admin/content:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update content
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { page, key, value } = body;

    if (!page || !key) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Page and key are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if content exists
    const { data: existing } = await supabase
      .from('content')
      .select('id')
      .eq('page', page)
      .eq('key', key)
      .maybeSingle();

    let result;
    
    if (existing) {
      // Update existing content
      result = await supabase
        .from('content')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new content
      result = await supabase
        .from('content')
        .insert([{ page, key, value }])
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving content:', result.error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: result.error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data,
      message: 'Content saved successfully'
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/content:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create content
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { page, key, value } = body;

    if (!page || !key) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Page and key are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('content')
      .insert([{ page, key, value }])
      .select()
      .single();

    if (error) {
      console.error('Error creating content:', error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Content created successfully'
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/content:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove content
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 'home';
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Key is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('content')
      .delete()
      .eq('page', page)
      .eq('key', key);

    if (error) {
      console.error('Error deleting content:', error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/content:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
