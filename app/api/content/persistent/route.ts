// Enhanced Persistent Content API with Real-time Updates and Conflict Resolution
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PersistentContentLoader } from '@/lib/contentLoader';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

const contentLoader = PersistentContentLoader.getInstance();

// Centralized state management replaces individual rate limiting

async function isUserAdmin(_userId: string): Promise<boolean> {
  // Simplified admin check - in production, check against proper user roles
  return process.env.NODE_ENV === 'development';
}

// GET - Load page content with caching
async function handlePersistentContentGetRequest(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageName = searchParams.get('page') || 'home';
    const contentKey = searchParams.get('key');

    // Load content using persistent loader
    const content = await contentLoader.loadPageContent(pageName);

    if (contentKey) {
      const item = content[contentKey];
      return NextResponse.json({ 
        data: item || null,
        meta: { pageName, contentKey }
      });
    }

    return NextResponse.json({ 
      data: Object.values(content),
      meta: { pageName, count: Object.keys(content).length }
    });
    
  } catch (error) {
    console.error('GET /api/content/persistent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT - Save content with conflict resolution
async function handlePersistentContentPutRequest(request: NextRequest) {
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
    const { key, value, type = 'text', page = 'home' } = body;

    if (!key) {
      return NextResponse.json({ error: 'Content key required' }, { status: 400 });
    }

    // Save using persistent loader
    const result = await contentLoader.saveContent(page, key, value, type, userId);

    if (result.conflict) {
      return NextResponse.json({
        success: false,
        conflict: true,
        message: 'Content was modified by another user'
      }, { status: 409 });
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Save operation failed'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      version: result.version,
      message: 'Content saved successfully'
    });

  } catch (error) {
    console.error('PUT /api/content/persistent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Export handlers with centralized state management
export const GET = withCentralizedStateManagement(handlePersistentContentGetRequest, '/api/content/persistent', {
  priority: 'medium',
  maxRetries: 2,
  requireAuth: true
});

export const PUT = withCentralizedStateManagement(handlePersistentContentPutRequest, '/api/content/persistent', {
  priority: 'high',
  maxRetries: 1,
  requireAuth: true
});
