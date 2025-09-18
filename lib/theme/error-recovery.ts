// Enhanced error handling and recovery system for theme management
import { Theme } from './types';
import { themeCache } from './theme-cache';
import { performanceOptimizer } from './performance-optimizer';

export interface ErrorContext {
  operation: string;
  themeId?: string;
  timestamp: number;
  userAgent?: string;
  url?: string;
  stackTrace?: string;
}

export interface RecoveryStrategy {
  name: string;
  priority: number;
  canRecover: (error: ThemeError) => boolean;
  recover: (error: ThemeError) => Promise<Theme | null>;
}

export interface ThemeError extends Error {
  code: string;
  context: ErrorContext;
  recoverable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorStats {
  totalErrors: number;
  recoveredErrors: number;
  criticalErrors: number;
  errorsByType: Record<string, number>;
  recoveryRate: number;
}

export class ErrorRecoverySystem {
  private errorLog: ThemeError[] = [];
  private recoveryStrategies: RecoveryStrategy[] = [];
  private fallbackThemes: Map<string, Theme> = new Map();
  private stats: ErrorStats = {
    totalErrors: 0,
    recoveredErrors: 0,
    criticalErrors: 0,
    errorsByType: {},
    recoveryRate: 0
  };

  constructor() {
    this.initializeRecoveryStrategies();
    this.initializeFallbackThemes();
    this.setupGlobalErrorHandling();
  }

  /**
   * Initialize recovery strategies
   */
  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies = [
      {
        name: 'cache-recovery',
        priority: 1,
        canRecover: (error) => error.code === 'THEME_LOAD_FAILED' && error.context.themeId !== undefined,
        recover: async (error) => {
          if (error.context.themeId) {
            return themeCache.get(error.context.themeId);
          }
          return null;
        }
      },
      {
        name: 'fallback-theme',
        priority: 2,
        canRecover: (error) => ['THEME_LOAD_FAILED', 'THEME_VALIDATION_FAILED', 'CSS_APPLICATION_FAILED'].includes(error.code),
        recover: async (error) => {
          const fallbackId = error.context.themeId || 'default';
          return this.fallbackThemes.get(fallbackId) || this.getDefaultFallbackTheme();
        }
      },
      {
        name: 'theme-regeneration',
        priority: 3,
        canRecover: (error) => error.code === 'THEME_CORRUPTION',
        recover: async (error) => {
          if (error.context.themeId) {
            return this.regenerateThemeFromDefaults(error.context.themeId);
          }
          return null;
        }
      },
      {
        name: 'css-reset',
        priority: 4,
        canRecover: (error) => error.code === 'CSS_APPLICATION_FAILED',
        recover: async (error) => {
          this.resetCSSVariables();
          return this.getDefaultFallbackTheme();
        }
      },
      {
        name: 'storage-recovery',
        priority: 5,
        canRecover: (error) => error.code === 'STORAGE_FAILED',
        recover: async (error) => {
          this.clearCorruptedStorage();
          return this.getDefaultFallbackTheme();
        }
      }
    ];

    // Sort by priority
    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Initialize fallback themes
   */
  private initializeFallbackThemes(): void {
    // Default professional theme as ultimate fallback
    const defaultTheme: Theme = {
      id: 'emergency-fallback',
      name: 'Emergency Fallback Theme',
      colors: {
        primary: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 400: '#34d399',
          500: '#10b981', 600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b'
        },
        secondary: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf',
          500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a'
        },
        accent: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
          500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
        },
        neutral: {
          50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af',
          500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827'
        },
        semantic: {
          success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6'
        }
      },
      gradients: {
        hero: {
          name: 'Hero Gradient', direction: '135deg',
          colorStops: [
            { color: '#064e3b', position: 0 },
            { color: '#115e59', position: 50 },
            { color: '#1e3a8a', position: 100 }
          ],
          usage: 'hero'
        },
        card: {
          name: 'Card Gradient', direction: '135deg',
          colorStops: [
            { color: '#10b981', position: 0 },
            { color: '#0d9488', position: 100 }
          ],
          usage: 'card'
        },
        button: {
          name: 'Button Gradient', direction: '135deg',
          colorStops: [
            { color: '#10b981', position: 0 },
            { color: '#0d9488', position: 100 }
          ],
          usage: 'button'
        },
        background: {
          name: 'Background Gradient', direction: '135deg',
          colorStops: [
            { color: '#f9fafb', position: 0 },
            { color: '#ecfdf5', position: 100 }
          ],
          usage: 'background'
        },
        accent: {
          name: 'Accent Gradient', direction: '135deg',
          colorStops: [
            { color: '#ecfdf5', position: 0 },
            { color: '#ccfbf1', position: 100 }
          ],
          usage: 'accent'
        }
      },
      typography: {
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          serif: ['Georgia', 'serif'],
          mono: ['Menlo', 'Monaco', 'Consolas', 'monospace']
        },
        fontSize: {
          xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem',
          '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem', '5xl': '3rem', '6xl': '3.75rem'
        },
        fontWeight: {
          thin: '100', light: '300', normal: '400', medium: '500', semibold: '600',
          bold: '700', extrabold: '800', black: '900'
        },
        lineHeight: {
          none: '1', tight: '1.25', snug: '1.375', normal: '1.5', relaxed: '1.625', loose: '2'
        }
      },
      effects: {
        backdropBlur: {
          sm: 'blur(4px)', md: 'blur(12px)', lg: 'blur(16px)', xl: 'blur(24px)'
        },
        boxShadow: {
          card: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          button: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          hero: '0 20px 25px -5px rgba(16, 185, 129, 0.1)'
        },
        borderRadius: {
          sm: '0.375rem', md: '0.5rem', lg: '0.75rem', xl: '1.5rem', full: '9999px'
        }
      },
      metadata: {
        name: 'Emergency Fallback Theme',
        description: 'Safe fallback theme for error recovery',
        author: 'Theme System',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['fallback', 'emergency', 'safe']
      }
    };

    this.fallbackThemes.set('default', defaultTheme);
    this.fallbackThemes.set('emergency-fallback', defaultTheme);
  }

  /**
   * Setup global error handling
   */
  private setupGlobalErrorHandling(): void {
    if (typeof window === 'undefined') return;

    // Catch unhandled theme-related errors
    window.addEventListener('error', (event) => {
      if (this.isThemeRelatedError(event.error)) {
        this.handleError(event.error);
      }
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isThemeRelatedError(event.reason)) {
        this.handleError(event.reason);
        event.preventDefault(); // Prevent console error
      }
    });
  }

  /**
   * Check if error is theme-related
   */
  private isThemeRelatedError(error: any): boolean {
    if (!error) return false;
    
    const themeKeywords = ['theme', 'css', 'variable', 'gradient', 'color', 'style'];
    const errorMessage = error.message?.toLowerCase() || '';
    const errorStack = error.stack?.toLowerCase() || '';
    
    return themeKeywords.some(keyword => 
      errorMessage.includes(keyword) || errorStack.includes(keyword)
    );
  }

  /**
   * Create theme error with context
   */
  createError(
    message: string,
    code: string,
    context: Partial<ErrorContext>,
    severity: ThemeError['severity'] = 'medium'
  ): ThemeError {
    const error = new Error(message) as ThemeError;
    error.code = code;
    error.severity = severity;
    error.recoverable = severity !== 'critical';
    error.context = {
      operation: 'unknown',
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      stackTrace: error.stack,
      ...context
    };

    return error;
  }

  /**
   * Handle theme error with recovery
   */
  async handleError(error: Error | ThemeError): Promise<Theme | null> {
    let themeError: ThemeError;

    if ('code' in error && 'context' in error) {
      themeError = error as ThemeError;
    } else {
      // Convert regular error to theme error
      themeError = this.createError(
        error.message,
        'UNKNOWN_ERROR',
        { operation: 'error-conversion' },
        'medium'
      );
    }

    // Log error
    this.logError(themeError);

    // Update statistics
    this.updateErrorStats(themeError);

    // Attempt recovery if error is recoverable
    if (themeError.recoverable) {
      return this.attemptRecovery(themeError);
    }

    // For critical errors, use emergency fallback
    if (themeError.severity === 'critical') {
      return this.getDefaultFallbackTheme();
    }

    return null;
  }

  /**
   * Attempt error recovery using strategies
   */
  private async attemptRecovery(error: ThemeError): Promise<Theme | null> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        try {
          const recoveredTheme = await strategy.recover(error);
          
          if (recoveredTheme) {
            this.stats.recoveredErrors++;
            this.updateRecoveryRate();
            
            this.logRecovery(error, strategy.name);
            return recoveredTheme;
          }
        } catch (recoveryError) {
          console.warn(`Recovery strategy ${strategy.name} failed:`, recoveryError);
        }
      }
    }

    // If all strategies fail, use fallback
    return this.getDefaultFallbackTheme();
  }

  /**
   * Log error for debugging and monitoring
   */
  private logError(error: ThemeError): void {
    this.errorLog.push(error);
    
    // Keep only last 100 errors to prevent memory leaks
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Log to console based on severity
    switch (error.severity) {
      case 'critical':
        console.error('Critical theme error:', error);
        break;
      case 'high':
        console.error('High severity theme error:', error);
        break;
      case 'medium':
        console.warn('Theme error:', error);
        break;
      case 'low':
        console.info('Minor theme issue:', error);
        break;
    }
  }

  /**
   * Log successful recovery
   */
  private logRecovery(error: ThemeError, strategyName: string): void {
    console.info(`Theme error recovered using ${strategyName}:`, {
      error: error.code,
      context: error.context.operation,
      strategy: strategyName
    });
  }

  /**
   * Update error statistics
   */
  private updateErrorStats(error: ThemeError): void {
    this.stats.totalErrors++;
    
    if (error.severity === 'critical') {
      this.stats.criticalErrors++;
    }

    // Update error type counts
    if (!this.stats.errorsByType[error.code]) {
      this.stats.errorsByType[error.code] = 0;
    }
    this.stats.errorsByType[error.code]++;

    this.updateRecoveryRate();
  }

  /**
   * Update recovery rate
   */
  private updateRecoveryRate(): void {
    this.stats.recoveryRate = this.stats.totalErrors > 0 
      ? this.stats.recoveredErrors / this.stats.totalErrors 
      : 0;
  }

  /**
   * Get default fallback theme
   */
  private getDefaultFallbackTheme(): Theme {
    return this.fallbackThemes.get('default')!;
  }

  /**
   * Regenerate theme from defaults
   */
  private async regenerateThemeFromDefaults(themeId: string): Promise<Theme> {
    const defaultTheme = this.getDefaultFallbackTheme();
    
    // Create a new theme based on default with original ID
    const regeneratedTheme: Theme = {
      ...defaultTheme,
      id: themeId,
      name: `Recovered ${themeId}`,
      metadata: {
        ...defaultTheme.metadata,
        name: `Recovered ${themeId}`,
        description: 'Theme regenerated from defaults after corruption',
        updatedAt: new Date().toISOString(),
        tags: [...defaultTheme.metadata.tags, 'recovered']
      }
    };

    return regeneratedTheme;
  }

  /**
   * Reset CSS variables to safe defaults
   */
  private resetCSSVariables(): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const safeDefaults = {
      '--theme-primary-500': '#10b981',
      '--theme-secondary-500': '#14b8a6',
      '--theme-accent-500': '#3b82f6',
      '--theme-gradient-hero': 'linear-gradient(135deg, #064e3b 0%, #115e59 50%, #1e3a8a 100%)',
      '--theme-gradient-card': 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
      '--theme-backdrop-blur-md': 'blur(12px)',
      '--theme-shadow-card': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '--theme-radius-xl': '1.5rem'
    };

    Object.entries(safeDefaults).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  /**
   * Clear corrupted storage
   */
  private clearCorruptedStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // Clear theme-related localStorage entries
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('theme') || key.includes('kiro-theme'))) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove corrupted storage key ${key}:`, error);
        }
      });

      // Clear theme cache
      themeCache.clear();
      
    } catch (error) {
      console.error('Failed to clear corrupted storage:', error);
    }
  }

  /**
   * Add custom recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy): void {
    this.recoveryStrategies.push(strategy);
    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Add fallback theme
   */
  addFallbackTheme(id: string, theme: Theme): void {
    this.fallbackThemes.set(id, theme);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): ErrorStats {
    return { ...this.stats };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ThemeError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Get error report
   */
  getErrorReport(): {
    stats: ErrorStats;
    recentErrors: ThemeError[];
    topErrors: Array<{ code: string; count: number }>;
    recoveryStrategies: Array<{ name: string; priority: number }>;
  } {
    const topErrors = Object.entries(this.stats.errorsByType)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      stats: this.getErrorStats(),
      recentErrors: this.getRecentErrors(),
      topErrors,
      recoveryStrategies: this.recoveryStrategies.map(s => ({
        name: s.name,
        priority: s.priority
      }))
    };
  }

  /**
   * Test recovery system
   */
  async testRecovery(): Promise<boolean> {
    try {
      // Create test error
      const testError = this.createError(
        'Test error for recovery system',
        'TEST_ERROR',
        { operation: 'recovery-test' },
        'low'
      );

      // Attempt recovery
      const recovered = await this.handleError(testError);
      
      return recovered !== null;
    } catch (error) {
      console.error('Recovery system test failed:', error);
      return false;
    }
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
    this.stats = {
      totalErrors: 0,
      recoveredErrors: 0,
      criticalErrors: 0,
      errorsByType: {},
      recoveryRate: 0
    };
  }
}

// Export singleton instance
export const errorRecoverySystem = new ErrorRecoverySystem();