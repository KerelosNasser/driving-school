import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
  skipFailedRequests?: boolean; // Skip counting failed requests
  message?: string; // Custom error message
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limit store
 */
export class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();

  // Clean up expired entries periodically
  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.resetTime < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return entry;
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry);
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now();
    const resetTime = now + windowMs;
    
    const existing = await this.get(key);
    
    if (!existing) {
      const newEntry = { count: 1, resetTime };
      await this.set(key, newEntry);
      return newEntry;
    }
    
    existing.count++;
    await this.set(key, existing);
    return existing;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// Global store instance
const globalStore = new RateLimitStore();

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(req: NextRequest): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0] || 
    req.headers.get('x-real-ip') || 
    'unknown';
  
  return `rate_limit:${ip}`;
}

/**
 * Enhanced rate limiting with multiple strategies
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      keyGenerator: defaultKeyGenerator,
      message: 'Too many requests, please try again later.',
      ...config
    };
    this.store = store || globalStore;
  }

  async checkLimit(req: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(req);
    
    try {
      const entry = await this.store.increment(key, this.config.windowMs);
      
      const remaining = Math.max(0, this.config.maxRequests - entry.count);
      const success = entry.count <= this.config.maxRequests;

      return {
        success,
        limit: this.config.maxRequests,
        remaining,
        resetTime: entry.resetTime,
        message: success ? undefined : this.config.message
      } as RateLimitResult;
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request to proceed
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs
      };
    }
  }

  async reset(req: NextRequest): Promise<void> {
    const key = this.config.keyGenerator!(req);
    await this.store.reset(key);
  }
}

/**
 * IP-based rate limiter
 */
export function createIPRateLimiter(config: Omit<RateLimitConfig, 'keyGenerator'>): RateLimiter {
  return new RateLimiter({
    ...config,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'unknown';
        req.headers.get('x-forwarded-for')?.split(',')[0] || 
        req.headers.get('x-real-ip') || 
        'unknown';
      return `ip:${ip}`;
    }
  });
}

/**
 * User-based rate limiter
 */
export function createUserRateLimiter(config: Omit<RateLimitConfig, 'keyGenerator'>): RateLimiter {
  return new RateLimiter({
    ...config,
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id') || 
        req.headers.get('authorization')?.split(' ')[1] || 
        'anonymous';
      return `user:${userId}`;
    }
  });
}

/**
 * Endpoint-specific rate limiter
 */
export function createEndpointRateLimiter(
  endpoint: string, 
  config: Omit<RateLimitConfig, 'keyGenerator'>
): RateLimiter {
  return new RateLimiter({
    ...config,
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-forwarded-for')?.split(',')[0] || 
        req.headers.get('x-real-ip') || 
        'unknown';
      return `endpoint:${endpoint}:${ip}`;
    }
  });
}

/**
 * Simple rate limit check function for backward compatibility
 */
export async function checkRateLimit(req: NextRequest, limiter?: RateLimiter): Promise<RateLimitResult & { headers?: Record<string, string> }> {
  const rateLimiter = limiter || rateLimiters.api;
  const result = await rateLimiter.checkLimit(req);
  
  return {
    ...result,
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    }
  };
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // General API rate limiting
  api: createIPRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later.'
  }),

  // Authentication endpoints
  auth: createIPRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.'
  }),

  // General rate limiting
  general: createIPRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200,
    message: 'Too many requests, please try again later.'
  }),

  // Booking endpoints
  booking: createUserRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many booking requests, please try again later.'
  }),

  // Contact form
  contact: createIPRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many contact form submissions, please try again later.'
  })
};

export default RateLimiter;