// CSS Variable Manager for real-time theme switching with performance optimizations
import { Theme, GradientConfig } from './types';
import { performanceOptimizer } from './performance-optimizer';
import { errorRecoverySystem } from './error-recovery';

export interface CSSVariableManager {
  updateVariables(variables: Record<string, string>): void;
  getComputedVariables(): Record<string, string>;
  resetToDefault(): void;
  validateVariables(variables: Record<string, string>): boolean;
  applyTheme(theme: Theme): void;
  getVariableValue(property: string): string | null;
  setVariableValue(property: string, value: string): boolean;
  batchUpdateVariables(variables: Record<string, string>): { success: boolean; errors: string[] };
  createFallbackChain(property: string, fallbacks: string[]): void;
  optimizedUpdate(variables: Record<string, string>): Promise<void>;
  preloadVariables(variables: Record<string, string>): void;
}

export class CSSVariableManagerImpl implements CSSVariableManager {
  private defaultVariables: Record<string, string> = {};
  private currentVariables: Record<string, string> = {};
  private fallbackChains: Map<string, string[]> = new Map();
  private validationCache: Map<string, boolean> = new Map();
  private updateQueue: Array<{ property: string; value: string }> = [];
  private isUpdating = false;

  constructor() {
    this.initializeDefaultVariables();
    this.setupFallbackChains();
  }

  /**
   * Initialize default CSS variables from current theme
   */
  private initializeDefaultVariables(): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    // Store current CSS custom properties as defaults
    const properties = [
      // Theme colors
      '--theme-primary-50', '--theme-primary-100', '--theme-primary-200',
      '--theme-primary-300', '--theme-primary-400', '--theme-primary-500',
      '--theme-primary-600', '--theme-primary-700', '--theme-primary-800', '--theme-primary-900',
      
      '--theme-secondary-50', '--theme-secondary-100', '--theme-secondary-200',
      '--theme-secondary-300', '--theme-secondary-400', '--theme-secondary-500',
      '--theme-secondary-600', '--theme-secondary-700', '--theme-secondary-800', '--theme-secondary-900',
      
      '--theme-accent-50', '--theme-accent-100', '--theme-accent-200',
      '--theme-accent-300', '--theme-accent-400', '--theme-accent-500',
      '--theme-accent-600', '--theme-accent-700', '--theme-accent-800', '--theme-accent-900',
      
      // Gradients
      '--theme-gradient-hero', '--theme-gradient-card', '--theme-gradient-button',
      '--theme-gradient-background', '--theme-gradient-accent',
      
      // Effects
      '--theme-backdrop-blur-sm', '--theme-backdrop-blur-md', '--theme-backdrop-blur-lg', '--theme-backdrop-blur-xl',
      '--theme-shadow-card', '--theme-shadow-button', '--theme-shadow-modal', '--theme-shadow-hero',
      '--theme-radius-sm', '--theme-radius-md', '--theme-radius-lg', '--theme-radius-xl', '--theme-radius-full',
      
      // Typography
      '--theme-font-sans', '--theme-font-serif', '--theme-font-mono'
    ];

    properties.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value) {
        this.defaultVariables[prop] = value.trim();
      }
    });
  }

  /**
   * Update CSS custom properties with new values (optimized)
   */
  updateVariables(variables: Record<string, string>): void {
    if (typeof window === 'undefined') return;

    // Use performance optimizer for batched updates
    performanceOptimizer.optimizeCSSUpdates(() => {
      const result = this.batchUpdateVariables(variables);
      
      if (!result.success && result.errors.length > 0) {
        console.warn('Some CSS variables failed to update:', result.errors);
        
        // Create error for recovery system
        const error = errorRecoverySystem.createError(
          'CSS variable update failed',
          'CSS_APPLICATION_FAILED',
          { operation: 'css-variable-update' },
          'medium'
        );
        
        errorRecoverySystem.handleError(error);
      }
    });
  }

  /**
   * Optimized CSS variable update with caching and error recovery
   */
  async optimizedUpdate(variables: Record<string, string>): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Use performance optimizer's optimized CSS injection
      performanceOptimizer.optimizedCSSVariableInjection(variables);
      
      // Update current variables cache
      Object.assign(this.currentVariables, variables);
      
  } catch (_error) {
      const themeError = errorRecoverySystem.createError(
        'Optimized CSS update failed',
        'CSS_OPTIMIZATION_FAILED',
        { operation: 'optimized-css-update' },
        'high'
      );
      
      await errorRecoverySystem.handleError(themeError);
      
      // Fallback to regular update
      this.updateVariables(variables);
    }
  }

  /**
   * Preload variables for better performance
   */
  preloadVariables(variables: Record<string, string>): void {
    // Cache variables for faster access
    Object.entries(variables).forEach(([property, value]) => {
      const cacheKey = `${property}:${value}`;
      this.validationCache.set(cacheKey, this.validateSingleVariable(property, value));
    });
  }

  /**
   * Batch update variables with validation and error handling
   */
  batchUpdateVariables(variables: Record<string, string>): { success: boolean; errors: string[] } {
    if (typeof window === 'undefined') return { success: false, errors: ['Window not available'] };

    const errors: string[] = [];
    const validVariables: Record<string, string> = {};
    
    // Validate all variables first
    Object.entries(variables).forEach(([property, value]) => {
      if (this.validateSingleVariable(property, value)) {
        validVariables[property] = value;
      } else {
        errors.push(`Invalid variable: ${property} = ${value}`);
      }
    });

    // Apply valid variables
    if (Object.keys(validVariables).length > 0) {
      this.applyVariablesToDOM(validVariables);
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Apply variables to DOM with fallback support
   */
  private applyVariablesToDOM(variables: Record<string, string>): void {
    const root = document.documentElement;
    
    Object.entries(variables).forEach(([property, value]) => {
      try {
        // Apply primary value
        root.style.setProperty(property, value);
        this.currentVariables[property] = value;
        
        // Set up fallback chain if available
        const fallbacks = this.fallbackChains.get(property);
        if (fallbacks) {
          fallbacks.forEach((fallbackProp, index) => {
            const fallbackValue = this.generateFallbackValue(property, value, index);
            if (fallbackValue) {
              root.style.setProperty(fallbackProp, fallbackValue);
            }
          });
        }
      } catch (_error) {
        console.warn(`Failed to set CSS variable ${property}:`, _error);
        this.applyFallback(property);
      }
    });
  }

  /**
   * Apply fallback value for a property
   */
  private applyFallback(property: string): void {
    const fallbacks = this.fallbackChains.get(property);
    if (fallbacks && fallbacks.length > 0) {
      const firstFallback = fallbacks[0];
      const fallbackValue = (firstFallback && this.defaultVariables[firstFallback]) || this.defaultVariables[property];
      if (fallbackValue) {
        document.documentElement.style.setProperty(property, fallbackValue);
      }
    }
  }

  /**
   * Generate fallback value based on primary value
   */
  private generateFallbackValue(property: string, value: string, fallbackIndex: number): string | null {
    // For colors, generate lighter/darker variants
    if (property.includes('color') || property.includes('primary') || property.includes('secondary')) {
      return this.generateColorFallback(value, fallbackIndex);
    }
    
    // For gradients, simplify to solid color
    if (property.includes('gradient')) {
      return this.extractFirstColorFromGradient(value);
    }
    
    // For other properties, return original value
    return value;
  }

  /**
   * Generate color fallback (simplified version)
   */
  private generateColorFallback(color: string, index: number): string {
    // This is a simplified implementation
    // In a real app, you'd use a color manipulation library
    return color;
  }

  /**
   * Extract first color from gradient for fallback
   */
  private extractFirstColorFromGradient(gradient: string): string {
    const colorMatch = gradient.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/);
    return colorMatch ? colorMatch[0] : '#10b981'; // Default to emerald-500
  }

  /**
   * Get currently computed CSS variables
   */
  getComputedVariables(): Record<string, string> {
    if (typeof window === 'undefined') return {};

    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const variables: Record<string, string> = {};

    Object.keys(this.defaultVariables).forEach(property => {
      const value = computedStyle.getPropertyValue(property);
      if (value) {
        variables[property] = value.trim();
      }
    });

    return variables;
  }

  /**
   * Reset all variables to their default values
   */
  resetToDefault(): void {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    Object.entries(this.defaultVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    this.currentVariables = { ...this.defaultVariables };
  }

  /**
   * Validate CSS variables before applying
   */
  validateVariables(variables: Record<string, string>): boolean {
    return Object.entries(variables).every(([property, value]) => 
      this.validateSingleVariable(property, value)
    );
  }

  /**
   * Get a specific variable value
   */
  getVariableValue(property: string): string | null {
    if (typeof window === 'undefined') return null;
    
    const computedStyle = getComputedStyle(document.documentElement);
    const value = computedStyle.getPropertyValue(property);
    return value ? value.trim() : null;
  }

  /**
   * Set a single variable value with validation
   */
  setVariableValue(property: string, value: string): boolean {
    if (!this.validateSingleVariable(property, value)) {
      return false;
    }
    
    this.updateVariables({ [property]: value });
    return true;
  }

  /**
   * Create fallback chain for a property
   */
  createFallbackChain(property: string, fallbacks: string[]): void {
    this.fallbackChains.set(property, fallbacks);
  }

  /**
   * Setup default fallback chains
   */
  private setupFallbackChains(): void {
    // Color fallbacks
    this.createFallbackChain('--theme-primary-500', ['--theme-primary-400', '--theme-primary-600']);
    this.createFallbackChain('--theme-secondary-500', ['--theme-secondary-400', '--theme-secondary-600']);
    
    // Gradient fallbacks
    this.createFallbackChain('--theme-gradient-hero', ['--theme-primary-900']);
    this.createFallbackChain('--theme-gradient-card', ['--theme-primary-500']);
    this.createFallbackChain('--theme-gradient-button', ['--theme-primary-500']);
    
    // Effect fallbacks
    this.createFallbackChain('--theme-backdrop-blur-md', ['--theme-backdrop-blur-sm']);
    this.createFallbackChain('--theme-shadow-card', ['--theme-shadow-button']);
  }

  /**
   * Validate a single CSS variable with caching
   */
  private validateSingleVariable(property: string, value: string): boolean {
    const cacheKey = `${property}:${value}`;
    
    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    let isValid = true;

    // Check if property name is valid (starts with --)
    if (!property.startsWith('--')) {
      console.warn(`Invalid CSS property name: ${property}`);
      isValid = false;
    }

    // Check if value is not empty
    if (!value || value.trim() === '') {
      console.warn(`Empty value for CSS property: ${property}`);
      isValid = false;
    }

    if (isValid) {
      // Enhanced validation for different value types
      if (property.includes('color') || property.includes('primary') || property.includes('secondary') || property.includes('accent') || property.includes('neutral')) {
        isValid = this.validateColor(value);
      } else if (property.includes('gradient')) {
        isValid = this.validateGradient(value);
      } else if (property.includes('shadow')) {
        isValid = this.validateShadow(value);
      } else if (property.includes('blur')) {
        isValid = this.validateBlur(value);
      } else if (property.includes('radius')) {
        isValid = this.validateRadius(value);
      } else if (property.includes('font')) {
        isValid = this.validateFont(value);
      }
    }

    // Cache the result
    this.validationCache.set(cacheKey, isValid);
    
    return isValid;
  }

  /**
   * Validate color values (hex, rgb, hsl, etc.) with enhanced checks
   */
  private validateColor(value: string): boolean {
    if (typeof window === 'undefined') return true; // Skip validation on server
    
    // Check for common color formats
    const colorFormats = [
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, // Hex
      /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, // RGB
      /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/, // RGBA
      /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/, // HSL
      /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/, // HSLA
      /^oklch\([^)]+\)$/, // OKLCH (modern CSS)
    ];

    // Check against known formats first
    if (colorFormats.some(format => format.test(value))) {
      return true;
    }

    // CSS named colors
    const namedColors = ['transparent', 'currentColor', 'inherit', 'initial', 'unset'];
    if (namedColors.includes(value.toLowerCase())) {
      return true;
    }

    // Test with DOM element as fallback
    try {
      const testElement = document.createElement('div');
      testElement.style.color = value;
      return testElement.style.color !== '';
    } catch {
      return false;
    }
  }

  /**
   * Validate gradient values with enhanced checks
   */
  private validateGradient(value: string): boolean {
    // Check for gradient function syntax
    const gradientTypes = ['linear-gradient', 'radial-gradient', 'conic-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient'];
    
    const hasValidType = gradientTypes.some(type => value.includes(type));
    if (!hasValidType) return false;

    // Check for proper parentheses
    const openParens = (value.match(/\(/g) || []).length;
    const closeParens = (value.match(/\)/g) || []).length;
    if (openParens !== closeParens) return false;

    // Check for at least one color
    const hasColor = /(?:#[0-9a-fA-F]{3,8}|rgb|hsl|oklch|\b(?:red|blue|green|white|black|transparent)\b)/.test(value);
    
    return hasColor;
  }

  /**
   * Validate shadow values with enhanced checks
   */
  private validateShadow(value: string): boolean {
    if (value === 'none') return true;
    
    // Enhanced shadow validation
    // Format: [inset] <offset-x> <offset-y> [<blur-radius>] [<spread-radius>] <color>
    const shadowPattern = /^(?:inset\s+)?(?:[-\d.]+(?:px|rem|em|%)\s+){2,4}(?:#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\)|oklch\([^)]+\)|\w+)(?:\s*,\s*(?:inset\s+)?(?:[-\d.]+(?:px|rem|em|%)\s+){2,4}(?:#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\)|oklch\([^)]+\)|\w+))*$/;
    
    return shadowPattern.test(value.trim());
  }

  /**
   * Validate blur values with enhanced checks
   */
  private validateBlur(value: string): boolean {
    // Check for blur function
    if (!value.includes('blur(')) return false;
    
    // Extract blur value
    const blurMatch = value.match(/blur\(([\d.]+(?:px|rem|em)?)\)/);
    if (!blurMatch || !blurMatch[1]) return false;
    
    const blurValue = parseFloat(blurMatch[1] as string);
    return !isNaN(blurValue) && blurValue >= 0;
  }

  /**
   * Validate border radius values with enhanced checks
   */
  private validateRadius(value: string): boolean {
    // Handle special cases
    if (value === '9999px' || value === 'full') return true;
    
    // Check for valid CSS length units
    const lengthPattern = /^[\d.]+(?:px|rem|em|%|vh|vw|vmin|vmax)?$/;
    
    // Handle multiple values (e.g., "10px 20px")
    const values = value.split(/\s+/);
    if (values.length > 4) return false; // Max 4 values for border-radius
    
    return values.every(v => lengthPattern.test(v));
  }

  /**
   * Validate font values
   */
  private validateFont(value: string): boolean {
    // For font-family, allow comma-separated list
    if (value.includes(',')) {
      return value.split(',').every(font => font.trim().length > 0);
    }
    
    // Single font name
    return value.trim().length > 0;
  }

  /**
   * Apply theme to CSS variables
   */
  applyTheme(theme: Theme): void {
    const variables = this.themeToVariables(theme);
    this.updateVariables(variables);
  }

  /**
   * Convert theme object to CSS variables
   */
  private themeToVariables(theme: Theme): Record<string, string> {
    const variables: Record<string, string> = {};

    // Convert colors
    Object.entries(theme.colors.primary).forEach(([shade, color]) => {
      variables[`--theme-primary-${shade}`] = color;
    });

    Object.entries(theme.colors.secondary).forEach(([shade, color]) => {
      variables[`--theme-secondary-${shade}`] = color;
    });

    Object.entries(theme.colors.accent).forEach(([shade, color]) => {
      variables[`--theme-accent-${shade}`] = color;
    });

    Object.entries(theme.colors.neutral).forEach(([shade, color]) => {
      variables[`--theme-neutral-${shade}`] = color;
    });

    // Convert gradients
    Object.entries(theme.gradients).forEach(([key, gradient]) => {
      variables[`--theme-gradient-${key}`] = this.gradientToCss(gradient);
    });

    // Convert effects
    Object.entries(theme.effects.backdropBlur).forEach(([size, value]) => {
      variables[`--theme-backdrop-blur-${size}`] = value;
    });

    Object.entries(theme.effects.boxShadow).forEach(([type, value]) => {
      variables[`--theme-shadow-${type}`] = value;
    });

    Object.entries(theme.effects.borderRadius).forEach(([size, value]) => {
      variables[`--theme-radius-${size}`] = value;
    });

    // Convert typography
    variables['--theme-font-sans'] = theme.typography.fontFamily.sans.join(', ');
    variables['--theme-font-serif'] = theme.typography.fontFamily.serif.join(', ');
    variables['--theme-font-mono'] = theme.typography.fontFamily.mono.join(', ');

    return variables;
  }

  /**
   * Convert gradient config to CSS gradient string
   */
  private gradientToCss(gradient: GradientConfig): string {
    const colorStops = gradient.colorStops
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');
    
    return `linear-gradient(${gradient.direction}, ${colorStops})`;
  }
}

// Export singleton instance
export const cssVariableManager = new CSSVariableManagerImpl();

// Initialize default theme variables in CSS
export function initializeThemeVariables(): void {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  
  // Set default theme variables if they don't exist
  const defaultVariables = {
    // Primary colors (emerald)
    '--theme-primary-50': '#ecfdf5',
    '--theme-primary-100': '#d1fae5',
    '--theme-primary-200': '#a7f3d0',
    '--theme-primary-300': '#6ee7b7',
    '--theme-primary-400': '#34d399',
    '--theme-primary-500': '#10b981',
    '--theme-primary-600': '#059669',
    '--theme-primary-700': '#047857',
    '--theme-primary-800': '#065f46',
    '--theme-primary-900': '#064e3b',

    // Secondary colors (teal)
    '--theme-secondary-50': '#f0fdfa',
    '--theme-secondary-100': '#ccfbf1',
    '--theme-secondary-200': '#99f6e4',
    '--theme-secondary-300': '#5eead4',
    '--theme-secondary-400': '#2dd4bf',
    '--theme-secondary-500': '#14b8a6',
    '--theme-secondary-600': '#0d9488',
    '--theme-secondary-700': '#0f766e',
    '--theme-secondary-800': '#115e59',
    '--theme-secondary-900': '#134e4a',

    // Accent colors (blue)
    '--theme-accent-50': '#eff6ff',
    '--theme-accent-100': '#dbeafe',
    '--theme-accent-200': '#bfdbfe',
    '--theme-accent-300': '#93c5fd',
    '--theme-accent-400': '#60a5fa',
    '--theme-accent-500': '#3b82f6',
    '--theme-accent-600': '#2563eb',
    '--theme-accent-700': '#1d4ed8',
    '--theme-accent-800': '#1e40af',
    '--theme-accent-900': '#1e3a8a',

    // Gradients
    '--theme-gradient-hero': 'linear-gradient(to bottom right, #064e3b 0%, #115e59 50%, #1e3a8a 100%)',
    '--theme-gradient-card': 'linear-gradient(to right, #10b981 0%, #0d9488 100%)',
    '--theme-gradient-button': 'linear-gradient(to right, #10b981 0%, #0d9488 100%)',
    '--theme-gradient-background': 'linear-gradient(to bottom right, #f9fafb 0%, #ecfdf5 100%)',
    '--theme-gradient-accent': 'linear-gradient(to bottom right, #ecfdf5 0%, #ccfbf1 100%)',

    // Effects
    '--theme-backdrop-blur-sm': 'blur(4px)',
    '--theme-backdrop-blur-md': 'blur(12px)',
    '--theme-backdrop-blur-lg': 'blur(16px)',
    '--theme-backdrop-blur-xl': 'blur(24px)',

    '--theme-shadow-card': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '--theme-shadow-button': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '--theme-shadow-modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '--theme-shadow-hero': '0 20px 25px -5px rgba(16, 185, 129, 0.1)',

    '--theme-radius-sm': '0.375rem',
    '--theme-radius-md': '0.5rem',
    '--theme-radius-lg': '0.75rem',
    '--theme-radius-xl': '1.5rem',
    '--theme-radius-full': '9999px',

    // Typography
    '--theme-font-sans': 'Inter, system-ui, sans-serif',
    '--theme-font-serif': 'Georgia, serif',
    '--theme-font-mono': 'Menlo, Monaco, Consolas, monospace'
  };

  Object.entries(defaultVariables).forEach(([property, value]) => {
    if (!root.style.getPropertyValue(property)) {
      root.style.setProperty(property, value);
    }
  });
}