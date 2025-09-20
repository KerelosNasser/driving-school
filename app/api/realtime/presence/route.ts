import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { EditorPresence, RealtimeEvent, PresenceUpdateEventData } from '@/lib/realtime/types';

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

// GET - Get current presence for a page
async function handlePresenceGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('page');
    
    if (!pageName) {
      return NextResponse.json(
        { error: 'Page name is required' },
        { status: 400 }
      );
    }

    // Get active edit sessions for the page
    const { data: sessions, error } = await supabaseAdmin
      .from('edit_sessions')
      .select(`
        user_id,
        component_id,
        status,
        last_activity,
        session_start
      `)
      .eq('page_name', pageName)
      .eq('status', 'active')
      .gte('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

    if (error) {
      console.error('Error fetching presence:', error);
      return NextResponse.json(
        { error: 'Failed to fetch presence data' },
        { status: 500 }
      );
    }

    // Transform sessions to presence format
    const presence: EditorPresence[] = sessions?.map(session => ({
      userId: session.user_id,
      userName: session.user_id, // In production, fetch actual user name
      componentId: session.component_id,
      action: session.status === 'active' ? 'editing' : 'idle',
      lastSeen: session.last_activity
    })) || [];

    return NextResponse.json({
      success: true,
      data: presence,
      pageName
    });

  } catch (error) {
    console.error('Presence GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update user presence
async function handlePresencePostRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageName, componentId, action = 'editing' } = body;

    if (!pageName) {
      return NextResponse.json(
        { error: 'Page name is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Upsert edit session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('edit_sessions')
      .upsert({
        user_id: userId,
        page_name: pageName,
        component_id: componentId,
        status: action === 'editing' ? 'active' : 'idle',
        last_activity: now,
        session_start: now, // Will be ignored on update due to upsert
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }, {
        onConflict: 'user_id,page_name',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error updating presence:', sessionError);
      return NextResponse.json(
        { error: 'Failed to update presence' },
        { status: 500 }
      );
    }

    // Broadcast presence update via Supabase real-time
    const presenceEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      type: 'presence_update',
      pageName,
      userId,
      timestamp: now,
      version: '1',
      data: {
        presence: {
          userId,
          userName: userId, // In production, fetch actual user name
          componentId,
          action: action as 'editing' | 'idle',
          lastSeen: now
        },
        action: 'update'
      } as PresenceUpdateEventData
    };

    // Insert into a real-time events table for broadcasting
    await supabaseAdmin
      .from('realtime_events')
      .insert({
        id: presenceEvent.id,
        event_type: presenceEvent.type,
        page_name: presenceEvent.pageName,
        user_id: presenceEvent.userId,
        event_data: presenceEvent.data,
        created_at: presenceEvent.timestamp
      });

    return NextResponse.json({
      success: true,
      data: session,
      message: 'Presence updated successfully'
    });

  } catch (error) {
    console.error('Presence POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove user presence (disconnect)
async function handlePresenceDeleteRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('page');

    if (!pageName) {
      return NextResponse.json(
        { error: 'Page name is required' },
        { status: 400 }
      );
    }

    // Update session status to disconnected
    const { error } = await supabaseAdmin
      .from('edit_sessions')
      .update({
        status: 'disconnected',
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('page_name', pageName);

    if (error) {
      console.error('Error removing presence:', error);
      return NextResponse.json(
        { error: 'Failed to remove presence' },
        { status: 500 }
      );
    }

    // Broadcast presence leave event
    const presenceEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      type: 'presence_update',
      pageName,
      userId,
      timestamp: new Date().toISOString(),
      version: '1',
      data: {
        presence: {
          userId,
          userName: userId,
          action: 'idle' as const,
          lastSeen: new Date().toISOString()
        },
        action: 'leave'
      } as PresenceUpdateEventData
    };

    await supabaseAdmin
      .from('realtime_events')
      .insert({
        id: presenceEvent.id,
        event_type: presenceEvent.type,
        page_name: presenceEvent.pageName,
        user_id: presenceEvent.userId,
        event_data: presenceEvent.data,
        created_at: presenceEvent.timestamp
      });

    return NextResponse.json({
      success: true,
      message: 'Presence removed successfully'
    });

  } catch (error) {
    console.error('Presence DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(
  handlePresenceGetRequest,
  '/api/realtime/presence',
  {
    priority: 'medium',
    maxRetries: 2,
    requireAuth: true
  }
);

export const POST = withCentralizedStateManagement(
  handlePresencePostRequest,
  '/api/realtime/presence',
  {
    priority: 'medium',
    maxRetries: 1,
    requireAuth: true
  }
);

export const DELETE = withCentralizedStateManagement(
  handlePresenceDeleteRequest,
  '/api/realtime/presence',
  {
    priority: 'medium',
    maxRetries: 1,
    requireAuth: true
  }
);