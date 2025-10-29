interface CacheItem {
  value: any
  expiry: number
}

// Simple in-memory cache
const memoryCache = new Map<string, CacheItem>()

// Clean up expired items periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiry < now) {
      memoryCache.delete(key)
    }
  }
}, 60000) // Clean up every minute

// Cache configuration
const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
}

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const item = memoryCache.get(key)
      if (!item) return null
      
      if (item.expiry < Date.now()) {
        memoryCache.delete(key)
        return null
      }
      
      return item.value as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  static async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    try {
      const expiry = Date.now() + (ttl * 1000)
      memoryCache.set(key, { value, expiry })
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      memoryCache.delete(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  static async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      // Simple pattern matching for keys
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key)
        }
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

// Legacy exports for backward compatibility
export async function get(key: string): Promise<any> {
  return CacheService.get(key)
}

export async function set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
  return CacheService.set(key, value, ttl)
}

export async function del(key: string): Promise<boolean> {
  return CacheService.del(key)
}

export async function clear(pattern?: string): Promise<boolean> {
  return CacheService.invalidatePattern(pattern || '*')
}