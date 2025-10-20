import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Cache configuration
const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
}

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null
    
    try {
      const data = await redis.get(key)
      return data as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    if (!redis) return false
    
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  static async del(key: string): Promise<boolean> {
    if (!redis) return false
    
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  static async invalidatePattern(pattern: string): Promise<boolean> {
    if (!redis) return false
    
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Cache invalidate pattern error:', error)
      return false
    }
  }

  // Helper methods for common cache operations
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    await this.set(key, data, ttl)
    return data
  }

  // Cache keys for different data types
  static keys = {
    user: (id: string) => `user:${id}`,
    instructor: (id: string) => `instructor:${id}`,
    availability: (instructorId: string, date: string) => `availability:${instructorId}:${date}`,
    bookings: (instructorId: string) => `bookings:${instructorId}`,
    workingHours: (instructorId: string) => `working_hours:${instructorId}`,
    constraints: (instructorId: string) => `constraints:${instructorId}`,
  }

  // TTL constants for easy access
  static TTL = CACHE_TTL
}

export default CacheService