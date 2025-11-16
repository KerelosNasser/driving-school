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

// GET - Load vacation days
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
      .from('vacation_days')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error loading vacation days:', error);
      return NextResponse.json(
        { error: 'Database error', message: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error in GET /api/vacation-days:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Add vacation day
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

    const { data, error } = await supabase
      .from('vacation_days')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Error adding vacation day:', error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: error.message,
          code: error.code,
          details: error.details
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Vacation day added successfully'
    });
  } catch (error: any) {
    console.error('Error in POST /api/vacation-days:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove vacation day
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Bad request', message: 'Vacation day ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('vacation_days')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing vacation day:', error);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Vacation day removed successfully'
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/vacation-days:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
