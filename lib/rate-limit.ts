import { NextRequest } from 'next/server';

interface RateLimitOptions {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface RateLimitState {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitState>();

export function rateLimit(options: RateLimitOptions) {
  return {
    check: async (request: NextRequest, limit: number, token: string) => {
      const ip = request.headers.get('x-forwarded-for') || 'anonymous';
      const key = `${ip}:${token}`;
      const now = Date.now();
      
      const state = rateLimitMap.get(key);
      
      if (!state || now > state.resetTime) {
        rateLimitMap.set(key, {
          count: 1,
          resetTime: now + options.interval,
        });
        return;
      }
      
      if (state.count >= limit) {
        throw new Error('Rate limit exceeded');
      }
      
      state.count++;
    },
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of rateLimitMap.entries()) {
    if (now > state.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute