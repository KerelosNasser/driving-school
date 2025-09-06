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
    
    // In a real implementation, you would store these tokens in your database
    // associated with the user ID (state parameter)
    // For now, we'll just log them and redirect with success
    console.log('OAuth tokens received for user:', state);
    console.log('Access token:', tokenData.access_token);
    console.log('Refresh token:', tokenData.refresh_token);
    
    // Store tokens securely in database here
    // await storeUserTokens(state, tokenData);

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
