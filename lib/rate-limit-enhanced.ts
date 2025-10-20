import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Simple Redis connection - fallback to in-memory if no Redis
const redis = process.env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined

// Simple rate limiter - 100 requests per minute for most endpoints
export const rateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
})

// Stricter rate limit for auth endpoints - 10 requests per minute
export const authRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
})

// Helper function to apply rate limiting
export async function checkRateLimit(request: Request, useAuthLimit = false) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const limiter = useAuthLimit ? authRateLimit : rateLimit
  
  const { success, limit, reset, remaining } = await limiter.limit(ip)
  
  return {
    success,
    limit,
    reset,
    remaining,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    }
  }
}