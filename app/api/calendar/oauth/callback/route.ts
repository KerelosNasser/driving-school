import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This should be the user ID
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=missing_code_or_state`
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/oauth/callback`,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    
    // Calculate expiry time
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000)
      : undefined;

    // Store tokens securely in database using TokenManager
    const { TokenManager } = await import('@/lib/oauth/token-manager');
    
    const storedTokens = await TokenManager.storeTokens(state, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: expiresAt,
      scope: tokenData.scope,
    });

    if (!storedTokens) {
      console.error('Failed to store OAuth tokens for user:', state);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=token_storage_failed`
      );
    }

    console.log('OAuth tokens successfully stored for user:', state);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_connected=true`
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=callback_failed`
    );
  }
}
