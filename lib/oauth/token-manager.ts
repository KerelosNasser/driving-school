export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: Date;
  scope?: string;
}

const getServiceAccountToken = async (): Promise<string | null> => {
  try {
    // Check if we have service account credentials in environment variables
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      console.warn('Google service account credentials not configured in environment variables');
      return null;
    }

    // Only import JWT when we actually need it and have credentials
    // Use dynamic import to prevent build-time errors
    const googleAuthLib = await import('google-auth-library').catch(() => null);
    if (!googleAuthLib) {
      console.warn('google-auth-library not available');
      return null;
    }

    const { JWT } = googleAuthLib;

    // Create JWT client with service account credentials
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
      ],
    });

    // Get access token
    const tokenResponse = await jwtClient.getAccessToken();
    return tokenResponse?.token || null;
  } catch (error) {
    console.error('Error getting service account token:', error);
    return null;
  }
};

export class TokenManager {
  private static cachedToken: { token: string; expiresAt: number } | null = null;

  /**
   * Get access token for Google Calendar API using service account
   */
  static async getValidAccessToken(_userId?: string): Promise<string | null> {
    try {
      // Check if we have a cached token that's still valid (with 5 minute buffer)
      if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
        return this.cachedToken.token;
      }

      // Get fresh token from service account
      const accessToken = await getServiceAccountToken();

      if (accessToken) {
        // Cache the token (Google service account tokens typically last 1 hour)
        this.cachedToken = {
          token: accessToken,
          expiresAt: Date.now() + 55 * 60 * 1000 // 55 minutes from now
        };
        return accessToken;
      }

      console.error('GOOGLE_OAUTH_ACCESS_TOKEN not found in environment variables');
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Check if we have a valid access token configured
   */
  static async hasValidTokens(_userId?: string): Promise<boolean> {
    const accessToken = await this.getValidAccessToken();
    return accessToken !== null && accessToken.length > 0;
  }

  /**
   * Simple disconnect - since we're using static tokens, this is a no-op
   * In a real Clerk OAuth setup, Clerk would handle token revocation
   */
  static async deleteTokens(_userId?: string, _provider: string = 'google'): Promise<boolean> {
    // Since we're using static tokens configured via Clerk dashboard,
    // there's nothing to delete here. Token management is handled by Clerk.
    return true;
  }

  /**
   * Store tokens (placeholder - not needed for static token setup)
   */
  static async storeTokens(
    _userId: string,
    _tokens: OAuthTokens,
    _provider: string = 'google'
  ): Promise<any> {
    // Not needed for static token setup
    return null;
  }

  /**
   * Get tokens (placeholder - not needed for static token setup)
   */
  static async getTokens(
    _userId: string,
    _provider: string = 'google'
  ): Promise<any> {
    // Not needed for static token setup
    return null;
  }
}
