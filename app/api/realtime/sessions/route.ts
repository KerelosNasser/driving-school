import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET - Get active sessions for a page or user
async function handleSessionsGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('page');
    const targetUserId = searchParams.get('userId');

    let query = supabaseAdmin
      .from('edit_sessions')
      .select(`
        id,
        user_id,
        page_name,
        component_id,
        session_start,
        last_activity,
        status,
        user_agent
      `)
      .in('status', ['active', 'idle'])
      .gte('last_activity', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Active in last 30 minutes

    if (pageName) {
      query = query.eq('page_name', pageName);
    }

    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: sessions, error } = await query.order('last_activity', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: sessions || [],
      count: sessions?.length || 0
    });

  } catch (error) {
    console.error('Sessions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update a session
async function handleSessionsPostRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageName, componentId, action = 'join' } = body;

    if (!pageName) {
      return NextResponse.json(
        { error: 'Page name is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (action === 'join') {
      // Create or update session
      const { data: session, error } = await supabaseAdmin
        .from('edit_sessions')
        .upsert({
          user_id: userId,
          page_name: pageName,
          component_id: componentId,
          status: 'active',
          last_activity: now,
          session_start: now,
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }, {
          onConflict: 'user_id,page_name',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: session,
        message: 'Session created successfully'
      });

    } else if (action === 'heartbeat') {
      // Update last activity
      const { data: session, error } = await supabaseAdmin
        .from('edit_sessions')
        .update({
          last_activity: now,
          component_id: componentId,
          status: 'active'
        })
        .eq('user_id', userId)
        .eq('page_name', pageName)
        .select()
        .single();

      if (error) {
        console.error('Error updating session heartbeat:', error);
        return NextResponse.json(
          { error: 'Failed to update session' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: session,
        message: 'Session heartbeat updated'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "join" or "heartbeat"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Sessions POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - End a session
async function handleSessionsDeleteRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('page');
    const sessionId = searchParams.get('sessionId');

    if (!pageName && !sessionId) {
      return NextResponse.json(
        { error: 'Either page name or session ID is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('edit_sessions')
      .update({
        status: 'disconnected',
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (sessionId) {
      query = query.eq('id', sessionId);
    } else if (pageName) {
      query = query.eq('page_name', pageName);
    }

    const { error } = await query;

    if (error) {
      console.error('Error ending session:', error);
      return NextResponse.json(
        { error: 'Failed to end session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session ended successfully'
    });

  } catch (error) {
    console.error('Sessions DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Clean up stale sessions (admin only)
async function handleSessionsPatchRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple admin check - in production, implement proper role checking
    const isAdmin = process.env.NODE_ENV === 'development' || true;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { staleThresholdMinutes = 30 } = body;

    const staleThreshold = new Date(Date.now() - staleThresholdMinutes * 60 * 1000).toISOString();

    // Mark stale sessions as disconnected
    const { data: staleSessions, error } = await supabaseAdmin
      .from('edit_sessions')
      .update({
        status: 'disconnected'
      })
      .in('status', ['active', 'idle'])
      .lt('last_activity', staleThreshold)
      .select('id, user_id, page_name, last_activity');

    if (error) {
      console.error('Error cleaning up stale sessions:', error);
      return NextResponse.json(
        { error: 'Failed to clean up stale sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: staleSessions || [],
      count: staleSessions?.length || 0,
      message: `Cleaned up ${staleSessions?.length || 0} stale sessions`
    });

  } catch (error) {
    console.error('Sessions PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(
  handleSessionsGetRequest,
  '/api/realtime/sessions',
  {
    priority: 'medium',
    maxRetries: 2,
    requireAuth: true
  }
);

export const POST = withCentralizedStateManagement(
  handleSessionsPostRequest,
  '/api/realtime/sessions',
  {
    priority: 'medium',
    maxRetries: 1,
    requireAuth: true
  }
);

export const DELETE = withCentralizedStateManagement(
  handleSessionsDeleteRequest,
  '/api/realtime/sessions',
  {
    priority: 'medium',
    maxRetries: 1,
    requireAuth: true
  }
);

export const PATCH = withCentralizedStateManagement(
  handleSessionsPatchRequest,
  '/api/realtime/sessions',
  {
    priority: 'low',
    maxRetries: 1,
    requireAuth: true
  }
);