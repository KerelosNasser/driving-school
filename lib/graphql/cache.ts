import { GraphQLResolveInfo } from 'graphql';
import { createHash } from 'crypto';

// Simple in-memory cache implementation
interface CacheItem {
  data: any;
  expiry: number;
  tags: string[];
}

// In-memory cache store
const memoryCache = new Map<string, CacheItem>();
const tagIndex = new Map<string, Set<string>>();

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiry < now) {
      // Remove from tag index
      item.tags.forEach(tag => {
        const tagSet = tagIndex.get(tag);
        if (tagSet) {
          tagSet.delete(key);
          if (tagSet.size === 0) {
            tagIndex.delete(tag);
          }
        }
      });
      memoryCache.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Cache key generators
export const generateCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
  return `gql:${prefix}:${parts.join(':')}`;
};

export const generateQueryCacheKey = (query: string, variables: any = {}): string => {
  const hash = createHash('md5')
    .update(query + JSON.stringify(variables))
    .digest('hex');
  return `gql:query:${hash}`;
};

// Cache TTL configurations (in seconds)
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
  STATIC: 86400, // 24 hours
} as const;

// Cache interface
interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

interface CacheResult<T> {
  data: T | null;
  hit: boolean;
  ttl?: number;
}

// In-memory fallback cache
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number; tags: string[] }>();
  private maxSize = 1000;

  set(key: string, data: any, ttl: number = CacheTTL.MEDIUM, tags: string[] = []): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + (ttl * 1000),
      tags
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidateByTag(tag: string): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  size(): number {
    return this.cache.size;
  }
}

const memoryCache = new MemoryCache();

// Cache operations
export class CacheManager {
  static async get<T>(key: string): Promise<CacheResult<T>> {
    try {
      if (redis) {
        const data = await redis.get(key);
        if (data) {
          const ttl = await redis.ttl(key);
          return {
            data: JSON.parse(data),
            hit: true,
            ttl: ttl > 0 ? ttl : undefined
          };
        }
      } else {
        const data = memoryCache.get(key);
        if (data) {
          return { data, hit: true };
        }
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }

    return { data: null, hit: false };
  }

  static async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = CacheTTL.MEDIUM, tags = [] } = options;

    try {
      if (redis) {
        const serialized = JSON.stringify(data);
        await redis.setex(key, ttl, serialized);
        
        // Store tags for invalidation
        if (tags.length > 0) {
          const tagKey = `tags:${key}`;
          await redis.setex(tagKey, ttl, JSON.stringify(tags));
        }
      } else {
        memoryCache.set(key, data, ttl, tags);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
        await redis.del(`tags:${key}`);
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      if (redis) {
        await redis.flushdb();
      } else {
        memoryCache.clear();
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  static async invalidateByTag(tag: string): Promise<void> {
    try {
      if (redis) {
        // Find all keys with this tag
        const tagKeys = await redis.keys('tags:*');
        const keysToDelete: string[] = [];
        
        for (const tagKey of tagKeys) {
          const tags = await redis.get(tagKey);
          if (tags && JSON.parse(tags).includes(tag)) {
            const originalKey = tagKey.replace('tags:', '');
            keysToDelete.push(originalKey, tagKey);
          }
        }
        
        if (keysToDelete.length > 0) {
          await redis.del(...keysToDelete);
        }
      } else {
        memoryCache.invalidateByTag(tag);
      }
    } catch (error) {
      console.error('Cache invalidate by tag error:', error);
    }
  }

  static async getStats(): Promise<{ hits: number; misses: number; size: number }> {
    try {
      if (redis) {
        const info = await redis.info('stats');
        const hits = parseInt(info.match(/keyspace_hits:(\d+)/)?.[1] || '0');
        const misses = parseInt(info.match(/keyspace_misses:(\d+)/)?.[1] || '0');
        const size = await redis.dbsize();
        return { hits, misses, size };
      } else {
        return { hits: 0, misses: 0, size: memoryCache.size() };
      }
    } catch (error) {
      console.error('Cache stats error:', error);
      return { hits: 0, misses: 0, size: 0 };
    }
  }
}

// Caching decorators for resolvers
export const cached = (options: CacheOptions = {}) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [parent, resolverArgs, context, info] = args;
      
      // Generate cache key based on resolver name and arguments
      const cacheKey = generateCacheKey(
        info.fieldName,
        context.user?.id || 'anonymous',
        JSON.stringify(resolverArgs)
      );
      
      // Try to get from cache
      const cached = await CacheManager.get(cacheKey);
      if (cached.hit) {
        return cached.data;
      }
      
      // Execute resolver
      const result = await method.apply(this, args);
      
      // Cache the result
      await CacheManager.set(cacheKey, result, options);
      
      return result;
    };
  };
};

// Query result caching middleware
export const cacheQueryResults = (options: CacheOptions = {}) => {
  return async (resolve: any, parent: any, args: any, context: any, info: GraphQLResolveInfo) => {
    // Only cache queries, not mutations or subscriptions
    if (info.operation.operation !== 'query') {
      return resolve(parent, args, context, info);
    }
    
    // Generate cache key for the entire query
    const cacheKey = generateQueryCacheKey(info.operation.loc?.source.body || '', args);
    
    // Try to get from cache
    const cached = await CacheManager.get(cacheKey);
    if (cached.hit) {
      return cached.data;
    }
    
    // Execute resolver
    const result = await resolve(parent, args, context, info);
    
    // Cache the result
    await CacheManager.set(cacheKey, result, options);
    
    return result;
  };
};

// Entity-specific cache helpers
export const UserCache = {
  get: (userId: string) => CacheManager.get(generateCacheKey('user', userId)),
  set: (userId: string, data: any) => CacheManager.set(
    generateCacheKey('user', userId), 
    data, 
    { ttl: CacheTTL.MEDIUM, tags: ['user', `user:${userId}`] }
  ),
  invalidate: (userId: string) => CacheManager.delete(generateCacheKey('user', userId)),
  invalidateAll: () => CacheManager.invalidateByTag('user')
};

export const PackageCache = {
  get: (packageId?: string) => CacheManager.get(generateCacheKey('packages', packageId || 'all')),
  set: (data: any, packageId?: string) => CacheManager.set(
    generateCacheKey('packages', packageId || 'all'), 
    data, 
    { ttl: CacheTTL.LONG, tags: ['package', packageId ? `package:${packageId}` : 'packages'] }
  ),
  invalidate: (packageId?: string) => CacheManager.delete(generateCacheKey('packages', packageId || 'all')),
  invalidateAll: () => CacheManager.invalidateByTag('package')
};

export const ReviewCache = {
  get: (filters?: any) => CacheManager.get(generateCacheKey('reviews', JSON.stringify(filters || {}))),
  set: (data: any, filters?: any) => CacheManager.set(
    generateCacheKey('reviews', JSON.stringify(filters || {})), 
    data, 
    { ttl: CacheTTL.MEDIUM, tags: ['review'] }
  ),
  invalidateAll: () => CacheManager.invalidateByTag('review')
};

export const BookingCache = {
  get: (userId: string, filters?: any) => CacheManager.get(
    generateCacheKey('bookings', userId, JSON.stringify(filters || {}))
  ),
  set: (userId: string, data: any, filters?: any) => CacheManager.set(
    generateCacheKey('bookings', userId, JSON.stringify(filters || {})), 
    data, 
    { ttl: CacheTTL.SHORT, tags: ['booking', `user:${userId}`] }
  ),
  invalidateUser: (userId: string) => CacheManager.invalidateByTag(`user:${userId}`),
  invalidateAll: () => CacheManager.invalidateByTag('booking')
};

// Health check for cache
export const checkCacheHealth = async (): Promise<{ status: 'healthy' | 'unhealthy'; message: string; stats?: any }> => {
  try {
    if (redis) {
      await redis.ping();
      const stats = await CacheManager.getStats();
      return { 
        status: 'healthy', 
        message: 'Redis cache is operational',
        stats
      };
    } else {
      const stats = await CacheManager.getStats();
      return { 
        status: 'healthy', 
        message: 'Memory cache is operational',
        stats
      };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `Cache health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Graceful shutdown
export const shutdownCache = async (): Promise<void> => {
  try {
    if (redis) {
      await redis.quit();
    }
    memoryCache.clear();
  } catch (error) {
    console.error('Error during cache shutdown:', error);
  }
};

export { redis };