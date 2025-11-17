import { GaxiosError } from 'gaxios';
import { logger } from '@/lib/logger';

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
  TIMEOUT = 'TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
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
  requestId?: string;
  timestamp: Date;
  userId?: string;
  endpoint?: string;
  method?: string;
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
export interface ErrorContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  requestId?: string;
}

export function parseGoogleAPIError(error: any, context?: string | ErrorContext): GoogleAPIError {
  const errorContext = typeof context === 'string' ? { context } : (context || {});
  const timestamp = new Date();
  
  // Handle Gaxios errors (from googleapis library)
  if (error.response) {
    const statusCode = error.response.status;
    const errorData = error.response.data?.error;
    const headers = error.response.headers || {};
    
    let type: GoogleAPIErrorType;
    let retryable = false;
    let retryAfter: number | undefined;

    switch (statusCode) {
      case 400:
        type = errorData?.errors?.some((e: any) => e.reason === 'invalid') 
          ? GoogleAPIErrorType.INVALID_REQUEST 
          : GoogleAPIErrorType.VALIDATION;
        break;
      case 401:
        type = GoogleAPIErrorType.AUTHENTICATION;
        break;
      case 403:
        if (errorData?.reason === 'rateLimitExceeded' || errorData?.reason === 'userRateLimitExceeded') {
          type = GoogleAPIErrorType.RATE_LIMIT;
          retryable = true;
          retryAfter = extractRetryAfter(headers);
        } else if (errorData?.reason === 'quotaExceeded') {
          type = GoogleAPIErrorType.QUOTA_EXCEEDED;
        } else {
          type = GoogleAPIErrorType.AUTHORIZATION;
        }
        break;
      case 404:
        type = GoogleAPIErrorType.NOT_FOUND;
        break;
      case 408:
      case 504:
        type = GoogleAPIErrorType.TIMEOUT;
        retryable = true;
        retryAfter = extractRetryAfter(headers);
        break;
      case 409:
        type = GoogleAPIErrorType.CONFLICT;
        break;
      case 429:
        type = GoogleAPIErrorType.RATE_LIMIT;
        retryable = true;
        retryAfter = extractRetryAfter(headers);
        break;
      case 500:
      case 502:
      case 503:
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
      context: errorContext.context,
      requestId: headers['x-request-id'] || headers['x-goog-request-id'],
      timestamp,
      userId: errorContext.userId,
      endpoint: errorContext.endpoint,
      method: errorContext.method
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
export interface RetryMetrics {
  totalAttempts: number;
  success: boolean;
  finalError?: GoogleAPIError;
  duration: number;
  startTime: Date;
  endTime: Date;
}

export interface RetryOptions {
  onRetry?: (attempt: number, error: GoogleAPIError, delay: number) => void;
  onSuccess?: (attempts: number, duration: number) => void;
  onFailure?: (attempts: number, error: GoogleAPIError, duration: number) => void;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context?: string | ErrorContext,
  options?: RetryOptions
): Promise<T> {
  const startTime = new Date();
  let lastError: GoogleAPIError;
  let totalAttempts = 0;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    totalAttempts = attempt + 1;
    
    try {
      const result = await operation();
      
      if (options?.onSuccess && attempt > 0) {
        const duration = Date.now() - startTime.getTime();
        options.onSuccess(totalAttempts, duration);
      }
      
      return result;
    } catch (error) {
      lastError = parseGoogleAPIError(error, context);
      
      // Don't retry if error is not retryable or we've exhausted retries
      if (!lastError.retryable || attempt === config.maxRetries) {
        if (options?.onFailure) {
          const duration = Date.now() - startTime.getTime();
          options.onFailure(totalAttempts, lastError, duration);
        }
        throw lastError;
      }

      // Don't retry if error type is not in retryable list
      if (!config.retryableErrors.includes(lastError.type)) {
        if (options?.onFailure) {
          const duration = Date.now() - startTime.getTime();
          options.onFailure(totalAttempts, lastError, duration);
        }
        throw lastError;
      }

      const delay = calculateDelay(attempt, config, lastError.retryAfter);
      
      if (options?.onRetry) {
        options.onRetry(attempt + 1, lastError, delay);
      } else {
        logger.warn(`Google API operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}):`, {
          error: lastError.message,
          type: lastError.type,
          statusCode: lastError.statusCode,
          retryAfter: delay,
          context: lastError.context
        });
      }

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
      
      logger.warn(`Rate limit exceeded for key: ${key}. Waiting ${waitTime}ms`);
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
  private successCount: number = 0;
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly successThreshold: number = 3 // successes to close from HALF_OPEN
  ) {}

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      failureThreshold: this.failureThreshold,
      recoveryTimeout: this.recoveryTimeout,
      successThreshold: this.successThreshold
    };
  }

  async execute<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker is OPEN for ${context || 'Google API operation'}`);
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.reset();
        }
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
    this.successCount = 0;
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error(`Circuit breaker opened after ${this.failures} failures`);
    }
  }

  private reset(): void {
    this.failures = 0;
    this.successCount = 0;
    this.state = 'CLOSED';
    logger.info('Circuit breaker reset to CLOSED state');
  }
}

/**
 * Utility function to handle common Google API error scenarios
 */
export interface ErrorMonitoringConfig {
  enabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  metricsEnabled: boolean;
  alertThresholds: {
    errorRate: number; // errors per minute
    responseTime: number; // milliseconds
    retryRate: number; // retries per minute
  };
}

export class GoogleAPIErrorMonitor {
  private errorCounts = new Map<string, number>();
  private retryCounts = new Map<string, number>();
  private responseTimes: number[] = [];
  private startTime = Date.now();
  
  constructor(
    private config: ErrorMonitoringConfig = {
      enabled: true,
      logLevel: 'warn',
      metricsEnabled: true,
      alertThresholds: {
        errorRate: 10, // 10 errors per minute
        responseTime: 5000, // 5 seconds
        retryRate: 5 // 5 retries per minute
      }
    }
  ) {}
  
  recordError(error: GoogleAPIError, context?: string): void {
    if (!this.config.enabled) return;
    
    const key = `${error.type}:${context || 'general'}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    
    if (this.config.metricsEnabled) {
      this.logError(error, context);
      this.checkAlertThresholds(error, context);
    }
  }
  
  recordRetry(error: GoogleAPIError, attempt: number, context?: string): void {
    if (!this.config.enabled) return;
    
    const key = `${error.type}:${context || 'general'}`;
    this.retryCounts.set(key, (this.retryCounts.get(key) || 0) + 1);
  }
  
  recordResponseTime(duration: number): void {
    if (!this.config.enabled || !this.config.metricsEnabled) return;
    
    this.responseTimes.push(duration);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift(); // Keep only last 100 measurements
    }
  }
  
  private logError(error: GoogleAPIError, context?: string): void {
    const logData = {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode,
      retryable: error.retryable,
      retryAfter: error.retryAfter,
      context,
      requestId: error.requestId,
      userId: error.userId,
      endpoint: error.endpoint,
      method: error.method,
      timestamp: error.timestamp.toISOString()
    };
    
    switch (this.config.logLevel) {
      case 'error':
        if (error.type === GoogleAPIErrorType.SERVER_ERROR || 
            error.type === GoogleAPIErrorType.AUTHENTICATION ||
            error.type === GoogleAPIErrorType.AUTHORIZATION) {
          console.error('Google API Error:', logData);
        }
        break;
      case 'warn':
        console.warn('Google API Warning:', logData);
        break;
      case 'info':
      case 'debug':
        console.info('Google API Info:', logData);
        break;
    }
  }
  
  private checkAlertThresholds(error: GoogleAPIError, context?: string): void {
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    
    // Check error rate
    const recentErrors = Array.from(this.errorCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    if (recentErrors > this.config.alertThresholds.errorRate) {
      console.warn(`Google API Alert: High error rate detected (${recentErrors} errors/minute)`);
    }
    
    // Check retry rate
    const recentRetries = Array.from(this.retryCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    if (recentRetries > this.config.alertThresholds.retryRate) {
      console.warn(`Google API Alert: High retry rate detected (${recentRetries} retries/minute)`);
    }
  }
  
  getMetrics() {
    const now = Date.now();
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length 
      : 0;
    
    return {
      uptime: now - this.startTime,
      errorCounts: Object.fromEntries(this.errorCounts),
      retryCounts: Object.fromEntries(this.retryCounts),
      avgResponseTime: Math.round(avgResponseTime),
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
      totalRetries: Array.from(this.retryCounts.values()).reduce((sum, count) => sum + count, 0)
    };
  }
  
  reset(): void {
    this.errorCounts.clear();
    this.retryCounts.clear();
    this.responseTimes = [];
    this.startTime = Date.now();
  }
}

export function handleCommonGoogleAPIErrors(error: GoogleAPIError, monitor?: GoogleAPIErrorMonitor): void {
  if (monitor) {
    monitor.recordError(error);
  }
  
  switch (error.type) {
    case GoogleAPIErrorType.AUTHENTICATION:
      console.error('Google API authentication failed. Please check your credentials.');
      break;
    case GoogleAPIErrorType.AUTHORIZATION:
      console.error('Google API access denied. Check your API key and permissions.');
      break;
    case GoogleAPIErrorType.RATE_LIMIT:
      console.warn(`Rate limit exceeded. Retry after ${error.retryAfter} seconds.`);
      break;
    case GoogleAPIErrorType.QUOTA_EXCEEDED:
      console.error('Google API quota exceeded. Please check your usage limits.');
      break;
    case GoogleAPIErrorType.NOT_FOUND:
      console.warn('Requested resource not found in Google API.');
      break;
    case GoogleAPIErrorType.CONFLICT:
      console.warn('Resource conflict detected in Google API.');
      break;
    case GoogleAPIErrorType.SERVER_ERROR:
      console.error('Google API server error. This is usually temporary.');
      break;
    case GoogleAPIErrorType.NETWORK:
      console.error('Network error while calling Google API. Check your connection.');
      break;
    case GoogleAPIErrorType.TIMEOUT:
      console.error('Google API request timed out. This may be temporary.');
      break;
    case GoogleAPIErrorType.INVALID_REQUEST:
      console.error('Invalid request sent to Google API. Check your request parameters.');
      break;
    case GoogleAPIErrorType.RESOURCE_EXHAUSTED:
      console.error('Google API resources exhausted. This may indicate system overload.');
      break;
    default:
      console.error('Unknown Google API error:', error.message);
  }
}
