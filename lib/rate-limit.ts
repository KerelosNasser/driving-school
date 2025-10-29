// Rate limiting for payment endpoints - 2025 security standards
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  async isAllowed(key: string, config: RateLimitConfig): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Clean up old entries
    for (const [k, v] of this.requests.entries()) {
      if (v.resetTime < now) {
        this.requests.delete(k);
      }
    }
    
    const current = this.requests.get(key);
    
    if (!current) {
      this.requests.set(key, { count: 1, resetTime: now + config.windowMs });
      return true;
    }
    
    if (current.resetTime < now) {
      this.requests.set(key, { count: 1, resetTime: now + config.windowMs });
      return true;
    }
    
    if (current.count >= config.maxRequests) {
      return false;
    }
    
    current.count++;
    return true;
  }

  getRequestInfo(key: string): { count: number; resetTime: number } | undefined {
    return this.requests.get(key);
  }
}

const rateLimiter = new RateLimiter();

// Payment endpoint rate limiting
export const paymentRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 payment attempts per 15 minutes
  keyGenerator: (req: NextRequest) => {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return `payment:${ip}`;
  }
};

// Webhook rate limiting
export const webhookRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 webhook calls per minute
  keyGenerator: (req: NextRequest) => {
    return `webhook:${req.headers.get('x-webhook-signature')?.slice(0, 10) || 'unknown'}`;
  }
};

export async function checkRateLimit(
  req: NextRequest, 
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining?: number; resetTime?: number }> {
  const key = config.keyGenerator ? config.keyGenerator(req) : 'unknown';
  const allowed = await rateLimiter.isAllowed(key, config);
  
  if (!allowed) {
    const current = rateLimiter.getRequestInfo(key);
    return {
      allowed: false,
      remaining: 0,
      resetTime: current?.resetTime || Date.now()
    };
  }
  
  const current = rateLimiter.getRequestInfo(key);
  return {
    allowed: true,
    remaining: config.maxRequests - (current?.count || 0),
    resetTime: current?.resetTime || Date.now()
  };
}