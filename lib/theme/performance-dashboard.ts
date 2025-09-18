// Performance monitoring dashboard for theme management system
import { performanceOptimizer } from './performance-optimizer';
import { themeCache } from './theme-cache';
import { errorRecoverySystem } from './error-recovery';

export interface PerformanceDashboardData {
  overview: {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    lastUpdated: string;
  };
  metrics: {
    cssUpdateTime: string;
    themeLoadTime: string;
    previewRenderTime: string;
    memoryUsage: string;
  };
  cache: {
    hitRate: string;
    size: string;
    memoryUsage: string;
    efficiency: string;
    topThemes: Array<{ id: string; accessCount: number; size: string }>;
  };
  errors: {
    totalErrors: number;
    recoveryRate: string;
    criticalErrors: number;
    recentErrors: Array<{ code: string; timestamp: string; severity: string }>;
  };
  recommendations: string[];
  optimizations: {
    batchingEnabled: boolean;
    cachingEnabled: boolean;
    compressionEnabled: boolean;
    lazyLoadingEnabled: boolean;
  };
}

export class PerformanceDashboard {
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(data: PerformanceDashboardData) => void> = [];

  constructor() {
    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updateDashboard();
    }, intervalMs);
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get current dashboard data
   */
  getDashboardData(): PerformanceDashboardData {
    const performanceMetrics = performanceOptimizer.getMetrics();
    const cacheStats = themeCache.getStats();
    const errorStats = errorRecoverySystem.getErrorStats();
    const cacheEntries = themeCache.getEntriesByPriority();
    const recentErrors = errorRecoverySystem.getRecentErrors(5);

    // Calculate overall performance score
    const score = this.calculatePerformanceScore(performanceMetrics, cacheStats, errorStats);
    const status = this.getPerformanceStatus(score);

    // Get top themes by access count
    const topThemes = cacheEntries
      .slice(0, 5)
      .map(({ id, entry }) => ({
        id,
        accessCount: entry.accessCount,
        size: this.formatBytes(entry.size)
      }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(performanceMetrics, cacheStats, errorStats);

    return {
      overview: {
        status,
        score,
        lastUpdated: new Date().toISOString()
      },
      metrics: {
        cssUpdateTime: `${performanceMetrics.cssUpdateTime.toFixed(2)}ms`,
        themeLoadTime: `${performanceMetrics.themeLoadTime.toFixed(2)}ms`,
        previewRenderTime: `${performanceMetrics.previewRenderTime.toFixed(2)}ms`,
        memoryUsage: `${(performanceMetrics.memoryUsage * 100).toFixed(1)}%`
      },
      cache: {
        hitRate: `${(cacheStats.hitRate * 100).toFixed(1)}%`,
        size: `${cacheStats.size} themes`,
        memoryUsage: this.formatBytes(cacheStats.memoryUsage),
        efficiency: this.getCacheEfficiency(cacheStats.hitRate),
        topThemes
      },
      errors: {
        totalErrors: errorStats.totalErrors,
        recoveryRate: `${(errorStats.recoveryRate * 100).toFixed(1)}%`,
        criticalErrors: errorStats.criticalErrors,
        recentErrors: recentErrors.map(error => ({
          code: error.code,
          timestamp: new Date(error.context.timestamp).toLocaleTimeString(),
          severity: error.severity
        }))
      },
      recommendations,
      optimizations: {
        batchingEnabled: true, // These would come from actual config
        cachingEnabled: true,
        compressionEnabled: true,
        lazyLoadingEnabled: true
      }
    };
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculatePerformanceScore(
    metrics: any,
    cacheStats: any,
    errorStats: any
  ): number {
    let score = 100;

    // CSS update time penalty (target: <20ms)
    if (metrics.cssUpdateTime > 50) score -= 20;
    else if (metrics.cssUpdateTime > 20) score -= 10;

    // Theme load time penalty (target: <100ms)
    if (metrics.themeLoadTime > 200) score -= 15;
    else if (metrics.themeLoadTime > 100) score -= 8;

    // Preview render time penalty (target: <50ms)
    if (metrics.previewRenderTime > 100) score -= 15;
    else if (metrics.previewRenderTime > 50) score -= 8;

    // Memory usage penalty (target: <70%)
    if (metrics.memoryUsage > 0.9) score -= 20;
    else if (metrics.memoryUsage > 0.7) score -= 10;

    // Cache hit rate bonus/penalty (target: >80%)
    if (cacheStats.hitRate > 0.8) score += 5;
    else if (cacheStats.hitRate < 0.5) score -= 15;

    // Error rate penalty
    if (errorStats.recoveryRate < 0.8 && errorStats.totalErrors > 0) score -= 10;
    if (errorStats.criticalErrors > 0) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get performance status based on score
   */
  private getPerformanceStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Get cache efficiency description
   */
  private getCacheEfficiency(hitRate: number): string {
    if (hitRate > 0.9) return 'Excellent';
    if (hitRate > 0.8) return 'Very Good';
    if (hitRate > 0.7) return 'Good';
    if (hitRate > 0.6) return 'Fair';
    if (hitRate > 0.4) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    metrics: any,
    cacheStats: any,
    errorStats: any
  ): string[] {
    const recommendations: string[] = [];

    // CSS performance recommendations
    if (metrics.cssUpdateTime > 50) {
      recommendations.push('Enable CSS variable batching to reduce update frequency');
    }

    // Theme loading recommendations
    if (metrics.themeLoadTime > 200) {
      recommendations.push('Enable theme preloading for frequently used themes');
    }

    // Preview performance recommendations
    if (metrics.previewRenderTime > 100) {
      recommendations.push('Optimize preview components or reduce preview complexity');
    }

    // Memory recommendations
    if (metrics.memoryUsage > 0.8) {
      recommendations.push('Clear theme cache or reduce cache size to free memory');
    }

    // Cache recommendations
    if (cacheStats.hitRate < 0.6) {
      recommendations.push('Increase cache size or enable theme preloading');
    }

    if (cacheStats.size === 0) {
      recommendations.push('Enable theme caching for better performance');
    }

    // Error recommendations
    if (errorStats.criticalErrors > 0) {
      recommendations.push('Review and fix critical theme errors immediately');
    }

    if (errorStats.recoveryRate < 0.8 && errorStats.totalErrors > 0) {
      recommendations.push('Improve error recovery strategies or add more fallback themes');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal - no immediate actions needed');
    }

    return recommendations;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Update dashboard and notify listeners
   */
  private updateDashboard(): void {
    const data = this.getDashboardData();
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Dashboard listener error:', error);
      }
    });
  }

  /**
   * Subscribe to dashboard updates
   */
  subscribe(listener: (data: PerformanceDashboardData) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get performance report for debugging
   */
  getPerformanceReport(): {
    dashboard: PerformanceDashboardData;
    detailed: {
      performanceMetrics: any;
      cacheStats: any;
      errorReport: any;
      memoryBreakdown: any;
    };
  } {
    const dashboard = this.getDashboardData();
    
    return {
      dashboard,
      detailed: {
        performanceMetrics: performanceOptimizer.getMetrics(),
        cacheStats: themeCache.getStats(),
        errorReport: errorRecoverySystem.getErrorReport(),
        memoryBreakdown: themeCache.getMemoryBreakdown()
      }
    };
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): string {
    const report = this.getPerformanceReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Run performance benchmark
   */
  async runBenchmark(): Promise<{
    cssUpdateBenchmark: number;
    cacheAccessBenchmark: number;
    themeLoadBenchmark: number;
    overallScore: number;
  }> {
    const results = {
      cssUpdateBenchmark: 0,
      cacheAccessBenchmark: 0,
      themeLoadBenchmark: 0,
      overallScore: 0
    };

    try {
      // CSS Update Benchmark
      const cssStart = performance.now();
      const testVariables = {
        '--test-color-1': '#ff0000',
        '--test-color-2': '#00ff00',
        '--test-color-3': '#0000ff'
      };
      
      for (let i = 0; i < 100; i++) {
        performanceOptimizer.optimizedCSSVariableInjection(testVariables);
      }
      
      results.cssUpdateBenchmark = performance.now() - cssStart;

      // Cache Access Benchmark
      const cacheStart = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        themeCache.get('test-theme-' + (i % 10));
      }
      
      results.cacheAccessBenchmark = performance.now() - cacheStart;

      // Calculate overall score
      results.overallScore = Math.max(0, 100 - (
        (results.cssUpdateBenchmark / 10) +
        (results.cacheAccessBenchmark / 5)
      ));

    } catch (error) {
      console.error('Benchmark failed:', error);
    }

    return results;
  }

  /**
   * Optimize system based on current performance
   */
  async optimizeSystem(): Promise<{
    optimizationsApplied: string[];
    performanceImprovement: number;
  }> {
    const beforeScore = this.getDashboardData().overview.score;
    const optimizations: string[] = [];

    try {
      // Optimize cache
      themeCache.optimize();
      optimizations.push('Cache optimization');

      // Clear performance optimizer cache if memory usage is high
      const metrics = performanceOptimizer.getMetrics();
      if (metrics.memoryUsage > 0.8) {
        performanceOptimizer.clearCache();
        optimizations.push('Memory cleanup');
      }

      // Test error recovery system
      const recoveryWorking = await errorRecoverySystem.testRecovery();
      if (!recoveryWorking) {
        optimizations.push('Error recovery system check (failed)');
      }

      // Wait a moment for optimizations to take effect
      await new Promise(resolve => setTimeout(resolve, 1000));

      const afterScore = this.getDashboardData().overview.score;
      const improvement = afterScore - beforeScore;

      return {
        optimizationsApplied: optimizations,
        performanceImprovement: improvement
      };

    } catch (error) {
      console.error('System optimization failed:', error);
      return {
        optimizationsApplied: ['Optimization failed'],
        performanceImprovement: 0
      };
    }
  }

  /**
   * Destroy dashboard and cleanup
   */
  destroy(): void {
    this.stopMonitoring();
    this.listeners = [];
  }
}

// Export singleton instance
export const performanceDashboard = new PerformanceDashboard();