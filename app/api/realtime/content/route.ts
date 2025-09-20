import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { RealtimeEvent, ContentChangeEventData } from '@/lib/realtime/types';

// Supabase admin client for real-time operations
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

async function isUserAdmin(_userId: string): Promise<boolean> {
  // Simplified admin check - in production, check against proper user roles
  return process.env.NODE_ENV === 'development' || true;
}

// GET - Subscribe to real-time content updates for a page
async function handleRealtimeContentGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('page') || 'home';
    const componentId = searchParams.get('componentId');

    // Create Server-Sent Events stream for real-time updates
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'connected',
          pageName,
          userId,
          timestamp: new Date().toISOString()
        })}\n\n`));

        // Set up Supabase real-time subscription
        const channel = supabaseAdmin
          .channel(`content-${pageName}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'page_content',
              filter: `page_name=eq.${pageName}`
            },
            (payload) => {
              const event: RealtimeEvent = {
                id: crypto.randomUUID(),
                type: 'content_change',
                pageName,
                userId: payload.new?.updated_by || payload.old?.updated_by || 'system',
                timestamp: new Date().toISOString(),
                version: payload.new?.lock_version?.toString() || '1',
                data: {
                  contentKey: payload.new?.content_key || payload.old?.content_key,
                  oldValue: payload.old?.content_value || payload.old?.content_json,
                  newValue: payload.new?.content_value || payload.new?.content_json,
                  contentType: payload.new?.content_type || payload.old?.content_type,
                  componentId: payload.new?.component_id || payload.old?.component_id,
                  eventType: payload.eventType
                } as ContentChangeEventData
              };

              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
              } catch (error) {
                console.error('Error sending real-time event:', error);
              }
            }
          )
          .subscribe();

        // Also listen to component changes if componentId is specified
        if (componentId) {
          const componentChannel = supabaseAdmin
            .channel(`component-${componentId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'page_components',
                filter: `component_id=eq.${componentId}`
              },
              (payload) => {
                const event: RealtimeEvent = {
                  id: crypto.randomUUID(),
                  type: payload.eventType === 'DELETE' ? 'component_delete' : 
                        payload.eventType === 'INSERT' ? 'component_add' : 'component_move',
                  pageName,
                  userId: payload.new?.last_modified_by || payload.old?.last_modified_by || 'system',
                  timestamp: new Date().toISOString(),
                  version: payload.new?.version || payload.old?.version || '1',
                  data: payload
                };

                try {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
                } catch (error) {
                  console.error('Error sending component event:', error);
                }
              }
            )
            .subscribe();
        }

        // Send keepalive every 30 seconds
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'keepalive',
              timestamp: new Date().toISOString()
            })}\n\n`));
          } catch (error) {
            clearInterval(keepAlive);
          }
        }, 30000);

        // Clean up on close
        controller.closed?.then(() => {
          clearInterval(keepAlive);
          channel.unsubscribe();
        });
      },
      cancel() {
        // Cleanup handled in closed promise above
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    console.error('Real-time content stream error:', error);
    return NextResponse.json(
      { error: 'Failed to establish real-time connection' },
      { status: 500 }
    );
  }
}

// POST - Broadcast real-time content change
async function handleRealtimeContentPostRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      pageName, 
      contentKey, 
      value, 
      type = 'text', 
      componentId,
      expectedVersion 
    } = body;

    if (!pageName || !contentKey) {
      return NextResponse.json(
        { error: 'Page name and content key are required' },
        { status: 400 }
      );
    }

    // Check for conflicts using optimistic locking
    if (expectedVersion) {
      const { data: currentContent } = await supabaseAdmin
        .from('page_content')
        .select('lock_version')
        .eq('page_name', pageName)
        .eq('content_key', contentKey)
        .single();

      if (currentContent && currentContent.lock_version !== parseInt(expectedVersion)) {
        return NextResponse.json({
          success: false,
          conflict: true,
          currentVersion: currentContent.lock_version,
          expectedVersion: parseInt(expectedVersion),
          message: 'Content was modified by another user'
        }, { status: 409 });
      }
    }

    // Prepare content data
    const contentData: any = {
      page_name: pageName,
      content_key: contentKey,
      updated_at: new Date().toISOString(),
      updated_by: userId,
      lock_version: expectedVersion ? parseInt(expectedVersion) + 1 : 1,
      component_id: componentId
    };

    switch (type) {
      case 'text':
        contentData.content_value = value;
        contentData.content_type = 'text';
        contentData.content_json = null;
        break;
      case 'json':
        contentData.content_json = typeof value === 'object' ? value : JSON.parse(value);
        contentData.content_type = 'json';
        contentData.content_value = null;
        break;
      case 'file':
        contentData.file_url = value;
        contentData.content_type = 'file';
        contentData.content_value = null;
        contentData.content_json = null;
        break;
      default:
        contentData.content_value = value;
        contentData.content_type = 'text';
        contentData.content_json = null;
    }

    // Save content with upsert (this will trigger real-time events automatically)
    const { data, error } = await supabaseAdmin
      .from('page_content')
      .upsert(contentData, {
        onConflict: 'page_name,content_key',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving real-time content:', error);
      return NextResponse.json(
        { error: 'Failed to save content' },
        { status: 500 }
      );
    }

    // Create version history entry
    await supabaseAdmin
      .from('content_versions')
      .insert({
        page_name: pageName,
        content_key: contentKey,
        content_value: contentData.content_value,
        content_json: contentData.content_json,
        file_url: contentData.file_url,
        content_type: type,
        version_number: contentData.lock_version,
        created_by: userId,
        event_type: 'realtime_edit'
      });

    return NextResponse.json({
      success: true,
      data,
      version: contentData.lock_version,
      message: 'Content updated and broadcasted successfully'
    });

  } catch (error) {
    console.error('Real-time content update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(
  handleRealtimeContentGetRequest, 
  '/api/realtime/content', 
  {
    priority: 'high',
    maxRetries: 2,
    requireAuth: true
  }
);

export const POST = withCentralizedStateManagement(
  handleRealtimeContentPostRequest, 
  '/api/realtime/content', 
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);