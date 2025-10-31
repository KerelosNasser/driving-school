import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { withCentralizedStateManagement } from '@/lib/api-middleware';
import { NewPageData, NavigationItem, RealtimeEvent } from '@/lib/realtime/types';

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

// Validate URL slug format
function validateUrlSlug(slug: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!slug) {
    errors.push('URL slug is required');
    return { isValid: false, errors };
  }

  // Check format: lowercase letters, numbers, hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push('URL slug can only contain lowercase letters, numbers, and hyphens');
  }

  // Check length
  if (slug.length < 2 || slug.length > 100) {
    errors.push('URL slug must be between 2 and 100 characters');
  }

  // Check for reserved words
  const reservedWords = ['api', 'admin', 'auth', 'login', 'logout', 'signup', 'dashboard', 'settings'];
  if (reservedWords.includes(slug)) {
    errors.push('URL slug cannot be a reserved word');
  }

  // Check for leading/trailing hyphens
  if (slug.startsWith('-') || slug.endsWith('-')) {
    errors.push('URL slug cannot start or end with a hyphen');
  }

  // Check for consecutive hyphens
  if (slug.includes('--')) {
    errors.push('URL slug cannot contain consecutive hyphens');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generate URL slug from title
function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// POST - Create a new page
async function handlePageCreatePostRequest(request: NextRequest) {
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
      title, 
      urlSlug, 
      navigationOrder, 
      isVisible = true, 
      template = 'default',
      parentPageId,
      metaDescription,
      metaKeywords
    }: NewPageData & { 
      parentPageId?: string;
      metaDescription?: string;
      metaKeywords?: string;
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Page title is required' },
        { status: 400 }
      );
    }

    // Generate or validate URL slug
    let finalUrlSlug = urlSlug || generateSlugFromTitle(title);
    const slugValidation = validateUrlSlug(finalUrlSlug);
    
    if (!slugValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid URL slug', details: slugValidation.errors },
        { status: 400 }
      );
    }

    // Check if URL slug already exists
    const { data: existingPage } = await supabaseAdmin
      .from('navigation_items')
      .select('id')
      .eq('url_slug', finalUrlSlug)
      .eq('is_active', true)
      .single();

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this URL slug already exists' },
        { status: 409 }
      );
    }

    // Get the next order index if not specified
    let finalNavigationOrder = navigationOrder;
    if (finalNavigationOrder === undefined) {
      const { data: maxOrderResult } = await supabaseAdmin
        .from('navigation_items')
        .select('order_index')
        .eq('parent_id', parentPageId || null)
        .eq('is_active', true)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      finalNavigationOrder = (maxOrderResult?.order_index || -1) + 1;
    }

    const now = new Date().toISOString();
    const pageId = crypto.randomUUID();

    // Create navigation item
    const { data: navigationItem, error: navError } = await supabaseAdmin
      .from('navigation_items')
      .insert({
        id: pageId,
        page_name: finalUrlSlug,
        display_name: title,
        url_slug: finalUrlSlug,
        parent_id: parentPageId || null,
        order_index: finalNavigationOrder,
        is_visible: isVisible,
        is_active: true,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (navError) {
      console.error('Error creating navigation item:', navError);
      return NextResponse.json(
        { error: 'Failed to create navigation item' },
        { status: 500 }
      );
    }

    // Create initial page content entry
    const { error: contentError } = await supabaseAdmin
      .from('page_content')
      .insert({
        page_name: finalUrlSlug,
        content_key: 'page_title',
        content_value: title,
        content_type: 'text',
        updated_by: userId,
        updated_at: now,
        lock_version: 1
      });

    if (contentError) {
      console.error('Error creating initial page content:', contentError);
      // Don't fail the request, just log the error
    }

    // Add meta description if provided
    if (metaDescription) {
      await supabaseAdmin
        .from('page_content')
        .insert({
          page_name: finalUrlSlug,
          content_key: 'meta_description',
          content_value: metaDescription,
          content_type: 'text',
          updated_by: userId,
          updated_at: now,
          lock_version: 1
        });
    }

    // Add meta keywords if provided
    if (metaKeywords) {
      await supabaseAdmin
        .from('page_content')
        .insert({
          page_name: finalUrlSlug,
          content_key: 'meta_keywords',
          content_value: metaKeywords,
          content_type: 'text',
          updated_by: userId,
          updated_at: now,
          lock_version: 1
        });
    }

    // Create template-based initial components if specified
    if (template && template !== 'blank') {
      await createTemplateComponents(finalUrlSlug, template, userId);
    }

    // Broadcast page creation event
    const pageCreateEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      type: 'page_create',
      pageName: finalUrlSlug,
      userId,
      timestamp: now,
      version: '1',
      data: {
        pageId,
        pageData: {
          title,
          urlSlug: finalUrlSlug,
          navigationOrder: finalNavigationOrder,
          isVisible,
          template
        },
        navigationItem: {
          id: pageId,
          pageId: finalUrlSlug,
          displayName: title,
          urlSlug: finalUrlSlug,
          parentId: parentPageId,
          orderIndex: finalNavigationOrder,
          isVisible,
          isActive: true
        }
      }
    };

    await supabaseAdmin
      .from('realtime_events')
      .insert({
        id: pageCreateEvent.id,
        event_type: pageCreateEvent.type,
        page_name: pageCreateEvent.pageName,
        user_id: pageCreateEvent.userId,
        event_data: pageCreateEvent.data,
        created_at: pageCreateEvent.timestamp
      });

    return NextResponse.json({
      success: true,
      data: {
        pageId,
        title,
        urlSlug: finalUrlSlug,
        navigationOrder: finalNavigationOrder,
        isVisible,
        template,
        navigationItem
      },
      message: 'Page created successfully'
    });

  } catch (error) {
    console.error('Page create POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to create template-based components
async function createTemplateComponents(pageName: string, template: string, userId: string) {
  const now = new Date().toISOString();
  
  const templates: Record<string, any[]> = {
    'landing': [
      {
        component_type: 'hero-section',
        position_section: 'header',
        position_order: 0,
        props: {
          title: 'Welcome to Our Site',
          subtitle: 'This is a hero section',
          backgroundImage: '',
          ctaText: 'Get Started',
          ctaLink: '#'
        }
      },
      {
        component_type: 'text-block',
        position_section: 'main',
        position_order: 0,
        props: {
          content: 'This is the main content area. You can edit this text.',
          alignment: 'left'
        }
      }
    ],
    'blog': [
      {
        component_type: 'text-block',
        position_section: 'main',
        position_order: 0,
        props: {
          content: '# Blog Post Title\n\nWrite your blog content here...',
          format: 'markdown'
        }
      }
    ],
    'contact': [
      {
        component_type: 'contact-form',
        position_section: 'main',
        position_order: 0,
        props: {
          title: 'Contact Us',
          fields: ['name', 'email', 'message'],
          submitText: 'Send Message'
        }
      }
    ]
  };

  const templateComponents = templates[template];
  if (!templateComponents) return;

  const componentInserts = templateComponents.map((comp, index) => ({
    page_name: pageName,
    component_type: comp.component_type,
    component_id: `${comp.component_type}-${Date.now()}-${index}`,
    position_section: comp.position_section,
    position_order: comp.position_order,
    props: comp.props,
    version: '1',
    created_by: userId,
    created_at: now,
    last_modified_by: userId,
    last_modified_at: now,
    is_active: true
  }));

  await supabaseAdmin
    .from('page_components')
    .insert(componentInserts);
}

// Export handler with centralized state management
export const POST = withCentralizedStateManagement(
  handlePageCreatePostRequest,
  '/api/pages/create',
  {
    priority: 'high',
    maxRetries: 1,
    requireAuth: true
  }
);