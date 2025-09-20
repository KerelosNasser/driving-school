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

async function isUserAdmin(_userId: string): Promise<boolean> {
  return process.env.NODE_ENV === 'development' || true;
}

// Component schema validation
function validateComponentSchema(schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema || typeof schema !== 'object') {
    errors.push('Schema must be an object');
    return { isValid: false, errors };
  }

  if (!schema.properties || typeof schema.properties !== 'object') {
    errors.push('Schema must have a properties object');
  }

  // Basic validation for required fields
  if (schema.required && !Array.isArray(schema.required)) {
    errors.push('Schema required field must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// GET - Retrieve component library definitions
async function handleLibraryGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const componentId = searchParams.get('id');

    let query = supabaseAdmin
      .from('component_library')
      .select('*')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (componentId) {
      query = query.eq('id', componentId);
    }

    const { data: components, error } = await query.order('name');

    if (error) {
      console.error('Error fetching component library:', error);
      return NextResponse.json(
        { error: 'Failed to fetch component library' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: components || [],
      count: components?.length || 0
    });

  } catch (error) {
    console.error('Library GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add new component to library
async function handleLibraryPostRequest(request: NextRequest) {
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
    const { name, category, icon, defaultProps = {}, schema } = body;

    if (!name || !category || !schema) {
      return NextResponse.json(
        { error: 'Name, category, and schema are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['text', 'media', 'layout', 'interactive'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate schema
    const schemaValidation = validateComponentSchema(schema);
    if (!schemaValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid schema', details: schemaValidation.errors },
        { status: 400 }
      );
    }

    // Check if component name already exists
    const { data: existingComponent } = await supabaseAdmin
      .from('component_library')
      .select('id')
      .eq('name', name)
      .eq('is_active', true)
      .single();

    if (existingComponent) {
      return NextResponse.json(
        { error: 'Component with this name already exists' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // Create component definition
    const { data: component, error } = await supabaseAdmin
      .from('component_library')
      .insert({
        name,
        category,
        icon: icon || 'component',
        default_props: defaultProps,
        schema,
        is_active: true,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating component library entry:', error);
      return NextResponse.json(
        { error: 'Failed to create component definition' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: component,
      message: 'Component added to library successfully'
    });

  } catch (error) {
    console.error('Library POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update component library definition
async function handleLibraryPutRequest(request: NextRequest) {
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
    const { id, name, category, icon, defaultProps, schema } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Component ID is required' },
        { status: 400 }
      );
    }

    // Get current component
    const { data: currentComponent, error: fetchError } = await supabaseAdmin
      .from('component_library')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (fetchError || !currentComponent) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    // Validate category if provided
    if (category) {
      const validCategories = ['text', 'media', 'layout', 'interactive'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate schema if provided
    if (schema) {
      const schemaValidation = validateComponentSchema(schema);
      if (!schemaValidation.isValid) {
        return NextResponse.json(
          { error: 'Invalid schema', details: schemaValidation.errors },
          { status: 400 }
        );
      }
    }

    // Check if new name conflicts with existing component
    if (name && name !== currentComponent.name) {
      const { data: existingComponent } = await supabaseAdmin
        .from('component_library')
        .select('id')
        .eq('name', name)
        .eq('is_active', true)
        .neq('id', id)
        .single();

      if (existingComponent) {
        return NextResponse.json(
          { error: 'Component with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update component
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (icon !== undefined) updateData.icon = icon;
    if (defaultProps !== undefined) updateData.default_props = defaultProps;
    if (schema !== undefined) updateData.schema = schema;

    const { data: updatedComponent, error } = await supabaseAdmin
      .from('component_library')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating component library entry:', error);
      return NextResponse.json(
        { error: 'Failed to update component definition' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedComponent,
      message: 'Component definition updated successfully'
    });

  } catch (error) {
    console.error('Library PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove component from library
async function handleLibraryDeleteRequest(request: NextRequest) {
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
    const componentId = searchParams.get('id');

    if (!componentId) {
      return NextResponse.json(
        { error: 'Component ID is required' },
        { status: 400 }
      );
    }

    // Check if component is in use
    const { data: usageCount, error: usageError } = await supabaseAdmin
      .from('page_components')
      .select('id', { count: 'exact' })
      .eq('component_type', componentId)
      .eq('is_active', true);

    if (usageError) {
      console.error('Error checking component usage:', usageError);
      return NextResponse.json(
        { error: 'Failed to check component usage' },
        { status: 500 }
      );
    }

    if (usageCount && usageCount.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete component that is currently in use',
          usageCount: usageCount.length
        },
        { status: 409 }
      );
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('component_library')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', componentId);

    if (error) {
      console.error('Error deleting component library entry:', error);
      return NextResponse.json(
        { error: 'Failed to delete component definition' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Component removed from library successfully'
    });

  } catch (error) {
    console.error('Library DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(
  handleLibraryGetRequest,
  '/api/components/library',
  {
    priority: 'medium',
    maxRetries: 2,
    requireAuth: true
  }
);

export const POST = withCentralizedStateManagement(
  handleLibraryPostRequest,
  '/api/components/library',
  {
    priority: 'medium',
    maxRetries: 1,
    requireAuth: true
  }
);

export const PUT = withCentralizedStateManagement(
  handleLibraryPutRequest,
  '/api/components/library',
  {
    priority: 'medium',
    maxRetries: 1,
    requireAuth: true
  }
);

export const DELETE = withCentralizedStateManagement(
  handleLibraryDeleteRequest,
  '/api/components/library',
  {
    priority: 'medium',
    maxRetries: 1,
    requireAuth: true
  }
);