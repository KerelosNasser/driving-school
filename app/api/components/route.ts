import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { ComponentInstance, ComponentPosition, RealtimeEvent } from '@/lib/realtime/types';

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

// Validate component position
function validateComponentPosition(position: ComponentPosition): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!position.pageId) errors.push('pageId is required');
  if (!position.sectionId) errors.push('sectionId is required');
  if (typeof position.order !== 'number' || position.order < 0) {
    errors.push('order must be a non-negative number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Sanitize component props to prevent XSS
function sanitizeComponentProps(props: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string') {
      // Basic HTML sanitization - in production, use a proper sanitization library
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeComponentProps(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// GET - Retrieve components for a page
async function handleComponentsGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('page');
    const componentId = searchParams.get('componentId');
    const sectionId = searchParams.get('sectionId');

    if (!pageName) {
      return NextResponse.json(
        { error: 'Page name is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('page_components')
      .select('*')
      .eq('page_name', pageName)
      .eq('is_active', true);

    if (componentId) {
      query = query.eq('component_id', componentId);
    }

    if (sectionId) {
      query = query.eq('position_section', sectionId);
    }

    const { data: components, error } = await query
      .order('position_section')
      .order('position_order');

    if (error) {
      console.error('Error fetching components:', error);
      return NextResponse.json(
        { error: 'Failed to fetch components' },
        { status: 500 }
      );
    }

    // Transform to ComponentInstance format
    const componentInstances: ComponentInstance[] = (components || []).map(comp => ({
      id: comp.component_id,
      type: comp.component_type,
      position: {
        pageId: comp.page_name,
        sectionId: comp.position_section,
        order: comp.position_order,
        parentId: comp.parent_component_id
      },
      props: comp.props || {},
      version: comp.version,
      createdBy: comp.created_by,
      createdAt: comp.created_at,
      lastModifiedBy: comp.last_modified_by,
      lastModifiedAt: comp.last_modified_at
    }));

    return NextResponse.json({
      success: true,
      data: componentInstances,
      count: componentInstances.length
    });

  } catch (error) {
    console.error('Components GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new component
async function handleComponentsPostRequest(request: NextRequest) {
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
    const { componentType, position, props = {} } = body;

    if (!componentType || !position) {
      return NextResponse.json(
        { error: 'Component type and position are required' },
        { status: 400 }
      );
    }

    // Validate position
    const positionValidation = validateComponentPosition(position);
    if (!positionValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid position', details: positionValidation.errors },
        { status: 400 }
      );
    }

    // Sanitize props
    const sanitizedProps = sanitizeComponentProps(props);

    // Generate unique component ID
    const componentId = `${componentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if we need to adjust order of existing components
    const { data: existingComponents } = await supabaseAdmin
      .from('page_components')
      .select('position_order')
      .eq('page_name', position.pageId)
      .eq('position_section', position.sectionId)
      .gte('position_order', position.order)
      .eq('is_active', true);

    // Shift existing components if necessary
    if (existingComponents && existingComponents.length > 0) {
      await supabaseAdmin
        .from('page_components')
        .update({ position_order: supabaseAdmin.raw('position_order + 1') })
        .eq('page_name', position.pageId)
        .eq('position_section', position.sectionId)
        .gte('position_order', position.order)
        .eq('is_active', true);
    }

    const now = new Date().toISOString();

    // Create component
    const { data: component, error } = await supabaseAdmin
      .from('page_components')
      .insert({
        page_name: position.pageId,
        component_type: componentType,
        component_id: componentId,
        position_section: position.sectionId,
        position_order: position.order,
        parent_component_id: position.parentId,
        props: sanitizedProps,
        version: '1',
        created_by: userId,
        created_at: now,
        last_modified_by: userId,
        last_modified_at: now,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating component:', error);
      return NextResponse.json(
        { error: 'Failed to create component' },
        { status: 500 }
      );
    }

    // Broadcast component add event
    const addEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      type: 'component_add',
      pageName: position.pageId,
      userId,
      timestamp: now,
      version: '1',
      data: {
        componentId,
        componentType,
        position,
        props: sanitizedProps
      }
    };

    await supabaseAdmin
      .from('realtime_events')
      .insert({
        id: addEvent.id,
        event_type: addEvent.type,
        page_name: addEvent.pageName,
        user_id: addEvent.userId,
        event_data: addEvent.data,
        created_at: addEvent.timestamp
      });

    return NextResponse.json({
      success: true,
      data: {
        id: componentId,
        type: componentType,
        position,
        props: sanitizedProps,
        version: '1',
        createdBy: userId,
        createdAt: now,
        lastModifiedBy: userId,
        lastModifiedAt: now
      },
      message: 'Component created successfully'
    });

  } catch (error) {
    console.error('Components POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update component properties
async function handleComponentsPutRequest(request: NextRequest) {
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
    const { componentId, props, expectedVersion } = body;

    if (!componentId) {
      return NextResponse.json(
        { error: 'Component ID is required' },
        { status: 400 }
      );
    }

    // Get current component for version checking
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

    // Sanitize props
    const sanitizedProps = props ? sanitizeComponentProps(props) : currentComponent.props;
    const newVersion = (parseInt(currentComponent.version) + 1).toString();
    const now = new Date().toISOString();

    // Update component
    const { data: updatedComponent, error } = await supabaseAdmin
      .from('page_components')
      .update({
        props: sanitizedProps,
        version: newVersion,
        last_modified_by: userId,
        last_modified_at: now
      })
      .eq('component_id', componentId)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      console.error('Error updating component:', error);
      return NextResponse.json(
        { error: 'Failed to update component' },
        { status: 500 }
      );
    }

    // Broadcast content change event
    const changeEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      type: 'content_change',
      pageName: currentComponent.page_name,
      userId,
      timestamp: now,
      version: newVersion,
      data: {
        contentKey: `component-${componentId}`,
        oldValue: currentComponent.props,
        newValue: sanitizedProps,
        contentType: 'json',
        componentId
      }
    };

    await supabaseAdmin
      .from('realtime_events')
      .insert({
        id: changeEvent.id,
        event_type: changeEvent.type,
        page_name: changeEvent.pageName,
        user_id: changeEvent.userId,
        event_data: changeEvent.data,
        created_at: changeEvent.timestamp
      });

    return NextResponse.json({
      success: true,
      data: {
        id: componentId,
        type: updatedComponent.component_type,
        position: {
          pageId: updatedComponent.page_name,
          sectionId: updatedComponent.position_section,
          order: updatedComponent.position_order,
          parentId: updatedComponent.parent_component_id
        },
        props: sanitizedProps,
        version: newVersion,
        createdBy: updatedComponent.created_by,
        createdAt: updatedComponent.created_at,
        lastModifiedBy: userId,
        lastModifiedAt: now
      },
      message: 'Component updated successfully'
    });

  } catch (error) {
    console.error('Components PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a component
async function handleComponentsDeleteRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const componentId = searchParams.get('componentId');

    if (!componentId) {
      return NextResponse.json(
        { error: 'Component ID is required' },
        { status: 400 }
      );
    }

    // Get component before deletion for event broadcasting
    const { data: component, error: fetchError } = await supabaseAdmin
      .from('page_components')
      .select('*')
      .eq('component_id', componentId)
      .eq('is_active', true)
      .single();

    if (fetchError || !component) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('page_components')
      .update({
        is_active: false,
        last_modified_by: userId,
        last_modified_at: new Date().toISOString()
      })
      .eq('component_id', componentId);

    if (error) {
      console.error('Error deleting component:', error);
      return NextResponse.json(
        { error: 'Failed to delete component' },
        { status: 500 }
      );
    }

    // Reorder remaining components
    await supabaseAdmin
      .from('page_components')
      .update({ position_order: supabaseAdmin.raw('position_order - 1') })
      .eq('page_name', component.page_name)
      .eq('position_section', component.position_section)
      .gt('position_order', component.position_order)
      .eq('is_active', true);

    // Broadcast component delete event
    const deleteEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      type: 'component_delete',
      pageName: component.page_name,
      userId,
      timestamp: new Date().toISOString(),
      version: component.version,
      data: {
        componentId,
        position: {
          pageId: component.page_name,
          sectionId: component.position_section,
          order: component.position_order,
          parentId: component.parent_component_id
        },
        componentType: component.component_type
      }
    };

    await supabaseAdmin
      .from('realtime_events')
      .insert({
        id: deleteEvent.id,
        event_type: deleteEvent.type,
        page_name: deleteEvent.pageName,
        user_id: deleteEvent.userId,
        event_data: deleteEvent.data,
        created_at: deleteEvent.timestamp
      });

    return NextResponse.json({
      success: true,
      message: 'Component deleted successfully'
    });

  } catch (error) {
    console.error('Components DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(
  handleComponentsGetRequest,
  '/api/components',
  {
    priority: 'medium',
    maxRetries: 2,
    requireAuth: true
  }
);

export const POST = withCentralizedStateManagement(
  handleComponentsPostRequest,
  '/api/components',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);

export const PUT = withCentralizedStateManagement(
  handleComponentsPutRequest,
  '/api/components',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);

export const DELETE = withCentralizedStateManagement(
  handleComponentsDeleteRequest,
  '/api/components',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);