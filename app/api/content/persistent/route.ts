// Enhanced Persistent Content API with Real-time Updates and Conflict Resolution
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PersistentContentLoader } from '@/lib/contentLoader';

const contentLoader = PersistentContentLoader.getInstance();

// Rate limiting for API calls
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now - userLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(userId, { count: 1, timestamp: now });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

async function isUserAdmin(userId: string): Promise<boolean> {
  // Simplified admin check - in production, check against proper user roles
  return process.env.NODE_ENV === 'development';
}

// GET - Load page content with caching
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(userId)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
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
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(userId)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
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
