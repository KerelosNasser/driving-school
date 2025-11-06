import { NextRequest, NextResponse } from 'next/server';
import { ModernGoogleOAuthClient } from '@/lib/google-api/modern-oauth-client';
import { GoogleAPIScopeManager } from '@/lib/google-api/scope-manager';

/**
 * Enhanced OAuth callback handler with PKCE validation and secure token management
 * Implements 2025 Google API security best practices
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Secure state parameter
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('OAuth authorization error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=missing_code_or_state`
      );
    }

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/oauth/callback`;

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=oauth_not_configured`
      );
    }

    // Initialize modern OAuth client with enhanced security
    const oauthClient = new ModernGoogleOAuthClient({
      clientId,
      clientSecret,
      redirectUri,
    });

    try {
      // Exchange authorization code for tokens with PKCE validation
      const tokenData = await oauthClient.getTokenFromCode(code, state);
      
      // Validate state parameter and extract user ID
      const userId = oauthClient.validateSecureState(state);
      if (!userId) {
        throw new Error('Invalid or expired state parameter');
      }

      console.log('Successfully exchanged authorization code for user:', userId);

      // Analyze granted scopes and validate against requirements
      const scopeAnalysis = await GoogleAPIScopeManager.analyzeScopes(tokenData.scope || '');
      console.log('Scope analysis for user:', userId, scopeAnalysis);

      // Calculate expiry time with buffer for network latency
      const expiresAt = tokenData.expiry_date 
        ? new Date(tokenData.expiry_date)
        : tokenData.expires_in 
          ? new Date(Date.now() + (tokenData.expires_in - 60) * 1000) // 60s buffer
          : undefined;

      // Store tokens securely in database using TokenManager
      const { TokenManager } = await import('@/lib/oauth/token-manager');
      
      const storedTokens = await TokenManager.storeTokens(userId, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: expiresAt,
        scope: tokenData.scope,
        id_token: tokenData.id_token, // Store ID token for OpenID Connect
      });

      // Store scope information for future reference
      if (tokenData.scope) {
        await GoogleAPIScopeManager.storeGrantedScopes(userId, tokenData.scope);
      }

      if (!storedTokens) {
        console.error('Failed to store OAuth tokens for user:', userId);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=token_storage_failed`
        );
      }

      console.log('OAuth tokens successfully stored with enhanced security for user:', userId);

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_connected=true&pkce_enabled=true&scopes_granted=${encodeURIComponent(tokenData.scope || '')}`
      );

    } catch (tokenError) {
      console.error('Token exchange failed:', tokenError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=token_exchange_failed&details=${encodeURIComponent(tokenError instanceof Error ? tokenError.message : 'Unknown error')}`
      );
    }

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/service-center?calendar_error=callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
}
