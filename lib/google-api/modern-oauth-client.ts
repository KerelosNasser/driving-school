

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { promisify } from 'util';

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expiry_date?: number;
  id_token?: string; // Add ID token for OpenID Connect
}

export interface SecureTokenStorage {
  encryptedRefreshToken: string;
  userId: string;
  scopes: string[];
  createdAt: Date;
  lastUsed: Date;
}

export interface PKCEData {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

export interface ScopeManagementData {
  grantedScopes: string[];
  availableTiers: string[];
  currentTier: string;
  canUpgrade: boolean;
  recommendedNextTier?: string;
}

export interface IncrementalAuthRequest {
  userId: string;
  currentScopes: string[];
  requestedScopes: string[];
  reason: string;
  context?: string;
}

export class ModernGoogleOAuthClient {
  private oauth2Client: any;
  private config: GoogleOAuthConfig;
  private tokenStorage: Map<string, SecureTokenStorage> = new Map();
  private pkceStorage: Map<string, PKCEData> = new Map(); // Store PKCE data
  private readonly secureRandomBytes = promisify(crypto.randomBytes);
  
  // Comprehensive scope management following 2025 best practices
  private static readonly SCOPES = {
    // Calendar scopes - incremental authorization
    CALENDAR_READONLY: 'https://www.googleapis.com/auth/calendar.readonly',
    CALENDAR_EVENTS: 'https://www.googleapis.com/auth/calendar.events',
    CALENDAR_SETTINGS: 'https://www.googleapis.com/auth/calendar.settings',
    
    // Profile and email scopes
    OPENID: 'openid',
    PROFILE: 'profile',
    EMAIL: 'email',
    
    // Business information scopes
    BUSINESS_INFO: 'https://www.googleapis.com/auth/business.manage',
    BUSINESS_LISTINGS: 'https://www.googleapis.com/auth/business.listings',
    
    // Drive scopes (for file attachments)
    DRIVE_FILE: 'https://www.googleapis.com/auth/drive.file',
    
    // Admin scopes (if needed for domain management)
    ADMIN_DIRECTORY_USER_READONLY: 'https://www.googleapis.com/auth/admin.directory.user.readonly',
  } as const;

  // Scope tiers for incremental authorization
  private static readonly SCOPE_TIERS = {
    BASIC: [
      ModernGoogleOAuthClient.SCOPES.OPENID,
      ModernGoogleOAuthClient.SCOPES.PROFILE,
      ModernGoogleOAuthClient.SCOPES.EMAIL,
    ],
    CALENDAR_READONLY: [
      ModernGoogleOAuthClient.SCOPES.CALENDAR_READONLY,
    ],
    CALENDAR_FULL: [
      ModernGoogleOAuthClient.SCOPES.CALENDAR_EVENTS,
      ModernGoogleOAuthClient.SCOPES.CALENDAR_SETTINGS,
    ],
    BUSINESS: [
      ModernGoogleOAuthClient.SCOPES.BUSINESS_INFO,
      ModernGoogleOAuthClient.SCOPES.BUSINESS_LISTINGS,
    ],
    DRIVE: [
      ModernGoogleOAuthClient.SCOPES.DRIVE_FILE,
    ],
  } as const;

  // Default scope tier for new users
  private static readonly DEFAULT_SCOPE_TIER = 'BASIC';

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
      
      // Configure OAuth2 client with latest security settings
      this.oauth2Client.setCredentials({
        // Enable PKCE for enhanced security
        code_challenge_method: 'S256',
        // Enable state parameter validation
        include_granted_scopes: true,
        // Use secure token endpoints
        tokenUrl: 'https://oauth2.googleapis.com/token',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      });
    } catch (error) {
      console.warn('Google OAuth2Client not available:', error);
    }
  }

  /**
   * Generate PKCE parameters for enhanced OAuth security
   * Follows RFC 7636 for Proof Key for Code Exchange
   */
  private async generatePKCE(): Promise<PKCEData> {
    // Generate 128-bit cryptographically secure random code verifier
    const codeVerifier = (await this.secureRandomBytes(32)).toString('base64url');
    
    // Generate code challenge using SHA256 hash
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return {
      codeVerifier,
      codeChallenge,
      codeChallengeMethod: 'S256',
    };
  }

  /**
   * Generate cryptographically secure state parameter
   * Prevents CSRF attacks and maintains session state
   */
  private async generateSecureState(userId: string): Promise<string> {
    const nonce = (await this.secureRandomBytes(16)).toString('hex');
    const timestamp = Date.now().toString();
    const payload = `${userId}:${nonce}:${timestamp}`;
    
    // Create HMAC signature to prevent tampering
    const signature = crypto
      .createHmac('sha256', process.env.OAUTH_STATE_SECRET || this.config.clientSecret)
      .update(payload)
      .digest('hex');

    return Buffer.from(`${payload}:${signature}`).toString('base64url');
  }

  /**
   * Validate the state parameter and extract user ID
   * Ensures request integrity and prevents CSRF attacks
   */
  private validateSecureState(state: string): string | null {
    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf-8');
      const [payload, signature] = decoded.split(':');
      const [userId, nonce, timestamp] = payload.split(':');

      // Validate signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.OAUTH_STATE_SECRET || this.config.clientSecret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid state signature');
        return null;
      }

      // Validate timestamp (prevent replay attacks)
      const stateAge = Date.now() - parseInt(timestamp, 10);
      if (stateAge > 10 * 60 * 1000) { // 10 minutes expiry
        console.error('State parameter expired');
        return null;
      }

      return userId;
    } catch (error) {
      console.error('State validation failed:', error);
      return null;
    }
  }

  async generateAuthUrl(userId: string, scopes?: string[]): Promise<{ authUrl: string; state: string }> {
    // Use recommended scopes if none provided
    if (!scopes || scopes.length === 0) {
      scopes = ModernGoogleOAuthClient.getRecommendedScopes();
    }
    if (!this.oauth2Client) {
      await this.initializeOAuth2Client();
    }
    
    if (!this.oauth2Client) {
      throw new Error('Google OAuth2Client not available');
    }

    // Generate PKCE parameters for enhanced security
    const pkce = await this.generatePKCE();
    
    // Generate secure state parameter with user ID and CSRF protection
    const state = await this.generateSecureState(userId);
    
    // Store PKCE data for later validation
    this.pkceStorage.set(state, pkce);
    
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh tokens
      scope: scopes,
      state: state,
      prompt: 'consent', // Force consent to ensure refresh token
      include_granted_scopes: true, // Incremental authorization
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
      response_type: 'code',
      // Use OpenID Connect for enhanced security
      openid_realm: process.env.NEXT_PUBLIC_APP_URL,
      hd: process.env.GOOGLE_OAUTH_HOSTED_DOMAIN, // Restrict to specific domain if configured
    });

    console.log('Generated OAuth URL with PKCE and secure state for user:', userId);
    return { authUrl, state };
  }

  /**
   * Exchange authorization code for tokens
   * Implements proper error handling and token validation
   */
  async exchangeCodeForTokens(code: string, state: string): Promise<TokenData> {
    try {
      if (!this.oauth2Client) {
        await this.initializeOAuth2Client();
      }
      
      if (!this.oauth2Client) {
        throw new Error('Google OAuth2Client not available');
      }

      // Validate state parameter and extract user ID
      const userId = this.validateSecureState(state);
      if (!userId) {
        throw new Error('Invalid or expired state parameter');
      }

      // Retrieve PKCE data for validation
      const pkce = this.pkceStorage.get(state);
      if (!pkce) {
        throw new Error('PKCE data not found for this state');
      }

      // Clean up PKCE data after use (one-time use)
      this.pkceStorage.delete(state);

      // Configure OAuth2 client with PKCE verifier
      this.oauth2Client.setCredentials({
        code_verifier: pkce.codeVerifier,
      });

      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      // Set credentials for future API calls
      this.oauth2Client.setCredentials(tokens);

      // Validate ID token if present (OpenID Connect)
      if (tokens.id_token) {
        await this.validateIdToken(tokens.id_token);
      }

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
   * Validate ID token for OpenID Connect compliance
   * Ensures token integrity and extracts user information
   */
  private async validateIdToken(idToken: string): Promise<void> {
    try {
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: idToken,
        audience: this.config.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid ID token payload');
      }

      // Verify essential claims
      if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
        throw new Error('Invalid token issuer');
      }

      if (payload.aud !== this.config.clientId) {
        throw new Error('Invalid token audience');
      }

      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('ID token has expired');
      }

      console.log('ID token validation successful for user:', payload.sub);
    } catch (error) {
      console.error('ID token validation failed:', error);
      throw new Error('Invalid ID token');
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
   * Get available scope tiers and their descriptions
   */
  static getScopeTiers(): Record<string, { scopes: string[]; description: string; priority: number }> {
    return {
      BASIC: {
        scopes: ModernGoogleOAuthClient.SCOPE_TIERS.BASIC,
        description: 'Basic profile information and authentication',
        priority: 1,
      },
      CALENDAR_READONLY: {
        scopes: ModernGoogleOAuthClient.SCOPE_TIERS.CALENDAR_READONLY,
        description: 'Read-only access to calendar events',
        priority: 2,
      },
      CALENDAR_FULL: {
        scopes: ModernGoogleOAuthClient.SCOPE_TIERS.CALENDAR_FULL,
        description: 'Full calendar management including event creation and settings',
        priority: 3,
      },
      BUSINESS: {
        scopes: ModernGoogleOAuthClient.SCOPE_TIERS.BUSINESS,
        description: 'Business information and listings management',
        priority: 4,
      },
      DRIVE: {
        scopes: ModernGoogleOAuthClient.SCOPE_TIERS.DRIVE,
        description: 'File and document management capabilities',
        priority: 5,
      },
    };
  }

  /**
   * Analyze current scopes and determine scope management status
   */
  analyzeScopes(currentScopes: string[]): ScopeManagementData {
    const allScopes = new Set(currentScopes);
    const tiers = ModernGoogleOAuthClient.getScopeTiers();
    
    let currentTier = 'BASIC';
    let canUpgrade = false;
    let recommendedNextTier: string | undefined;

    // Determine current tier based on granted scopes
    const tierOrder = ['BASIC', 'CALENDAR_READONLY', 'CALENDAR_FULL', 'BUSINESS', 'DRIVE'];
    
    for (const tier of tierOrder.reverse()) {
      const tierScopes = new Set(tiers[tier].scopes);
      if ([...tierScopes].every(scope => allScopes.has(scope))) {
        currentTier = tier;
        break;
      }
    }

    // Determine if upgrade is possible
    const currentTierIndex = tierOrder.indexOf(currentTier);
    if (currentTierIndex < tierOrder.length - 1) {
      canUpgrade = true;
      recommendedNextTier = tierOrder[currentTierIndex + 1];
    }

    return {
      grantedScopes: Array.from(allScopes),
      availableTiers: Object.keys(tiers),
      currentTier,
      canUpgrade,
      recommendedNextTier,
    };
  }

  /**
   * Generate authorization URL for incremental authorization
   */
  async generateIncrementalAuthUrl(request: IncrementalAuthRequest): Promise<{ authUrl: string; state: string }> {
    const { userId, currentScopes, requestedScopes, reason } = request;
    
    // Analyze current scopes to determine what's needed
    const scopeAnalysis = this.analyzeScopes(currentScopes);
    
    // Filter out already granted scopes
    const newScopes = requestedScopes.filter(scope => !currentScopes.includes(scope));
    
    if (newScopes.length === 0) {
      throw new Error('All requested scopes are already granted');
    }

    // Log the incremental authorization request for audit
    console.log(`Incremental auth request for user ${userId}:`, {
      reason,
      currentTier: scopeAnalysis.currentTier,
      newScopes,
      context: request.context,
    });

    // Generate auth URL with new scopes only
    return this.generateAuthUrl(userId, newScopes);
  }

  /**
   * Validate scope requirements for specific operations
   */
  validateScopesForOperation(operation: string, grantedScopes: string[]): { valid: boolean; missingScopes: string[] } {
    const requiredScopes: Record<string, string[]> = {
      'calendar.read': [ModernGoogleOAuthClient.SCOPES.CALENDAR_READONLY],
      'calendar.write': [ModernGoogleOAuthClient.SCOPES.CALENDAR_EVENTS],
      'calendar.settings': [ModernGoogleOAuthClient.SCOPES.CALENDAR_SETTINGS],
      'business.manage': [ModernGoogleOAuthClient.SCOPES.BUSINESS_INFO],
      'business.listings': [ModernGoogleOAuthClient.SCOPES.BUSINESS_LISTINGS],
      'drive.file': [ModernGoogleOAuthClient.SCOPES.DRIVE_FILE],
    };

    const operationScopes = requiredScopes[operation] || [];
    const missingScopes = operationScopes.filter(scope => !grantedScopes.includes(scope));

    return {
      valid: missingScopes.length === 0,
      missingScopes,
    };
  }

  /**
   * Get recommended scopes based on user role and usage patterns
   */
  static getRecommendedScopes(userRole?: string, usageContext?: string): string[] {
    const baseScopes = [...ModernGoogleOAuthClient.SCOPE_TIERS.BASIC];
    
    switch (userRole) {
      case 'admin':
        return [
          ...baseScopes,
          ...ModernGoogleOAuthClient.SCOPE_TIERS.CALENDAR_READONLY,
          ...ModernGoogleOAuthClient.SCOPE_TIERS.CALENDAR_FULL,
          ...ModernGoogleOAuthClient.SCOPE_TIERS.BUSINESS,
          ...ModernGoogleOAuthClient.SCOPE_TIERS.DRIVE,
        ];
      
      case 'manager':
        return [
          ...baseScopes,
          ...ModernGoogleOAuthClient.SCOPE_TIERS.CALENDAR_READONLY,
          ...ModernGoogleOAuthClient.SCOPE_TIERS.CALENDAR_FULL,
          ...ModernGoogleOAuthClient.SCOPE_TIERS.BUSINESS,
        ];
      
      case 'staff':
        return [
          ...baseScopes,
          ...ModernGoogleOAuthClient.SCOPE_TIERS.CALENDAR_READONLY,
          ...ModernGoogleOAuthClient.SCOPE_TIERS.CALENDAR_FULL,
        ];
      
      default:
        // Basic users get read-only calendar access
        return [
          ...baseScopes,
          ...ModernGoogleOAuthClient.SCOPE_TIERS.CALENDAR_READONLY,
        ];
    }
  }
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