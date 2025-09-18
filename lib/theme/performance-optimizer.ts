// Performance optimization system for theme management
import { Theme } from './types';

export interface PerformanceMetrics {
  cssUpdateTime: number;
  themeLoadTime: number;
  previewRenderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

export interface OptimizationOptions {
  enableBatching?: boolean;
  batchDelay?: number;
  enableCaching?: boolean;
  maxCacheSize?: number;
  enableLazyLoading?: boolean;
  enablePreloading?: boolean;
  enableCompression?: boolean;
}

export class PerformanceOptimizer {
  private updateQueue: Array<() => void> = [];
  private isProcessing = false;
  private batchTimeout: NodeJS.Timeout | null = null;
  private cache = new Map<string, { data: any; timestamp: number; accessCount: number }>();
  private metrics: PerformanceMetrics = {
    cssUpdateTime: 0,
    themeLoadTime: 0,
    previewRenderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  };
  
  private options: Required<OptimizationOptions>;
  private cacheStats = { hits: 0, misses: 0 };

  constructor(options: OptimizationOptions = {}) {
    this.options = {
      enableBatching: true,
      batchDelay: 16, // ~60fps
      enableCaching: true,
      maxCacheSize: 50,
      enableLazyLoading: true,
      enablePreloading: false,
      enableCompression: true,
      ...options
    };
  }

  /**
   * Optimize CSS variable updates with batching
   */
  optimizeCSSUpdates(updateFn: () => void): void {
    if (!this.options.enableBatching) {
      updateFn();
      return;
    }

    this.updateQueue.push(updateFn);

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatchedUpdates();
    }, this.options.batchDelay);
  }

  /**
   * Process batched CSS updates
   */
  private processBatchedUpdates(): void {
    if (this.isProcessing || this.updateQueue.length === 0) return;

    this.isProcessing = true;
    const startTime = performance.now();

    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      try {
        // Process all queued updates in a single frame
        while (this.updateQueue.length > 0) {
          const update = this.updateQueue.shift();
          if (update) {
            update();
          }
        }

        // Update metrics
        this.metrics.cssUpdateTime = performance.now() - startTime;
      } catch (error) {
        console.error('Error processing batched CSS updates:', error);
      } finally {
        this.isProcessing = false;
        this.batchTimeout = null;
      }
    });
  }

  /**
   * Intelligent theme caching with LRU eviction
   */
  cacheTheme(key: string, theme: Theme): void {
    if (!this.options.enableCaching) return;

    // Implement LRU cache eviction
    if (this.cache.size >= this.options.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    const compressed = this.options.enableCompression 
      ? this.compressTheme(theme)
      : theme;

    this.cache.set(key, {
      data: compressed,
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  /**
   * Retrieve theme from cache
   */
  getCachedTheme(key: string): Theme | null {
    if (!this.options.enableCaching) return null;

    const cached = this.cache.get(key);
    if (!cached) {
      this.cacheStats.misses++;
      return null;
    }

    // Update access statistics
    cached.accessCount++;
    cached.timestamp = Date.now();
    this.cacheStats.hits++;

    // Update cache hit rate
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.metrics.cacheHitRate = this.cacheStats.hits / total;

    const theme = this.options.enableCompression 
      ? this.decompressTheme(cached.data)
      : cached.data;

    return theme;
  }

  /**
   * Evict least recently used cache entries
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Compress theme data for storage efficiency
   */
  private compressTheme(theme: Theme): string {
    try {
      // Simple compression by removing whitespace and using shorter keys
      const compressed = {
        i: theme.id,
        n: theme.name,
        c: this.compressColors(theme.colors),
        g: this.compressGradients(theme.gradients),
        t: this.compressTypography(theme.typography),
        e: this.compressEffects(theme.effects),
        m: {
          n: theme.metadata.name,
          d: theme.metadata.description,
          a: theme.metadata.author,
          v: theme.metadata.version,
          c: theme.metadata.createdAt,
          u: theme.metadata.updatedAt,
          t: theme.metadata.tags
        }
      };

      return JSON.stringify(compressed);
    } catch (error) {
      console.warn('Theme compression failed, using original:', error);
      return JSON.stringify(theme);
    }
  }

  /**
   * Decompress theme data
   */
  private decompressTheme(compressed: string | Theme): Theme {
    if (typeof compressed !== 'string') {
      return compressed; // Already decompressed
    }

    try {
      const parsed = JSON.parse(compressed);
      
      // Check if it's compressed format
      if (parsed.i && parsed.n && parsed.c) {
        return {
          id: parsed.i,
          name: parsed.n,
          colors: this.decompressColors(parsed.c),
          gradients: this.decompressGradients(parsed.g),
          typography: this.decompressTypography(parsed.t),
          effects: this.decompressEffects(parsed.e),
          metadata: {
            name: parsed.m.n,
            description: parsed.m.d,
            author: parsed.m.a,
            version: parsed.m.v,
            createdAt: parsed.m.c,
            updatedAt: parsed.m.u,
            tags: parsed.m.t
          }
        };
      }

      // Not compressed, return as-is
      return parsed;
    } catch (error) {
      console.error('Theme decompression failed:', error);
      throw new Error('Invalid theme data');
    }
  }

  /**
   * Compress color palette
   */
  private compressColors(colors: any): any {
    return {
      p: colors.primary,
      s: colors.secondary,
      a: colors.accent,
      n: colors.neutral,
      sem: colors.semantic
    };
  }

  /**
   * Decompress color palette
   */
  private decompressColors(compressed: any): any {
    return {
      primary: compressed.p,
      secondary: compressed.s,
      accent: compressed.a,
      neutral: compressed.n,
      semantic: compressed.sem
    };
  }

  /**
   * Compress gradients
   */
  private compressGradients(gradients: any): any {
    const compressed: any = {};
    Object.entries(gradients).forEach(([key, gradient]: [string, any]) => {
      compressed[key] = {
        n: gradient.name,
        d: gradient.direction,
        s: gradient.colorStops.map((stop: any) => [stop.color, stop.position]),
        u: gradient.usage
      };
    });
    return compressed;
  }

  /**
   * Decompress gradients
   */
  private decompressGradients(compressed: any): any {
    const gradients: any = {};
    Object.entries(compressed).forEach(([key, gradient]: [string, any]) => {
      gradients[key] = {
        name: gradient.n,
        direction: gradient.d,
        colorStops: gradient.s.map(([color, position]: [string, number]) => ({
          color,
          position
        })),
        usage: gradient.u
      };
    });
    return gradients;
  }

  /**
   * Compress typography
   */
  private compressTypography(typography: any): any {
    return {
      ff: typography.fontFamily,
      fs: typography.fontSize,
      fw: typography.fontWeight,
      lh: typography.lineHeight
    };
  }

  /**
   * Decompress typography
   */
  private decompressTypography(compressed: any): any {
    return {
      fontFamily: compressed.ff,
      fontSize: compressed.fs,
      fontWeight: compressed.fw,
      lineHeight: compressed.lh
    };
  }

  /**
   * Compress effects
   */
  private compressEffects(effects: any): any {
    return {
      bb: effects.backdropBlur,
      bs: effects.boxShadow,
      br: effects.borderRadius
    };
  }

  /**
   * Decompress effects
   */
  private decompressEffects(compressed: any): any {
    return {
      backdropBlur: compressed.bb,
      boxShadow: compressed.bs,
      borderRadius: compressed.br
    };
  }

  /**
   * Lazy load theme assets
   */
  async lazyLoadTheme(themeId: string, loader: () => Promise<Theme>): Promise<Theme> {
    if (!this.options.enableLazyLoading) {
      return loader();
    }

    const startTime = performance.now();

    // Check cache first
    const cached = this.getCachedTheme(themeId);
    if (cached) {
      this.metrics.themeLoadTime = performance.now() - startTime;
      return cached;
    }

    try {
      // Load theme asynchronously
      const theme = await loader();
      
      // Cache the loaded theme
      this.cacheTheme(themeId, theme);
      
      this.metrics.themeLoadTime = performance.now() - startTime;
      return theme;
    } catch (error) {
      console.error(`Failed to lazy load theme ${themeId}:`, error);
      throw error;
    }
  }

  /**
   * Preload themes for better performance
   */
  async preloadThemes(themeIds: string[], loader: (id: string) => Promise<Theme>): Promise<void> {
    if (!this.options.enablePreloading) return;

    const preloadPromises = themeIds.map(async (themeId) => {
      try {
        // Only preload if not already cached
        if (!this.getCachedTheme(themeId)) {
          const theme = await loader(themeId);
          this.cacheTheme(themeId, theme);
        }
      } catch (error) {
        console.warn(`Failed to preload theme ${themeId}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Optimize preview rendering with debouncing
   */
  optimizePreviewRender(renderFn: () => void, delay: number = 100): void {
    const startTime = performance.now();
    
    // Debounce preview updates
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      try {
        renderFn();
        this.metrics.previewRenderTime = performance.now() - startTime;
      } catch (error) {
        console.error('Preview render error:', error);
      }
    }, delay);
  }

  /**
   * Monitor memory usage
   */
  updateMemoryMetrics(): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    this.updateMemoryMetrics();
    return { ...this.metrics };
  }

  /**
   * Clear cache and reset metrics
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheStats = { hits: 0, misses: 0 };
    this.metrics.cacheHitRate = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.options.maxCacheSize,
      hitRate: this.metrics.cacheHitRate,
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses
    };
  }

  /**
   * Optimize CSS variable injection for better performance
   */
  optimizedCSSVariableInjection(variables: Record<string, string>): void {
    if (typeof window === 'undefined') return;

    this.optimizeCSSUpdates(() => {
      const root = document.documentElement;
      const fragment = document.createDocumentFragment();
      
      // Create a temporary style element for batch updates
      const tempStyle = document.createElement('style');
      
      // Build CSS rule string
      const cssRules = Object.entries(variables)
        .map(([property, value]) => `${property}: ${value};`)
        .join('\n');
      
      tempStyle.textContent = `:root { ${cssRules} }`;
      
      // Apply all variables at once
      fragment.appendChild(tempStyle);
      document.head.appendChild(fragment);
      
      // Remove temporary style after applying
      setTimeout(() => {
        if (tempStyle.parentNode) {
          tempStyle.parentNode.removeChild(tempStyle);
        }
      }, 0);
    });
  }

  /**
   * Create performance monitoring dashboard data
   */
  getPerformanceDashboard() {
    const metrics = this.getMetrics();
    const cacheStats = this.getCacheStats();
    
    return {
      performance: {
        cssUpdateTime: `${metrics.cssUpdateTime.toFixed(2)}ms`,
        themeLoadTime: `${metrics.themeLoadTime.toFixed(2)}ms`,
        previewRenderTime: `${metrics.previewRenderTime.toFixed(2)}ms`,
        memoryUsage: `${(metrics.memoryUsage * 100).toFixed(1)}%`
      },
      cache: {
        hitRate: `${(cacheStats.hitRate * 100).toFixed(1)}%`,
        size: `${cacheStats.size}/${cacheStats.maxSize}`,
        efficiency: cacheStats.hitRate > 0.8 ? 'Excellent' : 
                   cacheStats.hitRate > 0.6 ? 'Good' : 
                   cacheStats.hitRate > 0.4 ? 'Fair' : 'Poor'
      },
      recommendations: this.getPerformanceRecommendations(metrics, cacheStats)
    };
  }

  /**
   * Get performance recommendations
   */
  private getPerformanceRecommendations(metrics: PerformanceMetrics, cacheStats: any): string[] {
    const recommendations: string[] = [];

    if (metrics.cssUpdateTime > 50) {
      recommendations.push('Consider reducing CSS variable updates frequency');
    }

    if (metrics.themeLoadTime > 200) {
      recommendations.push('Enable theme preloading for better performance');
    }

    if (metrics.previewRenderTime > 100) {
      recommendations.push('Optimize preview rendering with smaller preview components');
    }

    if (metrics.memoryUsage > 0.8) {
      recommendations.push('Clear theme cache to reduce memory usage');
    }

    if (cacheStats.hitRate < 0.5) {
      recommendations.push('Increase cache size or enable preloading');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal');
    }

    return recommendations;
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();