// Theme system error handling and fallback mechanisms
import { Theme, ValidationError } from './types';
import { themeExtractor } from './extractor';

export interface ThemeError extends Error {
  code: string;
  field?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  fallbackAction?: string;
}

export interface ErrorRecoveryOptions {
  useDefaultTheme?: boolean;
  preservePartialTheme?: boolean;
  logErrors?: boolean;
  notifyUser?: boolean;
}

export interface FallbackStrategy {
  name: string;
  description: string;
  execute: (theme: Theme, error: ThemeError) => Theme;
  canRecover: (error: ThemeError) => boolean;
}

export class ThemeErrorHandler {
  private fallbackStrategies: Map<string, FallbackStrategy> = new Map();
  private errorLog: ThemeError[] = [];
  private defaultTheme: Theme;
  private maxErrorLogSize = 100;

  constructor() {
    this.defaultTheme = themeExtractor.generateDefaultTheme();
    this.initializeFallbackStrategies();
  }

  /**
   * Initialize built-in fallback strategies
   */
  private initializeFallbackStrategies(): void {
    // Strategy 1: Use default theme
    this.registerFallbackStrategy({
      name: 'default-theme',
      description: 'Fall back to the default theme',
      execute: () => this.defaultTheme,
      canRecover: () => true
    });

    // Strategy 2: Fix invalid colors
    this.registerFallbackStrategy({
      name: 'fix-colors',
      description: 'Replace invalid colors with default equivalents',
      execute: (theme, error) => this.fixInvalidColors(theme, error),
      canRecover: (error) => error.field?.includes('colors') || false
    });

    // Strategy 3: Fix invalid gradients
    this.registerFallbackStrategy({
      name: 'fix-gradients',
      description: 'Replace invalid gradients with default equivalents',
      execute: (theme, error) => this.fixInvalidGradients(theme, error),
      canRecover: (error) => error.field?.includes('gradients') || false
    });

    // Strategy 4: Fix invalid effects
    this.registerFallbackStrategy({
      name: 'fix-effects',
      description: 'Replace invalid effects with default equivalents',
      execute: (theme, error) => this.fixInvalidEffects(theme, error),
      canRecover: (error) => error.field?.includes('effects') || false
    });

    // Strategy 5: Merge with default
    this.registerFallbackStrategy({
      name: 'merge-default',
      description: 'Merge theme with default values for missing fields',
      execute: (theme) => this.mergeWithDefault(theme),
      canRecover: (error) => error.field?.includes('missing') || error.code === 'INCOMPLETE_THEME'
    });
  }

  /**
   * Register a custom fallback strategy
   */
  registerFallbackStrategy(strategy: FallbackStrategy): void {
    this.fallbackStrategies.set(strategy.name, strategy);
  }

  /**
   * Handle theme errors with automatic recovery
   */
  handleThemeError(
    theme: Theme, 
    error: Error | ValidationError[], 
    options: ErrorRecoveryOptions = {}
  ): { theme: Theme; recovered: boolean; errors: ThemeError[] } {
    const errors = this.normalizeErrors(error);
    const recoveredTheme = this.attemptRecovery(theme, errors, options);
    
    // Log errors if requested
    if (options.logErrors !== false) {
      this.logErrors(errors);
    }

    // Notify user if requested
    if (options.notifyUser && typeof window !== 'undefined') {
      this.notifyUser(errors);
    }

    return {
      theme: recoveredTheme.theme,
      recovered: recoveredTheme.recovered,
      errors
    };
  }

  /**
   * Attempt to recover from theme errors
   */
  private attemptRecovery(
    theme: Theme, 
    errors: ThemeError[], 
    options: ErrorRecoveryOptions
  ): { theme: Theme; recovered: boolean } {
    let currentTheme = { ...theme };
    let recovered = false;

    // Sort errors by severity (critical first)
    const sortedErrors = errors.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    for (const error of sortedErrors) {
      if (!error.recoverable) {
        // For non-recoverable errors, use default theme if allowed
        if (options.useDefaultTheme !== false) {
          return { theme: this.defaultTheme, recovered: true };
        }
        continue;
      }

      // Try each applicable fallback strategy
      for (const [, strategy] of this.fallbackStrategies) {
        if (strategy.canRecover(error)) {
          try {
            currentTheme = strategy.execute(currentTheme, error);
            recovered = true;
            error.fallbackAction = strategy.name;
            break;
          } catch (strategyError) {
            console.warn(`Fallback strategy '${strategy.name}' failed:`, strategyError);
          }
        }
      }
    }

    // If no recovery was possible and preservePartialTheme is false, use default
    if (!recovered && options.preservePartialTheme === false) {
      return { theme: this.defaultTheme, recovered: true };
    }

    return { theme: currentTheme, recovered };
  }

  /**
   * Normalize different error types to ThemeError[]
   */
  private normalizeErrors(error: Error | ValidationError[]): ThemeError[] {
    if (Array.isArray(error)) {
      return error.map(validationError => this.validationErrorToThemeError(validationError));
    }

    if (error instanceof Error) {
      return [this.errorToThemeError(error)];
    }

    return [];
  }

  /**
   * Convert ValidationError to ThemeError
   */
  private validationErrorToThemeError(validationError: ValidationError): ThemeError {
    const themeError = new Error(validationError.message) as ThemeError;
    themeError.code = 'VALIDATION_ERROR';
    themeError.field = validationError.field;
    themeError.severity = validationError.severity === 'error' ? 'high' : 'medium';
    themeError.recoverable = true;
    
    return themeError;
  }

  /**
   * Convert generic Error to ThemeError
   */
  private errorToThemeError(error: Error): ThemeError {
    const themeError = error as ThemeError;
    themeError.code = themeError.code || 'UNKNOWN_ERROR';
    themeError.severity = themeError.severity || 'medium';
    themeError.recoverable = themeError.recoverable !== false;
    
    return themeError;
  }

  /**
   * Fix invalid colors by replacing with default equivalents
   */
  private fixInvalidColors(theme: Theme, error: ThemeError): Theme {
    const fixedTheme = { ...theme };
    
    if (!error.field) return fixedTheme;

    const fieldPath = error.field.split('.');
    
    if (fieldPath[0] === 'colors' && fieldPath[1] && fieldPath[2]) {
      const scale = fieldPath[1];
      const shade = fieldPath[2];
      
      // Replace with default color
      if (this.defaultTheme.colors[scale as keyof typeof this.defaultTheme.colors]) {
        const defaultScale = this.defaultTheme.colors[scale as keyof typeof this.defaultTheme.colors] as any;
        if (defaultScale[shade]) {
          if (!fixedTheme.colors[scale as keyof typeof fixedTheme.colors]) {
            (fixedTheme.colors as any)[scale] = {};
          }
          ((fixedTheme.colors as any)[scale] as any)[shade] = defaultScale[shade];
        }
      }
    }

    return fixedTheme;
  }

  /**
   * Fix invalid gradients by replacing with default equivalents
   */
  private fixInvalidGradients(theme: Theme, error: ThemeError): Theme {
    const fixedTheme = { ...theme };
    
    if (!error.field) return fixedTheme;

    const fieldPath = error.field.split('.');
    
    if (fieldPath[0] === 'gradients' && fieldPath[1]) {
      const gradientName = fieldPath[1];
      
      // Replace with default gradient
      if (this.defaultTheme.gradients[gradientName as keyof typeof this.defaultTheme.gradients]) {
        fixedTheme.gradients[gradientName as keyof typeof fixedTheme.gradients] = 
          this.defaultTheme.gradients[gradientName as keyof typeof this.defaultTheme.gradients];
      }
    }

    return fixedTheme;
  }

  /**
   * Fix invalid effects by replacing with default equivalents
   */
  private fixInvalidEffects(theme: Theme, error: ThemeError): Theme {
    const fixedTheme = { ...theme };
    
    if (!error.field) return fixedTheme;

    const fieldPath = error.field.split('.');
    
    if (fieldPath[0] === 'effects' && fieldPath[1]) {
      const effectType = fieldPath[1];
      
      // Replace with default effect
      if (this.defaultTheme.effects[effectType as keyof typeof this.defaultTheme.effects]) {
        (fixedTheme.effects as any)[effectType] = 
          (this.defaultTheme.effects as any)[effectType];
      }
    }

    return fixedTheme;
  }

  /**
   * Merge theme with default values for missing fields
   */
  private mergeWithDefault(theme: Theme): Theme {
    return {
      ...this.defaultTheme,
      ...theme,
      colors: {
        ...this.defaultTheme.colors,
        ...theme.colors,
        primary: { ...this.defaultTheme.colors.primary, ...theme.colors?.primary },
        secondary: { ...this.defaultTheme.colors.secondary, ...theme.colors?.secondary },
        accent: { ...this.defaultTheme.colors.accent, ...theme.colors?.accent },
        neutral: { ...this.defaultTheme.colors.neutral, ...theme.colors?.neutral },
        semantic: { ...this.defaultTheme.colors.semantic, ...theme.colors?.semantic }
      },
      gradients: {
        ...this.defaultTheme.gradients,
        ...theme.gradients
      },
      typography: {
        ...this.defaultTheme.typography,
        ...theme.typography,
        fontFamily: {
          ...this.defaultTheme.typography.fontFamily,
          ...theme.typography?.fontFamily
        },
        fontSize: {
          ...this.defaultTheme.typography.fontSize,
          ...theme.typography?.fontSize
        },
        fontWeight: {
          ...this.defaultTheme.typography.fontWeight,
          ...theme.typography?.fontWeight
        },
        lineHeight: {
          ...this.defaultTheme.typography.lineHeight,
          ...theme.typography?.lineHeight
        }
      },
      effects: {
        ...this.defaultTheme.effects,
        ...theme.effects,
        backdropBlur: {
          ...this.defaultTheme.effects.backdropBlur,
          ...theme.effects?.backdropBlur
        },
        boxShadow: {
          ...this.defaultTheme.effects.boxShadow,
          ...theme.effects?.boxShadow
        },
        borderRadius: {
          ...this.defaultTheme.effects.borderRadius,
          ...theme.effects?.borderRadius
        }
      }
    };
  }

  /**
   * Log errors to internal error log
   */
  private logErrors(errors: ThemeError[]): void {
    errors.forEach(error => {
      this.errorLog.push({
        ...error,
        timestamp: new Date().toISOString()
      } as any);
    });

    // Trim log if it gets too large
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxErrorLogSize);
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      errors.forEach(error => {
        const logMethod = error.severity === 'critical' || error.severity === 'high' 
          ? console.error 
          : console.warn;
        
        logMethod(`Theme ${error.severity} error in ${error.field}:`, error.message);
        if (error.fallbackAction) {
          console.info(`Applied fallback strategy: ${error.fallbackAction}`);
        }
      });
    }
  }

  /**
   * Notify user of theme errors
   */
  private notifyUser(errors: ThemeError[]): void {
    const criticalErrors = errors.filter(e => e.severity === 'critical');
    const highErrors = errors.filter(e => e.severity === 'high');
    
    if (criticalErrors.length > 0) {
      this.showNotification(
        'Theme Error', 
        'Critical theme errors detected. Using default theme.', 
        'error'
      );
    } else if (highErrors.length > 0) {
      this.showNotification(
        'Theme Warning', 
        'Some theme settings were invalid and have been corrected.', 
        'warning'
      );
    }
  }

  /**
   * Show notification to user
   */
  private showNotification(title: string, message: string, type: 'error' | 'warning' | 'info'): void {
    // Emit custom event for UI to handle
    window.dispatchEvent(new CustomEvent('themeError', {
      detail: { title, message, type }
    }));

    // Fallback to console if no UI handler
    setTimeout(() => {
      const logMethod = type === 'error' ? console.error : 
                      type === 'warning' ? console.warn : console.info;
      logMethod(`${title}: ${message}`);
    }, 100);
  }

  /**
   * Create a safe theme that's guaranteed to work
   */
  createSafeTheme(partialTheme?: Partial<Theme>): Theme {
    const safeTheme = this.mergeWithDefault(partialTheme as Theme || {} as Theme);
    
    // Ensure all required fields are present with valid values
    safeTheme.id = safeTheme.id || `safe-theme-${Date.now()}`;
    safeTheme.name = safeTheme.name || 'Safe Theme';
    
    return safeTheme;
  }

  /**
   * Validate and fix theme in one operation
   */
  validateAndFix(theme: Theme, options: ErrorRecoveryOptions = {}): { 
    theme: Theme; 
    isValid: boolean; 
    errors: ThemeError[];
    warnings: ThemeError[];
  } {
    try {
      // Import validation here to avoid circular dependency
      const { themeValidator } = require('./validation');
      const validation = themeValidator.validateTheme(theme);
      
      if (validation.isValid) {
        return {
          theme,
          isValid: true,
          errors: [],
          warnings: validation.warnings.map(w => this.validationErrorToThemeError(w))
        };
      }

      // Handle validation errors
      const result = this.handleThemeError(theme, validation.errors, options);
      
      return {
        theme: result.theme,
        isValid: result.recovered,
        errors: result.errors.filter(e => e.severity === 'high' || e.severity === 'critical'),
        warnings: result.errors.filter(e => e.severity === 'low' || e.severity === 'medium')
      };
    } catch (error) {
      // Fallback to safe theme if validation itself fails
      return {
        theme: this.createSafeTheme(theme),
        isValid: false,
        errors: [this.errorToThemeError(error as Error)],
        warnings: []
      };
    }
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): ThemeError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<string, number>;
    byField: Record<string, number>;
    byCode: Record<string, number>;
  } {
    const stats = {
      total: this.errorLog.length,
      bySeverity: {} as Record<string, number>,
      byField: {} as Record<string, number>,
      byCode: {} as Record<string, number>
    };

    this.errorLog.forEach(error => {
      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
      
      // Count by field
      if (error.field) {
        stats.byField[error.field] = (stats.byField[error.field] || 0) + 1;
      }
      
      // Count by code
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
    });

    return stats;
  }
}

// Export singleton instance
export const themeErrorHandler = new ThemeErrorHandler();

// Export error creation utilities
export function createThemeError(
  message: string, 
  code: string, 
  field?: string, 
  severity: ThemeError['severity'] = 'medium'
): ThemeError {
  const error = new Error(message) as ThemeError;
  error.code = code;
  error.field = field;
  error.severity = severity;
  error.recoverable = severity !== 'critical';
  return error;
}

export function createValidationError(
  field: string, 
  message: string, 
  severity: 'error' | 'warning' = 'error'
): ValidationError {
  return { field, message, severity };
}