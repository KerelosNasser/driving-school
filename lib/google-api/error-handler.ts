import { GaxiosError } from 'gaxios';

/**
 * Comprehensive error handling for Google API interactions
 * Implements retry mechanisms, rate limiting, and proper error classification
 */

export enum GoogleAPIErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION', 
  RATE_LIMIT = 'RATE_LIMIT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export interface GoogleAPIError {
  type: GoogleAPIErrorType;
  message: string;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number; // seconds
  originalError?: any;
  context?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableErrors: GoogleAPIErrorType[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    GoogleAPIErrorType.RATE_LIMIT,
    GoogleAPIErrorType.NETWORK,
    GoogleAPIErrorType.SERVER_ERROR
  ]
};

/**
 * Parse and classify Google API errors
 */
export function parseGoogleAPIError(error: any, context?: string): GoogleAPIError {
  // Handle Gaxios errors (from googleapis library)
  if (error.response) {
    const statusCode = error.response.status;
    const errorData = error.response.data?.error;
    
    let type: GoogleAPIErrorType;
    let retryable = false;
    let retryAfter: number | undefined;

    switch (statusCode) {
      case 400:
        type = GoogleAPIErrorType.VALIDATION;
        break;
      case 401:
        type = GoogleAPIErrorType.AUTHENTICATION;
        break;
      case 403:
        if (errorData?.reason === 'rateLimitExceeded' || errorData?.reason === 'userRateLimitExceeded') {
          type = GoogleAPIErrorType.RATE_LIMIT;
          retryable = true;
          retryAfter = extractRetryAfter(error.response.headers);
        } else if (errorData?.reason === 'quotaExceeded') {
          type = GoogleAPIErrorType.QUOTA_EXCEEDED;
        } else {
          type = GoogleAPIErrorType.AUTHORIZATION;
        }
        break;
      case 404:
        type = GoogleAPIErrorType.NOT_FOUND;
        break;
      case 409:
        type = GoogleAPIErrorType.CONFLICT;
        break;
      case 429:
        type = GoogleAPIErrorType.RATE_LIMIT;
        retryable = true;
        retryAfter = extractRetryAfter(error.response.headers);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = GoogleAPIErrorType.SERVER_ERROR;
        retryable = true;
        break;
      default:
        type = GoogleAPIErrorType.UNKNOWN;
    }

    return {
      type,
      message: errorData?.message || error.message || `HTTP ${statusCode} error`,
      statusCode,
      retryable,
      retryAfter,
      originalError: error,
      context
    };
  }

  // Handle network errors
  if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return {
      type: GoogleAPIErrorType.NETWORK,
      message: `Network error: ${error.message}`,
      retryable: true,
      originalError: error,
      context
    };
  }

  // Handle other errors
  return {
    type: GoogleAPIErrorType.UNKNOWN,
    message: error.message || 'Unknown error occurred',
    retryable: false,
    originalError: error,
    context
  };
}

/**
 * Extract retry-after header value
 */
function extractRetryAfter(headers: any): number | undefined {
  const retryAfter = headers['retry-after'] || headers['Retry-After'];
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    return isNaN(seconds) ? undefined : seconds;
  }
  return undefined;
}

/**
 * Calculate delay for exponential backoff with jitter
 */
function calculateDelay(attempt: number, config: RetryConfig, retryAfter?: number): number {
  if (retryAfter) {
    return retryAfter * 1000; // Convert to milliseconds
  }

  const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.1 * exponentialDelay; // Add 10% jitter
  const delay = Math.min(exponentialDelay + jitter, config.maxDelay);
  
  return Math.floor(delay);
}

/**
 * Retry wrapper for Google API calls with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context?: string
): Promise<T> {
  let lastError: GoogleAPIError;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = parseGoogleAPIError(error, context);
      
      // Don't retry if error is not retryable or we've exhausted retries
      if (!lastError.retryable || attempt === config.maxRetries) {
        throw lastError;
      }

      // Don't retry if error type is not in retryable list
      if (!config.retryableErrors.includes(lastError.type)) {
        throw lastError;
      }

      const delay = calculateDelay(attempt, config, lastError.retryAfter);
      
      console.warn(`Google API operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}):`, {
        error: lastError.message,
        type: lastError.type,
        statusCode: lastError.statusCode,
        retryAfter: delay,
        context: lastError.context
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Rate limiter for Google API calls
 */
export class GoogleAPIRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) { // 100 requests per minute by default
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed and update rate limit state
   */
  async checkRateLimit(key: string = 'default'): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove requests outside the window
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      console.warn(`Rate limit exceeded for key: ${key}. Waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.checkRateLimit(key); // Recursive call after waiting
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(key: string = 'default'): { remaining: number; resetTime: number } {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(timestamp => now - timestamp < this.windowMs);
    
    const remaining = Math.max(0, this.maxRequests - validRequests.length);
    const resetTime = validRequests.length > 0 ? Math.min(...validRequests) + this.windowMs : now;
    
    return { remaining, resetTime };
  }
}

/**
 * Circuit breaker for Google API calls
 */
export class GoogleAPICircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker is OPEN for ${context || 'Google API operation'}`);
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error(`Circuit breaker opened after ${this.failures} failures`);
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    console.info('Circuit breaker reset to CLOSED state');
  }

  getState(): { state: string; failures: number; lastFailureTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Utility function to handle common Google API error scenarios
 */
export function handleCommonGoogleAPIErrors(error: GoogleAPIError): never {
  switch (error.type) {
    case GoogleAPIErrorType.AUTHENTICATION:
      throw new Error('Google API authentication failed. Please check your credentials and re-authenticate.');
    
    case GoogleAPIErrorType.AUTHORIZATION:
      throw new Error('Insufficient permissions for Google API operation. Please check your OAuth scopes.');
    
    case GoogleAPIErrorType.RATE_LIMIT:
      throw new Error(`Google API rate limit exceeded. ${error.retryAfter ? `Retry after ${error.retryAfter} seconds.` : 'Please try again later.'}`);
    
    case GoogleAPIErrorType.QUOTA_EXCEEDED:
      throw new Error('Google API quota exceeded. Please check your API usage limits.');
    
    case GoogleAPIErrorType.NOT_FOUND:
      throw new Error('Requested Google API resource not found.');
    
    case GoogleAPIErrorType.VALIDATION:
      throw new Error(`Google API validation error: ${error.message}`);
    
    default:
      throw new Error(`Google API error: ${error.message}`);
  }
}