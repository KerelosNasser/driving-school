// Theme extractor service to analyze current UI components
import { 
  Theme, 
  GradientConfig, 
  ColorPalette, 
  TypographyConfig, 
  EffectConfig, 
  ExtractedPattern, 
  ExtractionResult,
  ColorScale,
  GradientSet,
  ThemeMetadata
} from './types';

export class ThemeExtractor {
  private patterns: ExtractedPattern[] = [];

  /**
   * Extract gradients from the current UI components
   */
  extractGradients(): GradientConfig[] {
    // Based on analysis of the current components, extract the emerald/teal gradient patterns
    const gradients: GradientConfig[] = [
      {
        name: 'hero-gradient',
        direction: 'to bottom right',
        colorStops: [
          { color: '#064e3b', position: 0 },    // emerald-900
          { color: '#115e59', position: 50 },   // teal-800  
          { color: '#1e3a8a', position: 100 }   // blue-900
        ],
        usage: 'hero'
      },
      {
        name: 'card-gradient',
        direction: 'to right',
        colorStops: [
          { color: '#10b981', position: 0 },    // emerald-500
          { color: '#0d9488', position: 100 }   // teal-600
        ],
        usage: 'card'
      },
      {
        name: 'button-gradient',
        direction: 'to right',
        colorStops: [
          { color: '#10b981', position: 0 },    // emerald-500
          { color: '#0d9488', position: 100 }   // teal-600
        ],
        usage: 'button'
      },
      {
        name: 'background-gradient',
        direction: 'to bottom right',
        colorStops: [
          { color: '#f9fafb', position: 0 },    // gray-50
          { color: '#ecfdf5', position: 100 }   // emerald-50/30
        ],
        usage: 'background'
      },
      {
        name: 'accent-gradient',
        direction: 'to bottom right',
        colorStops: [
          { color: '#ecfdf5', position: 0 },    // emerald-100
          { color: '#ccfbf1', position: 100 }   // teal-100
        ],
        usage: 'accent'
      }
    ];

    this.patterns.push(...gradients.map(g => ({
      type: 'gradient' as const,
      value: `linear-gradient(${g.direction}, ${g.colorStops.map(s => `${s.color} ${s.position}%`).join(', ')})`,
      usage: g.usage,
      frequency: 1
    })));

    return gradients;
  }

  /**
   * Extract color palette from current design
   */
  extractColors(): ColorPalette {
    const emeraldScale: ColorScale = {
      50: '#ecfdf5',
      100: '#d1fae5', 
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b'
    };

    const tealScale: ColorScale = {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4', 
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a'
    };

    const blueScale: ColorScale = {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    };

    const grayScale: ColorScale = {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    };

    const palette: ColorPalette = {
      primary: emeraldScale,
      secondary: tealScale,
      accent: blueScale,
      neutral: grayScale,
      semantic: {
        success: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
        error: '#ef4444',   // red-500
        info: '#3b82f6'     // blue-500
      }
    };

    // Track color usage patterns
    Object.entries(palette).forEach(([key, scale]) => {
      if (typeof scale === 'object' && 'success' in scale) {
        // Semantic colors
        Object.entries(scale).forEach(([semantic, color]) => {
          this.patterns.push({
            type: 'color',
            value: color as string,
            usage: `semantic-${semantic}`,
            frequency: 1
          });
        });
      } else {
        // Color scales
        Object.entries(scale as ColorScale).forEach(([shade, color]) => {
          this.patterns.push({
            type: 'color',
            value: color,
            usage: `${key}-${shade}`,
            frequency: 1
          });
        });
      }
    });

    return palette;
  }

  /**
   * Extract typography configuration from current design
   */
  extractTypography(): TypographyConfig {
    const typography: TypographyConfig = {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem', 
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem'
      },
      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900'
      },
      lineHeight: {
        none: '1',
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2'
      }
    };

    return typography;
  }

  /**
   * Extract effects (shadows, blur, radius) from current design
   */
  extractEffects(): EffectConfig {
    const effects: EffectConfig = {
      backdropBlur: {
        sm: 'blur(4px)',
        md: 'blur(12px)',
        lg: 'blur(16px)',
        xl: 'blur(24px)'
      },
      boxShadow: {
        card: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        button: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        hero: '0 20px 25px -5px rgba(16, 185, 129, 0.1)' // emerald shadow
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem', 
        lg: '0.75rem',
        xl: '1.5rem',
        full: '9999px'
      }
    };

    // Track effect patterns
    Object.entries(effects).forEach(([category, values]) => {
      Object.entries(values).forEach(([size, value]) => {
        this.patterns.push({
          type: category === 'backdropBlur' ? 'blur' : category === 'boxShadow' ? 'shadow' : 'radius',
          value: value as string,
          usage: `${category}-${size}`,
          frequency: 1
        });
      });
    });

    return effects;
  }

  /**
   * Generate the complete default theme based on extracted patterns
   */
  generateDefaultTheme(): Theme {
    const colors = this.extractColors();
    const gradients = this.extractGradients();
    const typography = this.extractTypography();
    const effects = this.extractEffects();

    // Convert gradient array to gradient set
    const gradientSet: GradientSet = {
      hero: gradients.find(g => g.usage === 'hero')!,
      card: gradients.find(g => g.usage === 'card')!,
      button: gradients.find(g => g.usage === 'button')!,
      background: gradients.find(g => g.usage === 'background')!,
      accent: gradients.find(g => g.usage === 'accent')!
    };

    const metadata: ThemeMetadata = {
      name: 'Default Professional',
      description: 'Extracted from current emerald/teal design system',
      author: 'Theme Extractor',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['default', 'emerald', 'teal', 'professional']
    };

    return {
      id: 'default-professional',
      name: 'Default Professional',
      colors,
      gradients: gradientSet,
      typography,
      effects,
      metadata
    };
  }

  /**
   * Analyze current components and return extraction results
   */
  analyzeComponents(): ExtractionResult {
    this.patterns = []; // Reset patterns
    
    const theme = this.generateDefaultTheme();
    
    return {
      patterns: this.patterns,
      theme,
      confidence: 0.95 // High confidence since we're extracting from known patterns
    };
  }

  /**
   * Get extracted patterns for analysis
   */
  getPatterns(): ExtractedPattern[] {
    return this.patterns;
  }
}

// Export singleton instance
export const themeExtractor = new ThemeExtractor();