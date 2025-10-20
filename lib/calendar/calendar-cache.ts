/**
 * Calendar Cache System
 * Implements intelligent caching for calendar operations to reduce API calls
 * and improve performance while maintaining data consistency
 */

import { CalendarEvent } from './calendar-service';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
  memoryUsage: number; // Approximate memory usage in bytes
}

export interface CacheConfig {
  defaultTTL: number; // Default TTL in milliseconds
  maxEntries: number; // Maximum number of cache entries
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableStats: boolean; // Enable cache statistics
}

export class CalendarCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    hitRate: 0,
    memoryUsage: 0
  };
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout | undefined;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxEntries: 1000,
      cleanupInterval: 60 * 1000, // 1 minute
      enableStats: true,
      ...config
    };

    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.recordMiss();
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.recordMiss();
      return null;
    }

    this.recordHit();
    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxEntries) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      key
    };

    this.cache.set(key, entry);
    this.updateStats();
  }

  /**
   * Delete cached entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      entries: this.cache.size,
      hitRate: 0,
      memoryUsage: this.calculateMemoryUsage()
    };
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.updateStats();
    return count;
  }

  /**
   * Get cache keys matching pattern
   */
  getKeys(pattern?: string | RegExp): string[] {
    if (!pattern) {
      return Array.from(this.cache.keys());
    }
    
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  /**
   * Refresh cache entry (extend TTL)
   */
  refresh(key: string, ttl?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    entry.timestamp = Date.now();
    if (ttl !== undefined) {
      entry.ttl = ttl;
    }
    
    return true;
  }

  /**
   * Get cache entry info
   */
  getEntryInfo(key: string): { exists: boolean; age?: number; ttl?: number; expiresIn?: number } {
    const entry = this.cache.get(key);
    if (!entry) {
      return { exists: false };
    }
    
    const now = Date.now();
    const age = now - entry.timestamp;
    const expiresIn = Math.max(0, entry.timestamp + entry.ttl - now);
    
    return {
      exists: true,
      age,
      ttl: entry.ttl,
      expiresIn
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    this.updateStats();
    return removed;
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }

  // Private methods

  private startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private recordHit(): void {
    if (this.config.enableStats) {
      this.stats.hits++;
      this.updateHitRate();
    }
  }

  private recordMiss(): void {
    if (this.config.enableStats) {
      this.stats.misses++;
      this.updateHitRate();
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private updateStats(): void {
    if (this.config.enableStats) {
      this.stats.entries = this.cache.size;
      this.stats.memoryUsage = this.calculateMemoryUsage();
    }
  }

  private calculateMemoryUsage(): number {
    // Rough estimation of memory usage
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // String characters are 2 bytes
      size += JSON.stringify(entry.data).length * 2;
      size += 32; // Overhead for entry object
    }
    return size;
  }
}

/**
 * Calendar-specific cache with predefined keys and TTLs
 */
export class CalendarCacheManager extends CalendarCache {
  // Cache key generators
  static keys = {
    events: (userId: string, startDate: string, endDate: string) => 
      `events:${userId}:${startDate}:${endDate}`,
    
    event: (userId: string, eventId: string) => 
      `event:${userId}:${eventId}`,
    
    availability: (userId: string, date: string, duration: number) => 
      `availability:${userId}:${date}:${duration}`,
    
    weekAvailability: (userId: string, weekStart: string, duration: number) => 
      `week-availability:${userId}:${weekStart}:${duration}`,
    
    busyTimes: (userId: string, date: string) => 
      `busy-times:${userId}:${date}`,
    
    userBookings: (userId: string, startDate: string, endDate: string) => 
      `user-bookings:${userId}:${startDate}:${endDate}`,
    
    constraints: () => 'scheduling-constraints',
    
    connectionStatus: (userId: string) => `connection:${userId}`
  };

  // Cache TTLs (in milliseconds)
  static ttls = {
    events: 2 * 60 * 1000,        // 2 minutes
    event: 5 * 60 * 1000,         // 5 minutes
    availability: 1 * 60 * 1000,   // 1 minute
    weekAvailability: 2 * 60 * 1000, // 2 minutes
    busyTimes: 1 * 60 * 1000,      // 1 minute
    userBookings: 30 * 1000,       // 30 seconds
    constraints: 10 * 60 * 1000,   // 10 minutes
    connectionStatus: 5 * 60 * 1000 // 5 minutes
  };

  constructor() {
    super({
      defaultTTL: 2 * 60 * 1000, // 2 minutes
      maxEntries: 500,
      cleanupInterval: 30 * 1000, // 30 seconds
      enableStats: true
    });
  }

  // Convenience methods for calendar operations

  getEvents(userId: string, startDate: string, endDate: string): CalendarEvent[] | null {
    return this.get(CalendarCacheManager.keys.events(userId, startDate, endDate));
  }

  setEvents(userId: string, startDate: string, endDate: string, events: CalendarEvent[]): void {
    this.set(
      CalendarCacheManager.keys.events(userId, startDate, endDate),
      events,
      CalendarCacheManager.ttls.events
    );
  }

  getEvent(userId: string, eventId: string): CalendarEvent | null {
    return this.get(CalendarCacheManager.keys.event(userId, eventId));
  }

  setEvent(userId: string, eventId: string, event: CalendarEvent): void {
    this.set(
      CalendarCacheManager.keys.event(userId, eventId),
      event,
      CalendarCacheManager.ttls.event
    );
  }

  getAvailability(userId: string, date: string, duration: number): any | null {
    return this.get(CalendarCacheManager.keys.availability(userId, date, duration));
  }

  setAvailability(userId: string, date: string, duration: number, availability: any): void {
    this.set(
      CalendarCacheManager.keys.availability(userId, date, duration),
      availability,
      CalendarCacheManager.ttls.availability
    );
  }

  getConnectionStatus(userId: string): boolean | null {
    return this.get(CalendarCacheManager.keys.connectionStatus(userId));
  }

  setConnectionStatus(userId: string, status: boolean): void {
    this.set(
      CalendarCacheManager.keys.connectionStatus(userId),
      status,
      CalendarCacheManager.ttls.connectionStatus
    );
  }

  // Invalidation methods

  invalidateUserCache(userId: string): number {
    return this.invalidatePattern(new RegExp(`^(events|event|availability|week-availability|busy-times|user-bookings|connection):${userId}:`));
  }

  invalidateEventsCache(userId?: string): number {
    const pattern = userId 
      ? new RegExp(`^events:${userId}:`)
      : new RegExp('^events:');
    return this.invalidatePattern(pattern);
  }

  invalidateAvailabilityCache(userId?: string): number {
    const pattern = userId 
      ? new RegExp(`^(availability|week-availability):${userId}:`)
      : new RegExp('^(availability|week-availability):');
    return this.invalidatePattern(pattern);
  }

  invalidateConstraintsCache(): number {
    return this.invalidatePattern(new RegExp('^scheduling-constraints$'));
  }

  // Event-based cache invalidation

  onEventCreated(userId: string, event: CalendarEvent): void {
    // Invalidate availability and events cache
    this.invalidateAvailabilityCache(userId);
    this.invalidateEventsCache(userId);
    
    // Cache the new event
    this.setEvent(userId, event.id, event);
  }

  onEventUpdated(userId: string, event: CalendarEvent): void {
    // Invalidate availability and events cache
    this.invalidateAvailabilityCache(userId);
    this.invalidateEventsCache(userId);
    
    // Update cached event
    this.setEvent(userId, event.id, event);
  }

  onEventDeleted(userId: string, eventId: string): void {
    // Invalidate availability and events cache
    this.invalidateAvailabilityCache(userId);
    this.invalidateEventsCache(userId);
    
    // Remove cached event
    this.delete(CalendarCacheManager.keys.event(userId, eventId));
  }

  onConstraintsUpdated(): void {
    // Invalidate all availability cache when constraints change
    this.invalidatePattern(new RegExp('^(availability|week-availability):'));
    this.invalidateConstraintsCache();
  }
}

// Export singleton instance
export const calendarCache = new CalendarCacheManager();

// Utility functions for cache warming
export const warmCache = {
  /**
   * Pre-load events for the next few days
   */
  async preloadEvents(userId: string, days: number = 7): Promise<void> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    // This would typically call the calendar service to load events
    // and cache them for future use
    console.log(`Warming cache for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  },

  /**
   * Pre-calculate availability for common durations
   */
  async preloadAvailability(userId: string, days: number = 7): Promise<void> {
    const commonDurations = [60, 90, 120]; // Common lesson durations
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      for (const duration of commonDurations) {
        // This would typically call the availability calculator
        console.log(`Warming availability cache for ${date.toDateString()}, duration: ${duration}min`);
      }
    }
  }
};