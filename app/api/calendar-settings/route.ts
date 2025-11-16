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

// GET - Load calendar settings
export async function GET() {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('calendar_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading calendar settings:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || null });
  } catch (error: any) {
    console.error('Error in GET /api/calendar-settings:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Save calendar settings
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = getSupabaseAdmin();

    // Check if settings exist
    const { data: existing } = await supabase
      .from('calendar_settings')
      .select('id')
      .single();

    let result;
    
    if (existing) {
      // Update existing settings
      result = await supabase
        .from('calendar_settings')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new settings
      result = await supabase
        .from('calendar_settings')
        .insert([body])
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error saving calendar settings:', result.error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: result.error.message,
          code: result.error.code,
          details: result.error.details
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: result.data,
      message: 'Calendar settings saved successfully'
    });
  } catch (error: any) {
    console.error('Error in POST /api/calendar-settings:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
