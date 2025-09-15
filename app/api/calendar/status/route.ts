import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

async function handleCalendarStatusRequest(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has OAuth access token stored
    // In a real implementation, you'd check the database for user's stored OAuth tokens
    const hasAccessToken = !!process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
    
    return NextResponse.json({
      connected: hasAccessToken,
      userId: userId
    });

  } catch (error) {
    console.error('Error checking calendar connection status:', error);
    return NextResponse.json(
      { error: 'Failed to check calendar connection status' },
      { status: 500 }
    );
  }
}

export const GET = withCentralizedStateManagement(handleCalendarStatusRequest, '/api/calendar/status', {
  priority: 'medium',
  maxRetries: 2,
  requireAuth: true
});
