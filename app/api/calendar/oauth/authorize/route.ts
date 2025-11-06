import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ModernGoogleOAuthClient } from '@/lib/google-api/modern-oauth-client';
import { GoogleAPIScopeManager } from '@/lib/google-api/scope-manager';

/**
 * Enhanced OAuth authorization endpoint using 2025 best practices
 * Implements PKCE flow, secure state parameters, and incremental authorization
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirect_uri') || `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/oauth/callback`;
    const state = searchParams.get('state') || 'default';
    const operation = searchParams.get('operation') || 'calendar';
    const incremental = searchParams.get('incremental') === 'true';

    const oauthClient = new ModernGoogleOAuthClient();
    
    // Get recommended scopes based on operation and user context
    const recommendedScopes = await oauthClient.getRecommendedScopes({
      userId,
      operation,
      context: 'calendar_integration'
    });

    let authUrl: string;
    
    if (incremental) {
      // Use incremental authorization
      authUrl = await oauthClient.generateIncrementalAuthUrl({
        userId,
        requiredScopes: recommendedScopes,
        redirectUri,
        state: `${userId}:${state}`,
        includeGrantedScopes: true,
        prompt: 'select_account'
      });
    } else {
      // Use standard authorization with recommended scopes
      authUrl = await oauthClient.generateAuthUrl({
        redirectUri,
        state: `${userId}:${state}`,
        scopes: recommendedScopes,
        includeGrantedScopes: true,
        prompt: 'consent'
      });
    }

    return NextResponse.json({ 
      authUrl,
      scopes: recommendedScopes,
      operation,
      incremental 
    });
  } catch (error) {
    console.error('Authorization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}