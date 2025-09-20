import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createNavigationManager, NavigationPermissions } from '@/lib/navigation/NavigationManager';
import { getEventRouter } from '@/lib/realtime';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

// Validation schema for updates
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

const toggleVisibilitySchema = z.object({
  isVisible: z.boolean()
});

// Helper function to get user permissions
function getUserPermissions(userId: string, userRole?: string): typeof NavigationPermissions.ADMIN {
  if (process.env.NODE_ENV === 'development') {
    return NavigationPermissions.ADMIN;
  }
  
  if (userRole === 'admin') {
    return NavigationPermissions.ADMIN;
  } else if (userRole === 'editor') {
    return NavigationPermissions.EDITOR;
  } else {
    return NavigationPermissions.VIEWER;
  }
}

// GET /api/navigation/[itemId] - Get a specific navigation item
export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  return withCentralizedStateManagement(async () => {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const { itemId } = params;

      const navigationManager = createNavigationManager({
        eventRouter: getEventRouter(),
        userId,
        permissions: getUserPermissions(userId)
      });

      // Try to get from cache first
      let item = navigationManager.getCachedItem(itemId);
      
      if (!item || navigationManager.isCacheStale()) {
        // Fetch all items to refresh cache
        const items = await navigationManager.getNavigationItems({ includeHidden: true });
        item = items.find(i => i.id === itemId);
      }

      if (!item) {
        return NextResponse.json(
          { error: 'Navigation item not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ item });
    } catch (error) {
      console.error('Error fetching navigation item:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch navigation item',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/navigation/[itemId] - Update a navigation item
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  return withCentralizedStateManagement(async () => {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const { itemId } = params;
      const body = await request.json();
      const validatedData = updateNavigationItemSchema.parse(body);

      const navigationManager = createNavigationManager({
        eventRouter: getEventRouter(),
        userId,
        permissions: getUserPermissions(userId)
      });

      const result = await navigationManager.updateNavigationItem(itemId, validatedData);

      if (!result.success) {
        return NextResponse.json(
          { 
            error: result.error,
            conflictId: result.conflictId
          },
          { status: result.error?.includes('permissions') ? 403 : 
                   result.error?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({
        item: result.data,
        message: 'Navigation item updated successfully'
      });
    } catch (error) {
      console.error('Error updating navigation item:', error);
      
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
          error: 'Failed to update navigation item',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/navigation/[itemId] - Delete a navigation item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  return withCentralizedStateManagement(async () => {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const { itemId } = params;

      const navigationManager = createNavigationManager({
        eventRouter: getEventRouter(),
        userId,
        permissions: getUserPermissions(userId)
      });

      const result = await navigationManager.deleteNavigationItem(itemId);

      if (!result.success) {
        return NextResponse.json(
          { 
            error: result.error,
            conflictId: result.conflictId
          },
          { status: result.error?.includes('permissions') ? 403 : 
                   result.error?.includes('not found') ? 404 : 400 }
        );
      }

      return NextResponse.json({
        message: 'Navigation item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting navigation item:', error);
      return NextResponse.json(
        { 
          error: 'Failed to delete navigation item',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}