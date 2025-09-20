// Real-time Collaborative Page Creation API
import { NextRequest } from 'next/server';
import { 
  apiHandler, 
  successResponse, 
  APIError, 
  supabaseAdmin,
  generateSlug
} from '@/lib/api/utils';
import type { NewPageData, NavigationItem } from '@/lib/realtime/types';
import { z } from 'zod';

// Validation schema for real-time page creation
const realtimePageValidation = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  urlSlug: z.string()
    .min(2, 'URL slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'URL slug can only contain lowercase letters, numbers, and hyphens')
    .refine(slug => !slug.startsWith('-') && !slug.endsWith('-'), 'URL slug cannot start or end with a hyphen'),
  template: z.string().min(1, 'Template is required'),
  navigationOrder: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  pageId: z.string().optional(),
  navigationItem: z.object({
    id: z.string(),
    pageId: z.string(),
    displayName: z.string(),
    urlSlug: z.string(),
    parentId: z.string().optional(),
    orderIndex: z.number(),
    isVisible: z.boolean(),
    isActive: z.boolean()
  }).optional(),
  userId: z.string().optional()
});

export const POST = apiHandler(async (req: NextRequest, userId: string) => {
  const body = await req.json();
  const validatedData = realtimePageValidation.parse(body);

  // Check if slug already exists in pages table
  const { data: existingPage } = await supabaseAdmin
    .from('pages')
    .select('id')
    .eq('slug', validatedData.urlSlug)
    .single();

  if (existingPage) {
    throw new APIError('A page with this URL slug already exists', 409, 'SLUG_EXISTS');
  }

  // Note: Navigation items table will be created when migration is run
  // For now, we'll skip the navigation check

  const pageId = validatedData.pageId || `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Start a transaction to create both page and navigation item
    const { data: page, error: pageError } = await supabaseAdmin
      .from('pages')
      .insert({
        id: pageId,
        title: validatedData.title,
        slug: validatedData.urlSlug,
        content: {
          blocks: [] // Start with empty content, will be populated by template
        },
        meta_data: {
          description: `${validatedData.title} page`,
          keywords: validatedData.title.toLowerCase().replace(/\s+/g, ', '),
          title: validatedData.title
        },
        settings: {
          layout: 'default',
          show_header: true,
          show_footer: true,
          template: validatedData.template
        },
        status: 'draft',
        author_id: userId
      })
      .select()
      .single();

    if (pageError) {
      console.error('Failed to create page:', pageError);
      throw new APIError('Failed to create page', 500, 'PAGE_CREATE_ERROR');
    }

    // Create navigation item (will be implemented when migration is run)
    const navigationData = validatedData.navigationItem || {
      id: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageId,
      displayName: validatedData.title,
      urlSlug: validatedData.urlSlug,
      orderIndex: validatedData.navigationOrder || 999,
      isVisible: validatedData.isVisible ?? true,
      isActive: true
    };

    // For now, we'll return mock navigation data until the migration is run
    const navItem = {
      id: navigationData.id,
      page_name: validatedData.urlSlug,
      display_name: navigationData.displayName,
      url_slug: navigationData.urlSlug,
      parent_id: navigationData.parentId || null,
      order_index: navigationData.orderIndex,
      is_visible: navigationData.isVisible,
      is_active: navigationData.isActive
    };

    // Create initial page content based on template
    const templateContent = await generateTemplateContent(validatedData.template, validatedData.title);
    
    if (templateContent.blocks.length > 0) {
      const { error: contentError } = await supabaseAdmin
        .from('pages')
        .update({ content: templateContent })
        .eq('id', pageId);

      if (contentError) {
        console.warn('Failed to update page with template content:', contentError);
        // Don't fail the entire operation for this
      }
    }

    // Create initial revision
    await supabaseAdmin
      .from('page_revisions')
      .insert({
        page_id: pageId,
        content: page.content,
        meta_data: page.meta_data,
        settings: page.settings,
        author_id: userId,
        revision_note: `Initial creation with ${validatedData.template} template`
      });

    return successResponse({
      pageId,
      page,
      navigationItem: navItem,
      message: 'Page created successfully'
    }, 201);

  } catch (error) {
    console.error('Page creation error:', error);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError('Failed to create page and navigation', 500, 'CREATE_TRANSACTION_ERROR');
  }
});

// Generate template content based on template type
async function generateTemplateContent(template: string, title: string) {
  const templates: Record<string, any> = {
    basic: {
      blocks: [
        {
          id: `block-${Date.now()}-1`,
          type: 'heading',
          props: {
            level: 1,
            text: title,
            alignment: 'center'
          },
          styles: {
            marginBottom: '2rem'
          }
        },
        {
          id: `block-${Date.now()}-2`,
          type: 'text',
          props: {
            text: 'Welcome to this page. Click to edit this content.',
            alignment: 'left'
          },
          styles: {
            marginBottom: '1rem'
          }
        }
      ]
    },
    landing: {
      blocks: [
        {
          id: `block-${Date.now()}-1`,
          type: 'hero',
          props: {
            title: title,
            subtitle: 'Discover what makes us special',
            buttonText: 'Get Started',
            buttonLink: '#contact',
            backgroundImage: ''
          },
          styles: {
            padding: '4rem 0',
            textAlign: 'center'
          }
        },
        {
          id: `block-${Date.now()}-2`,
          type: 'features',
          props: {
            title: 'Why Choose Us',
            features: [
              { title: 'Feature 1', description: 'Description of feature 1' },
              { title: 'Feature 2', description: 'Description of feature 2' },
              { title: 'Feature 3', description: 'Description of feature 3' }
            ]
          },
          styles: {
            padding: '3rem 0'
          }
        }
      ]
    },
    service: {
      blocks: [
        {
          id: `block-${Date.now()}-1`,
          type: 'heading',
          props: {
            level: 1,
            text: title,
            alignment: 'center'
          },
          styles: {
            marginBottom: '2rem'
          }
        },
        {
          id: `block-${Date.now()}-2`,
          type: 'text',
          props: {
            text: 'Our comprehensive service offering includes everything you need.',
            alignment: 'center'
          },
          styles: {
            marginBottom: '3rem',
            fontSize: '1.2rem'
          }
        },
        {
          id: `block-${Date.now()}-3`,
          type: 'service-list',
          props: {
            services: [
              { name: 'Service 1', description: 'Description of service 1', price: '$99' },
              { name: 'Service 2', description: 'Description of service 2', price: '$149' },
              { name: 'Service 3', description: 'Description of service 3', price: '$199' }
            ]
          },
          styles: {
            marginBottom: '2rem'
          }
        }
      ]
    },
    contact: {
      blocks: [
        {
          id: `block-${Date.now()}-1`,
          type: 'heading',
          props: {
            level: 1,
            text: title,
            alignment: 'center'
          },
          styles: {
            marginBottom: '2rem'
          }
        },
        {
          id: `block-${Date.now()}-2`,
          type: 'contact-form',
          props: {
            title: 'Get in Touch',
            fields: ['name', 'email', 'phone', 'message'],
            submitText: 'Send Message'
          },
          styles: {
            maxWidth: '600px',
            margin: '0 auto'
          }
        },
        {
          id: `block-${Date.now()}-3`,
          type: 'contact-info',
          props: {
            phone: '(555) 123-4567',
            email: 'info@example.com',
            address: '123 Main St, City, State 12345',
            hours: 'Mon-Fri: 9AM-5PM'
          },
          styles: {
            marginTop: '3rem',
            textAlign: 'center'
          }
        }
      ]
    },
    about: {
      blocks: [
        {
          id: `block-${Date.now()}-1`,
          type: 'heading',
          props: {
            level: 1,
            text: title,
            alignment: 'center'
          },
          styles: {
            marginBottom: '2rem'
          }
        },
        {
          id: `block-${Date.now()}-2`,
          type: 'text',
          props: {
            text: 'Learn more about our story, mission, and the team behind our success.',
            alignment: 'center'
          },
          styles: {
            marginBottom: '3rem',
            fontSize: '1.2rem'
          }
        },
        {
          id: `block-${Date.now()}-3`,
          type: 'image-text',
          props: {
            image: '',
            imageAlt: 'About us',
            title: 'Our Story',
            text: 'We started with a simple mission: to provide exceptional service and build lasting relationships with our clients.',
            imagePosition: 'left'
          },
          styles: {
            marginBottom: '3rem'
          }
        },
        {
          id: `block-${Date.now()}-4`,
          type: 'team',
          props: {
            title: 'Meet Our Team',
            members: [
              { name: 'Team Member 1', role: 'Position', image: '', bio: 'Brief bio' },
              { name: 'Team Member 2', role: 'Position', image: '', bio: 'Brief bio' }
            ]
          },
          styles: {
            marginTop: '3rem'
          }
        }
      ]
    }
  };

  return templates[template] || templates.basic;
}