/**
 * Simplified Token Manager for Google Calendar Integration
 * Since Google OAuth is configured via Clerk dashboard, we use static tokens
 */

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: Date;
  scope?: string;
}

export class TokenManager {
  /**
   * Get access token for Google Calendar API
   * Uses static token from .env.local since OAuth is configured via Clerk
   */
  static async getValidAccessToken(_userId?: string): Promise<string | null> {
    try {
      // Use static token from .env.local
      const accessToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;

      if (!accessToken) {
        console.error('GOOGLE_OAUTH_ACCESS_TOKEN not found in environment variables');
        return null;
      }

      return accessToken;
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
