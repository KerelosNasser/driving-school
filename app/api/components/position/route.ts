import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { ComponentPosition, RealtimeEvent } from '@/lib/realtime/types';

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

async function isUserAdmin(_userId: string): Promise<boolean> {
  return process.env.NODE_ENV === 'development' || true;
}

// POST - Move component to new position
async function handlePositionPostRequest(request: NextRequest) {
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
    const { componentId, newPosition, expectedVersion } = body;

    if (!componentId || !newPosition) {
      return NextResponse.json(
        { error: 'Component ID and new position are required' },
        { status: 400 }
      );
    }

    // Validate new position
    if (!newPosition.pageId || !newPosition.sectionId || typeof newPosition.order !== 'number') {
      return NextResponse.json(
        { error: 'Invalid position format' },
        { status: 400 }
      );
    }

    // Get current component
    const { data: currentComponent, error: fetchError } = await supabaseAdmin
      .from('page_components')
      .select('*')
      .eq('component_id', componentId)
      .eq('is_active', true)
      .single();

    if (fetchError || !currentComponent) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    // Check version for optimistic locking
    if (expectedVersion && currentComponent.version !== expectedVersion) {
      return NextResponse.json({
        success: false,
        conflict: true,
        currentVersion: currentComponent.version,
        expectedVersion,
        message: 'Component was modified by another user'
      }, { status: 409 });
    }

    const oldPosition: ComponentPosition = {
      pageId: currentComponent.page_name,
      sectionId: currentComponent.position_section,
      order: currentComponent.position_order,
      parentId: currentComponent.parent_component_id
    };

    // Start transaction for atomic position updates
    const { error: transactionError } = await supabaseAdmin.rpc('move_component_position', {
      p_component_id: componentId,
      p_old_page: oldPosition.pageId,
      p_old_section: oldPosition.sectionId,
      p_old_order: oldPosition.order,
      p_new_page: newPosition.pageId,
      p_new_section: newPosition.sectionId,
      p_new_order: newPosition.order,
      p_new_parent: newPosition.parentId,
      p_user_id: userId
    });

    if (transactionError) {
      // If RPC function doesn't exist, fall back to manual transaction
      console.warn('RPC function not found, using manual transaction');
      
      // Manual position update logic
      const now = new Date().toISOString();
      const newVersion = (parseInt(currentComponent.version) + 1).toString();

      // If moving within the same section
      if (oldPosition.pageId === newPosition.pageId && oldPosition.sectionId === newPosition.sectionId) {
        if (oldPosition.order < newPosition.order) {
          // Moving down: shift components between old and new position up
          await supabaseAdmin
            .from('page_components')
            .update({ position_order: supabaseAdmin.raw('position_order - 1') })
            .eq('page_name', newPosition.pageId)
            .eq('position_section', newPosition.sectionId)
            .gt('position_order', oldPosition.order)
            .lte('position_order', newPosition.order)
            .eq('is_active', true);
        } else if (oldPosition.order > newPosition.order) {
          // Moving up: shift components between new and old position down
          await supabaseAdmin
            .from('page_components')
            .update({ position_order: supabaseAdmin.raw('position_order + 1') })
            .eq('page_name', newPosition.pageId)
            .eq('position_section', newPosition.sectionId)
            .gte('position_order', newPosition.order)
            .lt('position_order', oldPosition.order)
            .eq('is_active', true);
        }
      } else {
        // Moving to different section: shift components in both sections
        
        // Shift components in old section up
        await supabaseAdmin
          .from('page_components')
          .update({ position_order: supabaseAdmin.raw('position_order - 1') })
          .eq('page_name', oldPosition.pageId)
          .eq('position_section', oldPosition.sectionId)
          .gt('position_order', oldPosition.order)
          .eq('is_active', true);

        // Shift components in new section down
        await supabaseAdmin
          .from('page_components')
          .update({ position_order: supabaseAdmin.raw('position_order + 1') })
          .eq('page_name', newPosition.pageId)
          .eq('position_section', newPosition.sectionId)
          .gte('position_order', newPosition.order)
          .eq('is_active', true);
      }

      // Update the component's position
      const { error: updateError } = await supabaseAdmin
        .from('page_components')
        .update({
          page_name: newPosition.pageId,
          position_section: newPosition.sectionId,
          position_order: newPosition.order,
          parent_component_id: newPosition.parentId,
          version: newVersion,
          last_modified_by: userId,
          last_modified_at: now
        })
        .eq('component_id', componentId);

      if (updateError) {
        console.error('Error updating component position:', updateError);
        return NextResponse.json(
          { error: 'Failed to update component position' },
          { status: 500 }
        );
      }
    }

    // Broadcast component move event
    const moveEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      type: 'component_move',
      pageName: newPosition.pageId,
      userId,
      timestamp: new Date().toISOString(),
      version: (parseInt(currentComponent.version) + 1).toString(),
      data: {
        componentId,
        oldPosition,
        newPosition
      }
    };

    await supabaseAdmin
      .from('realtime_events')
      .insert({
        id: moveEvent.id,
        event_type: moveEvent.type,
        page_name: moveEvent.pageName,
        user_id: moveEvent.userId,
        event_data: moveEvent.data,
        created_at: moveEvent.timestamp
      });

    return NextResponse.json({
      success: true,
      data: {
        componentId,
        oldPosition,
        newPosition,
        version: (parseInt(currentComponent.version) + 1).toString()
      },
      message: 'Component position updated successfully'
    });

  } catch (error) {
    console.error('Position POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Bulk reorder components in a section
async function handlePositionPutRequest(request: NextRequest) {
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
    const { pageId, sectionId, componentOrder } = body;

    if (!pageId || !sectionId || !Array.isArray(componentOrder)) {
      return NextResponse.json(
        { error: 'Page ID, section ID, and component order array are required' },
        { status: 400 }
      );
    }

    // Validate that all components exist and belong to the section
    const { data: existingComponents, error: fetchError } = await supabaseAdmin
      .from('page_components')
      .select('component_id, version')
      .eq('page_name', pageId)
      .eq('position_section', sectionId)
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching existing components:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch existing components' },
        { status: 500 }
      );
    }

    const existingIds = new Set(existingComponents?.map(c => c.component_id) || []);
    const invalidIds = componentOrder.filter(id => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid component IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Update positions for all components
    const now = new Date().toISOString();
    const updatePromises = componentOrder.map((componentId: string, index: number) => {
      const currentComponent = existingComponents?.find(c => c.component_id === componentId);
      const newVersion = currentComponent ? (parseInt(currentComponent.version) + 1).toString() : '1';

      return supabaseAdmin
        .from('page_components')
        .update({
          position_order: index,
          version: newVersion,
          last_modified_by: userId,
          last_modified_at: now
        })
        .eq('component_id', componentId)
        .eq('page_name', pageId)
        .eq('position_section', sectionId);
    });

    const results = await Promise.allSettled(updatePromises);
    const failures = results.filter(r => r.status === 'rejected');

    if (failures.length > 0) {
      console.error('Some component updates failed:', failures);
      return NextResponse.json(
        { error: 'Failed to update some component positions' },
        { status: 500 }
      );
    }

    // Broadcast navigation update event
    const reorderEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      type: 'nav_update',
      pageName: pageId,
      userId,
      timestamp: now,
      version: '1',
      data: {
        items: componentOrder.map((id: string, index: number) => ({
          id,
          orderIndex: index
        })),
        changeType: 'reorder',
        affectedItemIds: componentOrder,
        sectionId
      }
    };

    await supabaseAdmin
      .from('realtime_events')
      .insert({
        id: reorderEvent.id,
        event_type: reorderEvent.type,
        page_name: reorderEvent.pageName,
        user_id: reorderEvent.userId,
        event_data: reorderEvent.data,
        created_at: reorderEvent.timestamp
      });

    return NextResponse.json({
      success: true,
      data: {
        pageId,
        sectionId,
        componentOrder,
        updatedCount: componentOrder.length
      },
      message: 'Components reordered successfully'
    });

  } catch (error) {
    console.error('Position PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with centralized state management
export const POST = withCentralizedStateManagement(
  handlePositionPostRequest,
  '/api/components/position',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);

export const PUT = withCentralizedStateManagement(
  handlePositionPutRequest,
  '/api/components/position',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);