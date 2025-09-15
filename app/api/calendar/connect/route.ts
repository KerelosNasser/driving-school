import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { withCentralizedStateManagement } from '@/lib/api-middleware';

async function handleCalendarConnectRequest(_request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/oauth/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    // Generate OAuth URL for Google Calendar access
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', userId); // Pass user ID for verification

    return NextResponse.json({
      authUrl: authUrl.toString(),
      message: 'Redirect to Google OAuth to authorize calendar access'
    });

  } catch (error) {
    console.error('Error creating calendar connection:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar connection' },
      { status: 500 }
    );
  }
}

export const POST = withCentralizedStateManagement(handleCalendarConnectRequest, '/api/calendar/connect', {
  priority: 'high',
  maxRetries: 1,
  requireAuth: true
});
