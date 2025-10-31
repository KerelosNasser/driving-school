import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { NavigationItem, RealtimeEvent } from '@/lib/realtime/types';

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

async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();
    
    return !error && user?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// GET - Get navigation structure
async function handleNavigationGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const parentId = searchParams.get('parentId');

    let query = supabaseAdmin
      .from('navigation_items')
      .select('*')
      .eq('is_active', true);

    if (!includeHidden) {
      query = query.eq('is_visible', true);
    }

    if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    const { data: navigationItems, error } = await query
      .order('order_index');

    if (error) {
      console.error('Error fetching navigation:', error);
      return NextResponse.json(
        { error: 'Failed to fetch navigation' },
        { status: 500 }
      );
    }

    // Transform to NavigationItem format
    const items: NavigationItem[] = (navigationItems || []).map(item => ({
      id: item.id,
      pageId: item.page_name,
      displayName: item.display_name,
      urlSlug: item.url_slug,
      parentId: item.parent_id,
      orderIndex: item.order_index,
      isVisible: item.is_visible,
      isActive: item.is_active
    }));

    // Build hierarchical structure if no specific parent requested
    if (!parentId) {
      const buildHierarchy = (items: NavigationItem[], parentId: string | null = null): NavigationItem[] => {
        return items
          .filter(item => item.parentId === parentId)
          .map(item => ({
            ...item,
            children: buildHierarchy(items, item.id)
          }));
      };

      const hierarchicalItems = buildHierarchy(items);

      return NextResponse.json({
        success: true,
        data: hierarchicalItems,
        flat: items,
        count: items.length
      });
    }

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length
    });

  } catch (error) {
    console.error('Navigation GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update navigation structure (reorder, visibility, etc.)
async function handleNavigationPutRequest(request: NextRequest) {
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
    const { operation, data } = body;

    if (!operation || !data) {
      return NextResponse.json(
        { error: 'Operation and data are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    switch (operation) {
      case 'reorder':
        return await handleNavigationReorder(data, userId, now);
      
      case 'update_visibility':
        return await handleNavigationVisibilityUpdate(data, userId, now);
      
      case 'move_item':
        return await handleNavigationItemMove(data, userId, now);
      
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Navigation PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle navigation reordering
async function handleNavigationReorder(data: any, userId: string, now: string) {
  const { items, parentId = null } = data;

  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: 'Items must be an array' },
      { status: 400 }
    );
  }

  // Validate that all items exist and belong to the same parent
  const { data: existingItems, error: fetchError } = await supabaseAdmin
    .from('navigation_items')
    .select('id, order_index')
    .eq('parent_id', parentId)
    .eq('is_active', true);

  if (fetchError) {
    console.error('Error fetching existing navigation items:', fetchError);
    return NextResponse.json(
      { error: 'Failed to fetch existing navigation items' },
      { status: 500 }
    );
  }

  const existingIds = new Set(existingItems?.map(item => item.id) || []);
  const invalidIds = items.filter((id: string) => !existingIds.has(id));

  if (invalidIds.length > 0) {
    return NextResponse.json(
      { error: `Invalid navigation item IDs: ${invalidIds.join(', ')}` },
      { status: 400 }
    );
  }

  // Update order for all items
  const updatePromises = items.map((itemId: string, index: number) => 
    supabaseAdmin
      .from('navigation_items')
      .update({
        order_index: index,
        updated_at: now
      })
      .eq('id', itemId)
  );

  const results = await Promise.allSettled(updatePromises);
  const failures = results.filter(r => r.status === 'rejected');

  if (failures.length > 0) {
    console.error('Some navigation updates failed:', failures);
    return NextResponse.json(
      { error: 'Failed to update some navigation items' },
      { status: 500 }
    );
  }

  // Broadcast navigation update event
  const navUpdateEvent: RealtimeEvent = {
    id: crypto.randomUUID(),
    type: 'nav_update',
    pageName: 'navigation',
    userId,
    timestamp: now,
    version: '1',
    data: {
      items: items.map((id: string, index: number) => ({
        id,
        orderIndex: index
      })),
      changeType: 'reorder',
      affectedItemIds: items,
      parentId
    }
  };

  await supabaseAdmin
    .from('realtime_events')
    .insert({
      id: navUpdateEvent.id,
      event_type: navUpdateEvent.type,
      page_name: navUpdateEvent.pageName,
      user_id: navUpdateEvent.userId,
      event_data: navUpdateEvent.data,
      created_at: navUpdateEvent.timestamp
    });

  return NextResponse.json({
    success: true,
    data: {
      parentId,
      items,
      updatedCount: items.length
    },
    message: 'Navigation reordered successfully'
  });
}

// Handle navigation visibility updates
async function handleNavigationVisibilityUpdate(data: any, userId: string, now: string) {
  const { itemId, isVisible } = data;

  if (!itemId || typeof isVisible !== 'boolean') {
    return NextResponse.json(
      { error: 'Item ID and visibility status are required' },
      { status: 400 }
    );
  }

  const { data: updatedItem, error } = await supabaseAdmin
    .from('navigation_items')
    .update({
      is_visible: isVisible,
      updated_at: now
    })
    .eq('id', itemId)
    .eq('is_active', true)
    .select()
    .single();

  if (error) {
    console.error('Error updating navigation visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update navigation visibility' },
      { status: 500 }
    );
  }

  // Broadcast navigation update event
  const navUpdateEvent: RealtimeEvent = {
    id: crypto.randomUUID(),
    type: 'nav_update',
    pageName: 'navigation',
    userId,
    timestamp: now,
    version: '1',
    data: {
      items: [{
        id: itemId,
        isVisible
      }],
      changeType: 'update',
      affectedItemIds: [itemId]
    }
  };

  await supabaseAdmin
    .from('realtime_events')
    .insert({
      id: navUpdateEvent.id,
      event_type: navUpdateEvent.type,
      page_name: navUpdateEvent.pageName,
      user_id: navUpdateEvent.userId,
      event_data: navUpdateEvent.data,
      created_at: navUpdateEvent.timestamp
    });

  return NextResponse.json({
    success: true,
    data: updatedItem,
    message: 'Navigation visibility updated successfully'
  });
}

// Handle moving navigation item to different parent
async function handleNavigationItemMove(data: any, userId: string, now: string) {
  const { itemId, newParentId, newOrderIndex } = data;

  if (!itemId) {
    return NextResponse.json(
      { error: 'Item ID is required' },
      { status: 400 }
    );
  }

  // Get current item
  const { data: currentItem, error: fetchError } = await supabaseAdmin
    .from('navigation_items')
    .select('*')
    .eq('id', itemId)
    .eq('is_active', true)
    .single();

  if (fetchError || !currentItem) {
    return NextResponse.json(
      { error: 'Navigation item not found' },
      { status: 404 }
    );
  }

  // Prevent moving item to be its own child
  if (newParentId === itemId) {
    return NextResponse.json(
      { error: 'Cannot move item to be its own child' },
      { status: 400 }
    );
  }

  // Get next order index if not specified
  let finalOrderIndex = newOrderIndex;
  if (finalOrderIndex === undefined) {
    const { data: maxOrderResult } = await supabaseAdmin
      .from('navigation_items')
      .select('order_index')
      .eq('parent_id', newParentId || null)
      .eq('is_active', true)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    finalOrderIndex = (maxOrderResult?.order_index || -1) + 1;
  }

  // Update old siblings (shift up)
  await supabaseAdmin
    .from('navigation_items')
    .update({ 
      order_index: supabaseAdmin.raw('order_index - 1'),
      updated_at: now
    })
    .eq('parent_id', currentItem.parent_id)
    .gt('order_index', currentItem.order_index)
    .eq('is_active', true);

  // Update new siblings (shift down)
  await supabaseAdmin
    .from('navigation_items')
    .update({ 
      order_index: supabaseAdmin.raw('order_index + 1'),
      updated_at: now
    })
    .eq('parent_id', newParentId || null)
    .gte('order_index', finalOrderIndex)
    .eq('is_active', true);

  // Update the item itself
  const { data: updatedItem, error: updateError } = await supabaseAdmin
    .from('navigation_items')
    .update({
      parent_id: newParentId,
      order_index: finalOrderIndex,
      updated_at: now
    })
    .eq('id', itemId)
    .select()
    .single();

  if (updateError) {
    console.error('Error moving navigation item:', updateError);
    return NextResponse.json(
      { error: 'Failed to move navigation item' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: updatedItem,
    message: 'Navigation item moved successfully'
  });
}

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(
  handleNavigationGetRequest,
  '/api/navigation/manage',
  {
    priority: 'medium',
    maxRetries: 2,
    requireAuth: true
  }
);

export const PUT = withCentralizedStateManagement(
  handleNavigationPutRequest,
  '/api/navigation/manage',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);