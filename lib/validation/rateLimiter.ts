/**
 * Rate limiting for real-time operations
 */

import { RateLimitConfig } from './types';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetTime) {
      // First request or window expired
      const resetTime = now + this.config.windowMs;
      this.store.set(key, { count: 1, resetTime });
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime
      };
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current status for a key
   */
  getStatus(key: string): { count: number; remaining: number; resetTime: number } | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }
}

// Pre-configured rate limiters for different operations
export const rateLimiters = {
  // General content operations: 100 requests per minute
  content: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100
  }),

  // Real-time operations: 200 requests per minute
  realtime: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 200
  }),

  // Component operations: 50 requests per minute
  component: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 50
  }),

  // Page operations: 20 requests per minute
  page: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 20
  }),

  // Navigation operations: 30 requests per minute
  navigation: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30
  }),

  // File upload operations: 10 requests per minute
  upload: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10
  })
};

/**
 * Generate rate limit key from request context
 */
export function generateRateLimitKey(
  userId: string, 
  operation: string, 
  resource?: string
): string {
  return `${userId}:${operation}${resource ? `:${resource}` : ''}`;
}

/**
 * Check rate limit for a specific operation
 */
export function checkRateLimit(
  limiter: RateLimiter,
  userId: string,
  operation: string,
  resource?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = generateRateLimitKey(userId, operation, resource);
  return limiter.checkLimit(key);
}

/**
 * Rate limit middleware for API endpoints
 */
export function createRateLimitMiddleware(limiter: RateLimiter, operation: string) {
  return (req: any, res: any, next: any) => {
    const userId = req.user?.id || req.ip || 'anonymous';
    const result = checkRateLimit(limiter, userId, operation);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter['config'].maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many ${operation} requests. Try again later.`,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }

    next();
  };
}