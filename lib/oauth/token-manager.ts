export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_at?: Date;
  scope?: string;
  id_token?: string;
}

export interface TokenRefreshResult {
  access_token: string;
  expires_at: Date;
  refresh_token?: string;
  token_type: string;
  scope?: string;
}

export interface TokenManagerConfig {
  refreshBufferMinutes: number;
  maxRetries: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
}

export interface JWTConfig {
  clientEmail: string;
  privateKey: string;
  scopes?: string[];
  tokenLifetime?: number;
  additionalClaims?: Record<string, any>;
}

// Cache duration for JWT auth client (5 minutes)
const CACHE_DURATION_MS = 5 * 60 * 1000;

// Cache the initialized JWT auth client to avoid re-creating on every request
let cachedAuthClient: any | null = null;

const getServiceAccountToken = async (config?: JWTConfig): Promise<string | null> => {
  try {
    // Check if we have service account credentials in environment variables or config
    // Support both GOOGLE_SERVICE_ACCOUNT_* and legacy GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY names
    const clientEmail = config?.clientEmail ||
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = config?.privateKey ||
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      // Credentials not configured; return null silently for production safety
      return null;
    }

    // Only import JWT when we actually need it and have credentials
    // Use dynamic import to prevent build-time errors
    const googleAuthLib = await import('google-auth-library').catch(() => null);
    if (!googleAuthLib) {
      return null;
    }

    const { JWT } = googleAuthLib;

    // Create JWT client with service account credentials
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      scopes: config?.scopes || [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
      ],
    });

    // Get access token
    const tokenResponse = await jwtClient.getAccessToken();
    return tokenResponse?.token || null;
  } catch (error) {
    // Silent failure: return null so API routes can degrade gracefully
    return null;
  }
};

/**
 * Enhanced service account authentication client with 2025 JWT patterns
 * Supports custom configurations and implements proper error handling
 */
const getServiceAccountAuthClient = async (config?: JWTConfig): Promise<any | null> => {
  try {
    // Check cache first
    if (cachedAuthClient && cachedAuthClient.expiresAt > Date.now()) {
      console.log('Using cached JWT auth client');
      return cachedAuthClient.client;
    }

    const clientEmail = config?.clientEmail ||
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 
      process.env.GOOGLE_CLIENT_EMAIL;
    
    const privateKey = config?.privateKey ||
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || 
      process.env.GOOGLE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
      console.warn('Service account credentials not configured');
      return null;
    }

    // Dynamic import with error handling
    const googleAuthLib = await import('google-auth-library').catch(error => {
      console.error('Failed to import google-auth-library:', error);
      return null;
    });
    
    if (!googleAuthLib) {
      return null;
    }

    const { JWT } = googleAuthLib;
    
    // Enhanced JWT client with 2025 security patterns
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: config?.scopes || [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
      ],
      additionalClaims: {
        ...config?.additionalClaims,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (config?.tokenLifetime || 3600),
      },
    });

    // Validate credentials by testing token retrieval
    const tokenResponse = await jwtClient.getAccessToken();
    if (!tokenResponse?.token) {
      throw new Error('Failed to validate JWT credentials');
    }

    // Cache the validated client
    cachedAuthClient = {
      client: jwtClient,
      expiresAt: Date.now() + CACHE_DURATION_MS,
      token: tokenResponse.token,
    };

    console.log('Successfully initialized JWT auth client');
    return jwtClient;
    
  } catch (error) {
    console.error('JWT auth client initialization failed:', error);
    
    // Clear cache on error
    cachedAuthClient = null;
    
    return null;
  }
};

export class TokenManager {
  private static cachedToken: { token: string; expiresAt: number } | null = null;
  private static tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();
  private static refreshInProgress: Map<string, Promise<string>> = new Map();
  
  private static readonly config: TokenManagerConfig = {
    refreshBufferMinutes: 5, // Refresh tokens 5 minutes before expiry
    maxRetries: 3, // Maximum number of retry attempts
    retryDelayMs: 1000, // Initial retry delay (1 second)
    maxRetryDelayMs: 30000, // Maximum retry delay (30 seconds)
  };

  /**
   * Get authenticated client with automatic token refresh and retry logic
   */
  static async getAuthenticatedClient(userId?: string): Promise<any | null> {
    try {
      const accessToken = await this.getValidAccessToken(userId);
      if (!accessToken) {
        return null;
      }

      const authClient = await getServiceAccountAuthClient();
      return authClient;
    } catch (error) {
      console.error('Error getting authenticated client:', error);
      return null;
    }
  }

  /**
   * Health check for token manager
   */
  static async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'error'; details: any }> {
    try {
      const testToken = await this.getValidAccessToken('health_check');
      
      return {
        status: testToken ? 'healthy' : 'degraded',
        details: {
          cachedTokens: this.tokenCache.size,
          refreshInProgress: this.refreshInProgress.size,
          hasServiceAccount: !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL),
          testTokenObtained: !!testToken
        }
      };
    } catch (error) {
      return {
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          cachedTokens: this.tokenCache.size,
          refreshInProgress: this.refreshInProgress.size
        }
      };
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private static calculateDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    return Math.min(exponentialDelay, this.config.maxRetryDelayMs);
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Refresh token with retry logic and exponential backoff
   */
  private static async refreshTokenWithRetry(userId?: string): Promise<string | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Get fresh token from service account
        const accessToken = await getServiceAccountToken();
        
        if (accessToken) {
          return accessToken;
        }
        
        throw new Error('Failed to obtain access token from service account');
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt, this.config.retryDelayMs);
          console.warn(`Token refresh attempt ${attempt} failed, retrying in ${delay}ms:`, error);
          await this.sleep(delay);
        }
      }
    }
    
    console.error('All token refresh attempts failed:', lastError);
    return null;
  }

  /**
   * Get access token for Google Calendar API using service account with enhanced refresh logic
   */
  static async getValidAccessToken(userId?: string): Promise<string | null> {
    const cacheKey = userId || 'service_account';
    const now = Date.now();
    const refreshBufferMs = this.config.refreshBufferMinutes * 60 * 1000;
    
    try {
      // Check if we have a valid cached token
      const cached = this.tokenCache.get(cacheKey);
      if (cached && cached.expiresAt > now + refreshBufferMs) {
        console.log(`Using cached token for ${cacheKey}, expires at ${new Date(cached.expiresAt).toISOString()}`);
        return cached.token;
      }
      
      // Check if a refresh is already in progress for this user
      const existingRefresh = this.refreshInProgress.get(cacheKey);
      if (existingRefresh) {
        console.log(`Token refresh already in progress for ${cacheKey}, waiting...`);
        return await existingRefresh;
      }
      
      // Start a new refresh operation
      const refreshPromise = this.refreshTokenWithRetry(userId);
      this.refreshInProgress.set(cacheKey, refreshPromise);
      
      try {
        const accessToken = await refreshPromise;
        
        if (accessToken) {
          // Cache the token (Google service account tokens typically last 1 hour)
          const expiresAt = now + 55 * 60 * 1000; // 55 minutes from now
          this.tokenCache.set(cacheKey, {
            token: accessToken,
            expiresAt
          });
          
          console.log(`Successfully refreshed token for ${cacheKey}, expires at ${new Date(expiresAt).toISOString()}`);
          return accessToken;
        }
        
        // Remove invalid cache entry
        this.tokenCache.delete(cacheKey);
        return null;
      } finally {
        // Always clean up the refresh promise
        this.refreshInProgress.delete(cacheKey);
      }
    } catch (error) {
      console.error('Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Get an authenticated Google JWT client for Calendar API
   */
  static async getAuthClient(): Promise<any | null> {
    return getServiceAccountAuthClient();
  }

  /**
   * Get an authenticated Google JWT client with custom configuration
   */
  static async getAuthClientWithConfig(config: JWTConfig): Promise<any | null> {
    return getServiceAccountAuthClient(config);
  }

  /**
   * Get a service account access token with enhanced JWT patterns
   */
  static async getServiceAccountToken(config?: JWTConfig): Promise<string | null> {
    return getServiceAccountToken(config);
  }

  /**
   * Check if we have a valid access token configured
   */
  static async hasValidTokens(_userId?: string): Promise<boolean> {
    const authClient = await this.getAuthClient();
    return authClient !== null;
  }

  /**
   * Clear the JWT auth client cache (useful for testing or credential rotation)
   */
  static clearAuthCache(): void {
    cachedAuthClient = null;
    console.log('JWT auth client cache cleared');
  }

  /**
   * Get JWT configuration for specific use cases
   */
  static getJWTConfigForUseCase(useCase: 'calendar' | 'admin' | 'drive' | 'custom', customScopes?: string[]): JWTConfig {
    const baseConfig = {
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || '',
      privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '',
      tokenLifetime: 3600, // 1 hour default
    };

    switch (useCase) {
      case 'calendar':
        return {
          ...baseConfig,
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar.readonly'
          ],
        };
      
      case 'admin':
        return {
          ...baseConfig,
          scopes: [
            'https://www.googleapis.com/auth/admin.directory.user.readonly',
            'https://www.googleapis.com/auth/admin.directory.group.readonly'
          ],
        };
      
      case 'drive':
        return {
          ...baseConfig,
          scopes: [
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/drive.file'
          ],
        };
      
      case 'custom':
        return {
          ...baseConfig,
          scopes: customScopes || [],
        };
      
      default:
        return {
          ...baseConfig,
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events'
          ],
        };
    }
  }

  /**
   * Refresh OAuth tokens using refresh token with retry logic
   */
  static async refreshOAuthTokens(refreshToken: string, userId: string): Promise<TokenRefreshResult | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
        }

        const tokenData = await response.json();
        
        return {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || refreshToken,
          token_type: tokenData.token_type || 'Bearer',
          expires_at: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
          scope: tokenData.scope,
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt, this.config.retryDelayMs);
          console.warn(`OAuth token refresh attempt ${attempt} failed, retrying in ${delay}ms:`, error);
          await this.sleep(delay);
        }
      }
    }
    
    console.error('All OAuth token refresh attempts failed:', lastError);
    return null;
  }

  /**
   * Validate and refresh tokens if needed
   */
  static async validateAndRefreshTokens(tokens: OAuthTokens, userId: string): Promise<OAuthTokens | null> {
    try {
      const refreshBufferMs = this.config.refreshBufferMinutes * 60 * 1000;
      
      // Check if access token is still valid
      if (tokens.expires_at && new Date(tokens.expires_at) > new Date(Date.now() + refreshBufferMs)) {
        return tokens;
      }

      // Try to refresh using refresh token
      if (tokens.refresh_token) {
        const refreshedTokens = await this.refreshOAuthTokens(tokens.refresh_token, userId);
        if (refreshedTokens) {
          return {
            ...tokens,
            ...refreshedTokens,
          };
        }
      }

      // If refresh fails, return null
      return null;
    } catch (error) {
      console.error('Error validating and refreshing tokens:', error);
      return null;
    }
  }

  /**
   * Store tokens with proper validation and refresh capability
   */
  static async storeTokens(
    userId: string,
    tokens: OAuthTokens,
    provider: string = 'google'
  ): Promise<boolean> {
    try {
      // Validate tokens before storing
      if (!tokens.access_token) {
        throw new Error('Access token is required');
      }

      // Ensure expires_at is set
      if (!tokens.expires_at) {
        tokens.expires_at = new Date(Date.now() + 3600 * 1000); // Default 1 hour
      }

      // Store tokens in cache
      const cacheKey = `${provider}:${userId}`;
      this.tokenCache.set(cacheKey, {
        token: tokens.access_token,
        expiresAt: new Date(tokens.expires_at).getTime()
      });

      console.log(`Stored tokens for ${cacheKey}, expires at ${tokens.expires_at.toISOString()}`);
      return true;
    } catch (error) {
      console.error('Error storing tokens:', error);
      return false;
    }
  }

  /**
   * Get tokens with automatic refresh if needed
   */
  static async getTokens(
    userId: string,
    provider: string = 'google'
  ): Promise<OAuthTokens | null> {
    try {
      const cacheKey = `${provider}:${userId}`;
      
      // For now, return a basic structure
      // In a real implementation, this would fetch from database
      const cached = this.tokenCache.get(cacheKey);
      if (cached) {
        return {
          access_token: cached.token,
          expires_at: new Date(cached.expiresAt),
          token_type: 'Bearer'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  }

  /**
   * Delete tokens with proper cleanup
   */
  static async deleteTokens(userId?: string, provider: string = 'google'): Promise<boolean> {
    try {
      if (userId) {
        const cacheKey = `${provider}:${userId}`;
        this.tokenCache.delete(cacheKey);
        this.refreshInProgress.delete(cacheKey);
      } else {
        // Clear all cached tokens
        this.tokenCache.clear();
        this.refreshInProgress.clear();
      }
      
      console.log(`Deleted tokens for ${userId || 'all users'} (${provider})`);
      return true;
    } catch (error) {
      console.error('Error deleting tokens:', error);
      return false;
    }
  }
}
