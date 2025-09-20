import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createNavigationManager, NavigationPermissions } from '@/lib/navigation/NavigationManager';
import { getEventRouter } from '@/lib/realtime';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

// Validation schemas
const createNavigationItemSchema = z.object({
  pageId: z.string().min(1, 'Page ID is required'),
  displayName: z.string().min(1, 'Display name is required'),
  urlSlug: z.string()
    .min(1, 'URL slug is required')
    .regex(/^[a-z0-9-]+$/, 'URL slug must contain only lowercase letters, numbers, and hyphens')
    .refine(slug => !slug.startsWith('-') && !slug.endsWith('-'), 'URL slug cannot start or end with a hyphen'),
  parentId: z.string().optional(),
  orderIndex: z.number().int().min(0, 'Order index must be non-negative'),
  isVisible: z.boolean().default(true),
  isActive: z.boolean().default(true)
});

const updateNavigationItemSchema = z.object({
  pageId: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  urlSlug: z.string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'URL slug must contain only lowercase letters, numbers, and hyphens')
    .refine(slug => !slug.startsWith('-') && !slug.endsWith('-'), 'URL slug cannot start or end with a hyphen')
    .optional(),
  parentId: z.string().nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
  isActive: z.boolean().optional()
});

const reorderNavigationSchema = z.object({
  operations: z.array(z.object({
    itemId: z.string().min(1, 'Item ID is required'),
    newOrderIndex: z.number().int().min(0, 'Order index must be non-negative'),
    newParentId: z.string().nullable().optional()
  })).min(1, 'At least one reorder operation is required')
});

// Helper function to get user permissions
function getUserPermissions(userId: string, userRole?: string): typeof NavigationPermissions.ADMIN {
  // In a real application, you would check the user's role from your database
  // For now, we'll use a simple check based on environment or user metadata
  
  if (process.env.NODE_ENV === 'development') {
    return NavigationPermissions.ADMIN;
  }
  
  // Check if user is admin (you can customize this logic)
  if (userRole === 'admin') {
    return NavigationPermissions.ADMIN;
  } else if (userRole === 'editor') {
    return NavigationPermissions.EDITOR;
  } else {
    return NavigationPermissions.VIEWER;
  }
}

// GET /api/navigation - Get all navigation items
export async function GET(request: NextRequest) {
  return withCentralizedStateManagement(async () => {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const { searchParams } = new URL(request.url);
      const includeHidden = searchParams.get('includeHidden') === 'true';
      const parentId = searchParams.get('parentId');
      const orderBy = searchParams.get('orderBy') as 'orderIndex' | 'displayName' | undefined;
      const format = searchParams.get('format'); // 'tree' or 'flat'

      const navigationManager = createNavigationManager({
        eventRouter: getEventRouter(),
        userId,
        permissions: getUserPermissions(userId)
      });

      let items;
      if (format === 'tree') {
        items = await navigationManager.getNavigationTree(includeHidden);
      } else {
        items = await navigationManager.getNavigationItems({
          includeHidden,
          parentId: parentId === 'null' ? null : parentId || undefined,
          orderBy
        });
      }

      return NextResponse.json({
        items,
        total: items.length,
        format: format || 'flat'
      });
    } catch (error) {
      console.error('Error fetching navigation items:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch navigation items',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/navigation - Create a new navigation item
export async function POST(request: NextRequest) {
  return withCentralizedStateManagement(async () => {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const body = await request.json();
      const validatedData = createNavigationItemSchema.parse(body);

      const navigationManager = createNavigationManager({
        eventRouter: getEventRouter(),
        userId,
        permissions: getUserPermissions(userId)
      });

      const result = await navigationManager.createNavigationItem({
        pageId: validatedData.pageId,
        displayName: validatedData.displayName,
        urlSlug: validatedData.urlSlug,
        parentId: validatedData.parentId,
        orderIndex: validatedData.orderIndex,
        isVisible: validatedData.isVisible,
        isActive: validatedData.isActive
      });

      if (!result.success) {
        return NextResponse.json(
          { 
            error: result.error,
            conflictId: result.conflictId
          },
          { status: result.error?.includes('permissions') ? 403 : 400 }
        );
      }

      return NextResponse.json({
        item: result.data,
        message: 'Navigation item created successfully'
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating navigation item:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: error.errors
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to create navigation item',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/navigation/reorder - Reorder navigation items
export async function PUT(request: NextRequest) {
  return withCentralizedStateManagement(async () => {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const body = await request.json();
      const validatedData = reorderNavigationSchema.parse(body);

      const navigationManager = createNavigationManager({
        eventRouter: getEventRouter(),
        userId,
        permissions: getUserPermissions(userId)
      });

      const result = await navigationManager.reorderNavigationItems(validatedData.operations);

      if (!result.success) {
        return NextResponse.json(
          { 
            error: result.error,
            conflictId: result.conflictId
          },
          { status: result.error?.includes('permissions') ? 403 : 400 }
        );
      }

      return NextResponse.json({
        items: result.data,
        message: 'Navigation items reordered successfully'
      });
    } catch (error) {
      console.error('Error reordering navigation items:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: error.errors
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Failed to reorder navigation items',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}