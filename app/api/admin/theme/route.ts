import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function isUserAdmin(_userId: string): Promise<boolean> {
  try {
    // For development, allow all authenticated users
    return true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// GET - Retrieve current theme configuration
export async function GET(_request: NextRequest) {
  try {
    // Public: allow reading theme configuration without authentication so
    // the site can render the configured theme for all visitors.
    const supabase = await createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('setting_key', 'theme_config')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Supabase error:', error);
      return NextResponse.json({
        error: 'Failed to fetch theme configuration',
        details: error.message
      }, { status: 500 });
    }

    // Return theme config or default
    const themeConfig = data?.setting_value || {
      colors: {
        primary: '#EDE513',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        foreground: '#020817',
        muted: '#f1f5f9',
        destructive: '#ef4444',
        border: '#e2e8f0',
        ring: '#EDE513'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        headingFontFamily: 'Inter, sans-serif',
        lineHeight: 1.5,
        letterSpacing: 0
      },
      layout: {
        containerMaxWidth: '1200px',
        borderRadius: 8,
        spacing: 16,
        headerHeight: 80,
        footerHeight: 120,
        sidebarWidth: 280
      },
      darkMode: false,
      customCss: ''
    };

    return NextResponse.json({ data: themeConfig });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Save theme configuration
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: 'Theme configuration is required' }, { status: 400 });
    }

    const supabase = await createServerComponentClient({ cookies });

    // Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: 'theme_config',
        setting_value: config,
        updated_by: userId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({
        error: 'Failed to save theme configuration',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Theme configuration saved successfully'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
