import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createNavigationManager, NavigationPermissions } from '@/lib/navigation/NavigationManager';
import { getEventRouter } from '@/lib/realtime';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

// Validation schema for visibility toggle
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

// PUT /api/navigation/[itemId]/visibility - Toggle navigation item visibility
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
      const { isVisible } = toggleVisibilitySchema.parse(body);

      const navigationManager = createNavigationManager({
        eventRouter: getEventRouter(),
        userId,
        permissions: getUserPermissions(userId)
      });

      const result = await navigationManager.toggleVisibility(itemId, isVisible);

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
        message: `Navigation item ${isVisible ? 'shown' : 'hidden'} successfully`
      });
    } catch (error) {
      console.error('Error toggling navigation visibility:', error);
      
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
          error: 'Failed to toggle navigation visibility',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}