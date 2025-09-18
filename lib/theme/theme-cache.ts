// Advanced theme caching system with intelligent eviction and preloading
import { Theme } from './types';
import { performanceOptimizer } from './performance-optimizer';

export interface CacheEntry {
  theme: Theme;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: number;
}

export interface CacheOptions {
  maxSize: number;
  maxMemory: number; // in bytes
  ttl: number; // time to live in ms
  enablePersistence: boolean;
  enableCompression: boolean;
  evictionStrategy: 'lru' | 'lfu' | 'ttl' | 'priority';
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
}

export class ThemeCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    memoryUsage: 0,
    hitRate: 0
  };
  
  private options: CacheOptions;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: Partial<CacheOptions> = {}) {
    this.options = {
      maxSize: 50,
      maxMemory: 10 * 1024 * 1024, // 10MB
      ttl: 30 * 60 * 1000, // 30 minutes
      enablePersistence: true,
      enableCompression: true,
      evictionStrategy: 'lru',
      ...options
    };

    this.startCleanupTimer();
    this.loadFromPersistence();
  }

  /**
   * Get theme from cache
   */
  get(themeId: string): Theme | null {
    const entry = this.cache.get(themeId);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(themeId);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    entry.priority = this.calculatePriority(entry);

    this.stats.hits++;
    this.updateHitRate();

    return entry.theme;
  }

  /**
   * Set theme in cache
   */
  set(themeId: string, theme: Theme, priority: number = 1): void {
    const size = this.calculateThemeSize(theme);
    
    // Check if we need to evict entries
    this.ensureCapacity(size);

    const entry: CacheEntry = {
      theme,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
      priority
    };

    this.cache.set(themeId, entry);
    this.stats.size = this.cache.size;
    this.updateMemoryUsage();

    // Persist to storage if enabled
    if (this.options.enablePersistence) {
      this.persistEntry(themeId, entry);
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.options.ttl;
  }

  /**
   * Calculate theme size in bytes
   */
  private calculateThemeSize(theme: Theme): number {
    return new Blob([JSON.stringify(theme)]).size;
  }

  /**
   * Calculate entry priority based on access patterns
   */
  private calculatePriority(entry: CacheEntry): number {
    const recency = Date.now() - entry.lastAccessed;
    const frequency = entry.accessCount;
    const age = Date.now() - entry.timestamp;
    
    // Higher priority for recently accessed, frequently used, newer themes
    return (frequency * 1000) / (recency + age + 1);
  }

  /**
   * Ensure cache has capacity for new entry
   */
  private ensureCapacity(newEntrySize: number): void {
    // Check size limit
    while (this.cache.size >= this.options.maxSize) {
      this.evictEntry();
    }

    // Check memory limit
    while (this.getCurrentMemoryUsage() + newEntrySize > this.options.maxMemory) {
      this.evictEntry();
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * Evict entry based on strategy
   */
  private evictEntry(): void {
    if (this.cache.size === 0) return;

    let targetKey = '';
    
    switch (this.options.evictionStrategy) {
      case 'lru':
        targetKey = this.findLRUEntry();
        break;
      case 'lfu':
        targetKey = this.findLFUEntry();
        break;
      case 'ttl':
        targetKey = this.findExpiredEntry();
        break;
      case 'priority':
        targetKey = this.findLowestPriorityEntry();
        break;
    }

    if (targetKey) {
      this.cache.delete(targetKey);
      this.stats.evictions++;
      this.stats.size = this.cache.size;
      this.updateMemoryUsage();
    }
  }

  /**
   * Find least recently used entry
   */
  private findLRUEntry(): string {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Find least frequently used entry
   */
  private findLFUEntry(): string {
    let leastUsedKey = '';
    let leastCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  /**
   * Find expired entry
   */
  private findExpiredEntry(): string {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        return key;
      }
    }
    
    // If no expired entries, fall back to LRU
    return this.findLRUEntry();
  }

  /**
   * Find lowest priority entry
   */
  private findLowestPriorityEntry(): string {
    let lowestKey = '';
    let lowestPriority = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      const priority = this.calculatePriority(entry);
      if (priority < lowestPriority) {
        lowestPriority = priority;
        lowestKey = key;
      }
    }

    return lowestKey;
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Update memory usage statistics
   */
  private updateMemoryUsage(): void {
    this.stats.memoryUsage = this.getCurrentMemoryUsage();
  }

  /**
   * Start cleanup timer for expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });

    if (expiredKeys.length > 0) {
      this.stats.size = this.cache.size;
      this.updateMemoryUsage();
    }
  }

  /**
   * Persist entry to storage
   */
  private persistEntry(themeId: string, entry: CacheEntry): void {
    if (typeof window === 'undefined') return;

    try {
      const data = this.options.enableCompression 
        ? performanceOptimizer.getCachedTheme(themeId) // Use compressed version
        : entry.theme;

      const persistData = {
        theme: data,
        metadata: {
          timestamp: entry.timestamp,
          accessCount: entry.accessCount,
          lastAccessed: entry.lastAccessed,
          priority: entry.priority
        }
      };

      localStorage.setItem(`theme-cache-${themeId}`, JSON.stringify(persistData));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  /**
   * Load cache from persistence
   */
  private loadFromPersistence(): void {
    if (typeof window === 'undefined' || !this.options.enablePersistence) return;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('theme-cache-')) {
          const themeId = key.replace('theme-cache-', '');
          const data = localStorage.getItem(key);
          
          if (data) {
            const parsed = JSON.parse(data);
            const entry: CacheEntry = {
              theme: parsed.theme,
              timestamp: parsed.metadata.timestamp,
              accessCount: parsed.metadata.accessCount,
              lastAccessed: parsed.metadata.lastAccessed,
              size: this.calculateThemeSize(parsed.theme),
              priority: parsed.metadata.priority
            };

            // Only load if not expired
            if (!this.isExpired(entry)) {
              this.cache.set(themeId, entry);
            } else {
              localStorage.removeItem(key);
            }
          }
        }
      }

      this.stats.size = this.cache.size;
      this.updateMemoryUsage();
    } catch (error) {
      console.warn('Failed to load cache from persistence:', error);
    }
  }

  /**
   * Preload themes for better performance
   */
  async preload(themeIds: string[], loader: (id: string) => Promise<Theme>): Promise<void> {
    const preloadPromises = themeIds.map(async (themeId) => {
      if (!this.cache.has(themeId)) {
        try {
          const theme = await loader(themeId);
          this.set(themeId, theme, 2); // Higher priority for preloaded themes
        } catch (error) {
          console.warn(`Failed to preload theme ${themeId}:`, error);
        }
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Warm up cache with frequently used themes
   */
  async warmUp(popularThemeIds: string[], loader: (id: string) => Promise<Theme>): Promise<void> {
    // Load popular themes with high priority
    await this.preload(popularThemeIds, loader);
    
    // Mark them as frequently accessed
    popularThemeIds.forEach(themeId => {
      const entry = this.cache.get(themeId);
      if (entry) {
        entry.accessCount += 10; // Boost access count
        entry.priority = this.calculatePriority(entry);
      }
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateMemoryUsage();
    return { ...this.stats };
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
      hitRate: 0
    };

    // Clear persistence
    if (typeof window !== 'undefined' && this.options.enablePersistence) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('theme-cache-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  /**
   * Get cache entries sorted by priority
   */
  getEntriesByPriority(): Array<{ id: string; entry: CacheEntry }> {
    const entries: Array<{ id: string; entry: CacheEntry }> = [];
    
    for (const [id, entry] of this.cache.entries()) {
      entries.push({ id, entry });
    }

    return entries.sort((a, b) => b.entry.priority - a.entry.priority);
  }

  /**
   * Get memory usage breakdown
   */
  getMemoryBreakdown(): Array<{ id: string; size: number; percentage: number }> {
    const total = this.getCurrentMemoryUsage();
    const breakdown: Array<{ id: string; size: number; percentage: number }> = [];

    for (const [id, entry] of this.cache.entries()) {
      breakdown.push({
        id,
        size: entry.size,
        percentage: total > 0 ? (entry.size / total) * 100 : 0
      });
    }

    return breakdown.sort((a, b) => b.size - a.size);
  }

  /**
   * Optimize cache by removing low-priority entries
   */
  optimize(): void {
    const entries = this.getEntriesByPriority();
    const targetSize = Math.floor(this.options.maxSize * 0.8); // Keep 80% capacity
    
    while (this.cache.size > targetSize && entries.length > 0) {
      const entry = entries.pop(); // Remove lowest priority
      if (entry) {
        this.cache.delete(entry.id);
        this.stats.evictions++;
      }
    }

    this.stats.size = this.cache.size;
    this.updateMemoryUsage();
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clear();
  }
}

// Export singleton instance
export const themeCache = new ThemeCache();