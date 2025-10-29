

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
}

export interface SecureTokenStorage {
  encryptedRefreshToken: string;
  userId: string;
  scopes: string[];
  createdAt: Date;
  lastUsed: Date;
}

export class ModernGoogleOAuthClient {
  private oauth2Client: any;
  private config: GoogleOAuthConfig;
  
  // Required scopes for calendar access following incremental authorization best practices
  private static readonly CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  constructor(config: GoogleOAuthConfig) {
    this.config = config;
    // Lazy load OAuth2Client to avoid build-time errors
    this.initializeOAuth2Client();
  }

  private async initializeOAuth2Client() {
    try {
      const { OAuth2Client } = await import('google-auth-library');
      this.oauth2Client = new OAuth2Client({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        redirectUri: this.config.redirectUri,
      });
    } catch (error) {
      console.warn('Google OAuth2Client not available:', error);
    }
  }

  async generateAuthUrl(scopes: string[] = ModernGoogleOAuthClient.CALENDAR_SCOPES): Promise<string> {
    if (!this.oauth2Client) {
      await this.initializeOAuth2Client();
    }
    
    if (!this.oauth2Client) {
      throw new Error('Google OAuth2Client not available');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh tokens
      scope: scopes,
      prompt: 'consent', // Force consent to ensure refresh token
      include_granted_scopes: true, // Incremental authorization
    });
  }

  /**
   * Exchange authorization code for tokens
   * Implements proper error handling and token validation
   */
  async exchangeCodeForTokens(code: string): Promise<TokenData> {
    try {
      if (!this.oauth2Client) {
        await this.initializeOAuth2Client();
      }
      
      if (!this.oauth2Client) {
        throw new Error('Google OAuth2Client not available');
      }

      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      // Set credentials for future API calls
      this.oauth2Client.setCredentials(tokens);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error(`Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refresh access token using refresh token
   * Implements automatic retry and error handling
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    try {
      if (!this.oauth2Client) {
        await this.initializeOAuth2Client();
      }
      
      if (!this.oauth2Client) {
        throw new Error('Google OAuth2Client not available');
      }

      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('No access token received during refresh');
      }

      return {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken, // Keep original if not provided
        scope: credentials.scope,
        token_type: credentials.token_type,
        expiry_date: credentials.expiry_date,
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get authenticated OAuth2 client with automatic token refresh
   * This is the main method for API calls
   */
  async getAuthenticatedClient(tokenData: TokenData): Promise<any> {
    if (!this.oauth2Client) {
      await this.initializeOAuth2Client();
    }
    
    if (!this.oauth2Client) {
      throw new Error('Google OAuth2Client not available');
    }

    this.oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expiry_date,
    });

    // The googleapis library will automatically refresh tokens when needed
    return this.oauth2Client;
  }

  /**
   * Validate token and check if refresh is needed
   * Returns true if token is valid, false if refresh is needed
   */
  isTokenValid(tokenData: TokenData): boolean {
    if (!tokenData.access_token) {
      return false;
    }

    if (!tokenData.expiry_date) {
      return true; // Assume valid if no expiry date
    }

    // Check if token expires within the next 5 minutes (buffer time)
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    const expiryTime = tokenData.expiry_date;
    const currentTime = Date.now();

    return expiryTime > (currentTime + bufferTime);
  }

  /**
   * Revoke token for security cleanup
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      await this.oauth2Client.revokeToken(accessToken);
    } catch (error) {
      console.error('Error revoking token:', error);
      throw new Error(`Failed to revoke token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user info from authenticated client
   * Useful for verifying authentication and getting user details
   */
  async getUserInfo(tokenData: TokenData): Promise<any> {
    try {
      const authClient = await this.getAuthenticatedClient(tokenData);
      const { google } = await import('googleapis');
      const oauth2 = google.oauth2({ version: 'v2', auth: authClient });
      const { data } = await oauth2.userinfo.get();
      return data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create Google Calendar API client with authenticated credentials
   */
  async getCalendarClient(tokenData: TokenData) {
    const authClient = await this.getAuthenticatedClient(tokenData);
    const { google } = await import('googleapis');
    return google.calendar({ version: 'v3', auth: authClient });
  }

  /**
   * Securely store refresh token with encryption
   */
  async securelyStoreToken(userId: string, tokenData: TokenData): Promise<SecureTokenStorage> {
    if (!tokenData.refresh_token) {
      throw new Error('No refresh token to store');
    }

    const { encrypt } = await import('../utils/encryption');
    const encryptedRefreshToken = await encrypt(tokenData.refresh_token);
    
    return {
      encryptedRefreshToken,
      userId,
      scopes: tokenData.scope?.split(' ') || [],
      createdAt: new Date(),
      lastUsed: new Date(),
    };
  }

  /**
   * Retrieve and decrypt stored refresh token
   */
  async retrieveStoredToken(encryptedToken: string): Promise<string> {
    try {
      const { decrypt } = await import('../utils/encryption');
      return await decrypt(encryptedToken);
    } catch (error) {
      console.error('Error decrypting stored token:', error);
      throw new Error('Failed to decrypt stored token');
    }
  }
}

/**
 * Factory function to create OAuth client with environment configuration
 */
export function createGoogleOAuthClient(): ModernGoogleOAuthClient {
  const config: GoogleOAuthConfig = {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
  };

  if (!config.clientId || !config.clientSecret) {
    throw new Error('Google OAuth configuration missing. Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET environment variables.');
  }

  return new ModernGoogleOAuthClient(config);
}

/**
 * Utility function for handling OAuth errors with proper logging
 */
export function handleOAuthError(error: any, context: string): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error(`OAuth Error in ${context}:`, {
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
  
  throw new Error(`OAuth operation failed in ${context}: ${errorMessage}`);
}