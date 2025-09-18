// Accessibility validation utilities for theme system
import { ColorPalette, ValidationError, Theme } from './types';

export interface AccessibilityValidationResult {
  isCompliant: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  contrastRatios: ContrastRatio[];
}

export interface ContrastRatio {
  foreground: string;
  background: string;
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  context: string;
}

export class AccessibilityValidator {
  private readonly WCAG_AA_NORMAL = 4.5;
  private readonly WCAG_AA_LARGE = 3.0;
  private readonly WCAG_AAA_NORMAL = 7.0;
  private readonly WCAG_AAA_LARGE = 4.5;

  /**
   * Validate theme for accessibility compliance
   */
  validateThemeAccessibility(theme: Theme): AccessibilityValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const contrastRatios: ContrastRatio[] = [];

    // Validate color contrast ratios
    this.validateColorContrasts(theme.colors, errors, warnings, contrastRatios);
    
    // Validate gradient readability
    this.validateGradientReadability(theme, errors, warnings, contrastRatios);
    
    // Validate semantic color accessibility
    this.validateSemanticColors(theme.colors, errors, warnings, contrastRatios);

    return {
      isCompliant: errors.length === 0,
      errors,
      warnings,
      contrastRatios
    };
  }

  /**
   * Validate color contrast ratios within color scales
   */
  private validateColorContrasts(
    colors: ColorPalette, 
    errors: ValidationError[], 
    warnings: ValidationError[],
    contrastRatios: ContrastRatio[]
  ): void {
    const scales = ['primary', 'secondary', 'accent', 'neutral'] as const;
    
    scales.forEach(scale => {
      const colorScale = colors[scale];
      if (!colorScale) return;

      // Check contrast between light and dark shades
      const lightShade = colorScale['100'];
      const darkShade = colorScale['800'];
      
      if (lightShade && darkShade) {
        const ratio = this.calculateContrastRatio(lightShade, darkShade);
        const level = this.getContrastLevel(ratio);
        
        contrastRatios.push({
          foreground: darkShade,
          background: lightShade,
          ratio,
          level,
          context: `${scale} scale (100 vs 800)`
        });

        if (ratio < this.WCAG_AA_NORMAL) {
          errors.push({
            field: `colors.${scale}`,
            message: `Insufficient contrast ratio (${ratio.toFixed(2)}) between ${scale}-100 and ${scale}-800. WCAG AA requires 4.5:1`,
            severity: 'error'
          });
        } else if (ratio < this.WCAG_AAA_NORMAL) {
          warnings.push({
            field: `colors.${scale}`,
            message: `Contrast ratio (${ratio.toFixed(2)}) meets WCAG AA but not AAA standards`,
            severity: 'warning'
          });
        }
      }

      // Check readability of text colors on primary backgrounds
      if (scale === 'primary') {
        this.validateTextOnBackground(colorScale, errors, warnings, contrastRatios, scale);
      }
    });
  }

  /**
   * Validate text readability on colored backgrounds
   */
  private validateTextOnBackground(
    colorScale: any,
    errors: ValidationError[],
    warnings: ValidationError[],
    contrastRatios: ContrastRatio[],
    scaleName: string
  ): void {
    const textColors = ['#ffffff', '#000000']; // White and black text
    const backgroundShades = ['500', '600', '700', '800', '900'];

    backgroundShades.forEach(shade => {
      const backgroundColor = colorScale[shade];
      if (!backgroundColor) return;

      textColors.forEach(textColor => {
        const ratio = this.calculateContrastRatio(textColor, backgroundColor);
        const level = this.getContrastLevel(ratio);
        const textType = textColor === '#ffffff' ? 'white' : 'black';
        
        contrastRatios.push({
          foreground: textColor,
          background: backgroundColor,
          ratio,
          level,
          context: `${textType} text on ${scaleName}-${shade}`
        });

        if (ratio < this.WCAG_AA_NORMAL) {
          if (textColor === '#ffffff' && ['800', '900'].includes(shade)) {
            // White text should work on dark backgrounds
            errors.push({
              field: `colors.${scaleName}.${shade}`,
              message: `White text has insufficient contrast (${ratio.toFixed(2)}) on ${scaleName}-${shade}`,
              severity: 'error'
            });
          } else if (textColor === '#000000' && ['500', '600'].includes(shade)) {
            // Black text should work on lighter backgrounds
            warnings.push({
              field: `colors.${scaleName}.${shade}`,
              message: `Black text has low contrast (${ratio.toFixed(2)}) on ${scaleName}-${shade}`,
              severity: 'warning'
            });
          }
        }
      });
    });
  }

  /**
   * Validate gradient readability
   */
  private validateGradientReadability(
    theme: Theme,
    errors: ValidationError[],
    warnings: ValidationError[],
    contrastRatios: ContrastRatio[]
  ): void {
    Object.entries(theme.gradients).forEach(([gradientName, gradient]) => {
      if (!gradient.colorStops || gradient.colorStops.length < 2) return;

      const startColor = gradient.colorStops[0].color;
      const endColor = gradient.colorStops[gradient.colorStops.length - 1].color;
      
      // Check if white text is readable across the gradient
      const startRatio = this.calculateContrastRatio('#ffffff', startColor);
      const endRatio = this.calculateContrastRatio('#ffffff', endColor);
      
      contrastRatios.push({
        foreground: '#ffffff',
        background: startColor,
        ratio: startRatio,
        level: this.getContrastLevel(startRatio),
        context: `White text on ${gradientName} gradient start`
      });

      contrastRatios.push({
        foreground: '#ffffff',
        background: endColor,
        ratio: endRatio,
        level: this.getContrastLevel(endRatio),
        context: `White text on ${gradientName} gradient end`
      });

      const minRatio = Math.min(startRatio, endRatio);
      if (minRatio < this.WCAG_AA_NORMAL) {
        errors.push({
          field: `gradients.${gradientName}`,
          message: `Gradient has insufficient contrast for white text (${minRatio.toFixed(2)}). Consider darker colors.`,
          severity: 'error'
        });
      }
    });
  }

  /**
   * Validate semantic colors for accessibility
   */
  private validateSemanticColors(
    colors: ColorPalette,
    errors: ValidationError[],
    warnings: ValidationError[],
    contrastRatios: ContrastRatio[]
  ): void {
    if (!colors.semantic) return;

    const semanticColors = colors.semantic;
    const backgroundColors = ['#ffffff', colors.neutral['50'], colors.neutral['100']];

    Object.entries(semanticColors).forEach(([semanticType, color]) => {
      backgroundColors.forEach((bgColor, index) => {
        const bgName = index === 0 ? 'white' : `neutral-${index === 1 ? '50' : '100'}`;
        const ratio = this.calculateContrastRatio(color, bgColor);
        const level = this.getContrastLevel(ratio);
        
        contrastRatios.push({
          foreground: color,
          background: bgColor,
          ratio,
          level,
          context: `${semanticType} on ${bgName}`
        });

        if (ratio < this.WCAG_AA_NORMAL) {
          errors.push({
            field: `colors.semantic.${semanticType}`,
            message: `${semanticType} color has insufficient contrast (${ratio.toFixed(2)}) on ${bgName} background`,
            severity: 'error'
          });
        }
      });
    });
  }

  /**
   * Calculate contrast ratio between two colors
   * Based on WCAG 2.1 guidelines
   */
  calculateContrastRatio(color1: string, color2: string): number {
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Get relative luminance of a color
   */
  private getLuminance(color: string): number {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    if (hex.length !== 6) return null;
    
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return { r, g, b };
  }

  /**
   * Get WCAG compliance level for contrast ratio
   */
  private getContrastLevel(ratio: number): 'AA' | 'AAA' | 'fail' {
    if (ratio >= this.WCAG_AAA_NORMAL) return 'AAA';
    if (ratio >= this.WCAG_AA_NORMAL) return 'AA';
    return 'fail';
  }

  /**
   * Generate accessibility suggestions for improving contrast
   */
  generateAccessibilitySuggestions(theme: Theme): string[] {
    const suggestions: string[] = [];
    const validation = this.validateThemeAccessibility(theme);
    
    validation.errors.forEach(error => {
      if (error.message.includes('contrast')) {
        if (error.field.includes('primary')) {
          suggestions.push('Consider using darker shades for primary colors to improve text readability');
        } else if (error.field.includes('gradient')) {
          suggestions.push('Gradients should use darker colors to ensure white text remains readable');
        } else if (error.field.includes('semantic')) {
          suggestions.push('Semantic colors should have sufficient contrast against light backgrounds');
        }
      }
    });

    // Add general suggestions
    if (validation.errors.length > 0) {
      suggestions.push('Test your theme with screen readers and high contrast mode');
      suggestions.push('Consider providing alternative color schemes for users with visual impairments');
    }

    return Array.from(new Set(suggestions)); // Remove duplicates
  }
}

// Export singleton instance
export const accessibilityValidator = new AccessibilityValidator();