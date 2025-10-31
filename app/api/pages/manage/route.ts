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

// GET - Get page details and metadata
async function handlePageManageGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const urlSlug = searchParams.get('urlSlug');

    if (!pageId && !urlSlug) {
      return NextResponse.json(
        { error: 'Either pageId or urlSlug is required' },
        { status: 400 }
      );
    }

    // Get navigation item
    let navQuery = supabaseAdmin
      .from('navigation_items')
      .select('*')
      .eq('is_active', true);

    if (pageId) {
      navQuery = navQuery.eq('id', pageId);
    } else {
      navQuery = navQuery.eq('url_slug', urlSlug);
    }

    const { data: navigationItem, error: navError } = await navQuery.single();

    if (navError || !navigationItem) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Get page content
    const { data: pageContent, error: contentError } = await supabaseAdmin
      .from('page_content')
      .select('*')
      .eq('page_name', navigationItem.page_name)
      .order('updated_at', { ascending: false });

    if (contentError) {
      console.error('Error fetching page content:', contentError);
    }

    // Get page components
    const { data: components, error: componentsError } = await supabaseAdmin
      .from('page_components')
      .select('*')
      .eq('page_name', navigationItem.page_name)
      .eq('is_active', true)
      .order('position_section')
      .order('position_order');

    if (componentsError) {
      console.error('Error fetching page components:', componentsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        navigationItem,
        content: pageContent || [],
        components: components || [],
        metadata: {
          totalContent: pageContent?.length || 0,
          totalComponents: components?.length || 0,
          lastModified: navigationItem.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Page manage GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update page metadata and settings
async function handlePageManagePutRequest(request: NextRequest) {
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
      pageId, 
      title, 
      urlSlug, 
      isVisible, 
      parentId, 
      orderIndex,
      metaDescription,
      metaKeywords 
    } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    // Get current page
    const { data: currentPage, error: fetchError } = await supabaseAdmin
      .from('navigation_items')
      .select('*')
      .eq('id', pageId)
      .eq('is_active', true)
      .single();

    if (fetchError || !currentPage) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Check if new URL slug conflicts with existing pages
    if (urlSlug && urlSlug !== currentPage.url_slug) {
      const { data: existingPage } = await supabaseAdmin
        .from('navigation_items')
        .select('id')
        .eq('url_slug', urlSlug)
        .eq('is_active', true)
        .neq('id', pageId)
        .single();

      if (existingPage) {
        return NextResponse.json(
          { error: 'A page with this URL slug already exists' },
          { status: 409 }
        );
      }
    }

    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now
    };

    // Update navigation item fields
    if (title !== undefined) updateData.display_name = title;
    if (urlSlug !== undefined) updateData.url_slug = urlSlug;
    if (isVisible !== undefined) updateData.is_visible = isVisible;
    if (parentId !== undefined) updateData.parent_id = parentId;
    if (orderIndex !== undefined) updateData.order_index = orderIndex;

    // Update navigation item
    const { data: updatedPage, error: updateError } = await supabaseAdmin
      .from('navigation_items')
      .update(updateData)
      .eq('id', pageId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating page:', updateError);
      return NextResponse.json(
        { error: 'Failed to update page' },
        { status: 500 }
      );
    }

    // Update page content if URL slug changed
    if (urlSlug && urlSlug !== currentPage.url_slug) {
      await supabaseAdmin
        .from('page_content')
        .update({ page_name: urlSlug })
        .eq('page_name', currentPage.page_name);

      await supabaseAdmin
        .from('page_components')
        .update({ page_name: urlSlug })
        .eq('page_name', currentPage.page_name);
    }

    // Update page title in content
    if (title) {
      await supabaseAdmin
        .from('page_content')
        .upsert({
          page_name: urlSlug || currentPage.page_name,
          content_key: 'page_title',
          content_value: title,
          content_type: 'text',
          updated_by: userId,
          updated_at: now,
          lock_version: 1
        }, {
          onConflict: 'page_name,content_key',
          ignoreDuplicates: false
        });
    }

    // Update meta description
    if (metaDescription !== undefined) {
      if (metaDescription) {
        await supabaseAdmin
          .from('page_content')
          .upsert({
            page_name: urlSlug || currentPage.page_name,
            content_key: 'meta_description',
            content_value: metaDescription,
            content_type: 'text',
            updated_by: userId,
            updated_at: now,
            lock_version: 1
          }, {
            onConflict: 'page_name,content_key',
            ignoreDuplicates: false
          });
      } else {
        // Remove meta description if empty
        await supabaseAdmin
          .from('page_content')
          .delete()
          .eq('page_name', urlSlug || currentPage.page_name)
          .eq('content_key', 'meta_description');
      }
    }

    // Update meta keywords
    if (metaKeywords !== undefined) {
      if (metaKeywords) {
        await supabaseAdmin
          .from('page_content')
          .upsert({
            page_name: urlSlug || currentPage.page_name,
            content_key: 'meta_keywords',
            content_value: metaKeywords,
            content_type: 'text',
            updated_by: userId,
            updated_at: now,
            lock_version: 1
          }, {
            onConflict: 'page_name,content_key',
            ignoreDuplicates: false
          });
      } else {
        // Remove meta keywords if empty
        await supabaseAdmin
          .from('page_content')
          .delete()
          .eq('page_name', urlSlug || currentPage.page_name)
          .eq('content_key', 'meta_keywords');
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPage,
      message: 'Page updated successfully'
    });

  } catch (error) {
    console.error('Page manage PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a page and all its content
async function handlePageManageDeleteRequest(request: NextRequest) {
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
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    // Get page details before deletion
    const { data: page, error: fetchError } = await supabaseAdmin
      .from('navigation_items')
      .select('*')
      .eq('id', pageId)
      .eq('is_active', true)
      .single();

    if (fetchError || !page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    // Check if page has child pages
    const { data: childPages, error: childError } = await supabaseAdmin
      .from('navigation_items')
      .select('id')
      .eq('parent_id', pageId)
      .eq('is_active', true);

    if (childError) {
      console.error('Error checking child pages:', childError);
      return NextResponse.json(
        { error: 'Failed to check page dependencies' },
        { status: 500 }
      );
    }

    if (childPages && childPages.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete page with child pages',
          childCount: childPages.length
        },
        { status: 409 }
      );
    }

    // Soft delete navigation item
    const { error: navDeleteError } = await supabaseAdmin
      .from('navigation_items')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    if (navDeleteError) {
      console.error('Error deleting navigation item:', navDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete page' },
        { status: 500 }
      );
    }

    // Soft delete page components
    await supabaseAdmin
      .from('page_components')
      .update({
        is_active: false,
        last_modified_by: userId,
        last_modified_at: new Date().toISOString()
      })
      .eq('page_name', page.page_name);

    // Note: We keep page_content for audit purposes, but could add a flag if needed

    // Reorder remaining sibling pages
    await supabaseAdmin
      .from('navigation_items')
      .update({ order_index: supabaseAdmin.raw('order_index - 1') })
      .eq('parent_id', page.parent_id)
      .gt('order_index', page.order_index)
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully'
    });

  } catch (error) {
    console.error('Page manage DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(
  handlePageManageGetRequest,
  '/api/pages/manage',
  {
    priority: 'medium',
    maxRetries: 2,
    requireAuth: true
  }
);

export const PUT = withCentralizedStateManagement(
  handlePageManagePutRequest,
  '/api/pages/manage',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);

export const DELETE = withCentralizedStateManagement(
  handlePageManageDeleteRequest,
  '/api/pages/manage',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);