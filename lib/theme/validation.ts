// Comprehensive theme validation and error handling system
import { 
  Theme, 
  ValidationResult, 
  ValidationError, 
  ColorPalette, 
  GradientSet, 
  TypographyConfig, 
  EffectConfig 
} from './types';
import { accessibilityValidator, AccessibilityValidationResult } from './accessibility';
import { CSSVariableValidator } from './css-variables-validation';

export interface ThemeValidationOptions {
  strict?: boolean;
  checkAccessibility?: boolean;
  validateCSS?: boolean;
  requireAllFields?: boolean;
}

export interface DetailedValidationResult extends ValidationResult {
  accessibility?: AccessibilityValidationResult;
  cssValidation?: CSSValidationResult;
  structuralValidation?: StructuralValidationResult;
  suggestions?: string[];
}

export interface CSSValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  invalidProperties: string[];
}

export interface StructuralValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  missingFields: string[];
  invalidTypes: string[];
}

export class ThemeValidator {
  private readonly defaultOptions: ThemeValidationOptions = {
    strict: false,
    checkAccessibility: true,
    validateCSS: true,
    requireAllFields: false
  };

  /**
   * Comprehensive theme validation with detailed reporting
   */
  validateTheme(theme: Theme, options?: ThemeValidationOptions): DetailedValidationResult {
    const opts = { ...this.defaultOptions, ...options };
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    // 1. Structural validation
    const structuralResult = this.validateStructure(theme, opts);
    errors.push(...structuralResult.errors);
    warnings.push(...structuralResult.warnings);

    // 2. CSS validation
    let cssValidation: CSSValidationResult | undefined;
    if (opts.validateCSS) {
      cssValidation = this.validateCSS(theme);
      errors.push(...cssValidation.errors);
      warnings.push(...cssValidation.warnings);
    }

    // 3. Accessibility validation
    let accessibilityResult: AccessibilityValidationResult | undefined;
    if (opts.checkAccessibility) {
      accessibilityResult = accessibilityValidator.validateThemeAccessibility(theme);
      errors.push(...accessibilityResult.errors);
      warnings.push(...accessibilityResult.warnings);
      suggestions.push(...accessibilityValidator.generateAccessibilitySuggestions(theme));
    }

    // 4. Color harmony validation
    const colorHarmonyResult = this.validateColorHarmony(theme);
    warnings.push(...colorHarmonyResult.warnings);
    suggestions.push(...colorHarmonyResult.suggestions);

    // 5. Gradient validation
    const gradientResult = this.validateGradients(theme.gradients);
    errors.push(...gradientResult.errors);
    warnings.push(...gradientResult.warnings);

    // 6. Typography validation
    const typographyResult = this.validateTypography(theme.typography);
    errors.push(...typographyResult.errors);
    warnings.push(...typographyResult.warnings);

    // 7. Effects validation
    const effectsResult = this.validateEffects(theme.effects);
    errors.push(...effectsResult.errors);
    warnings.push(...effectsResult.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      accessibility: accessibilityResult,
      cssValidation,
      structuralValidation: structuralResult,
      suggestions: Array.from(new Set(suggestions)) // Remove duplicates
    };
  }

  /**
   * Validate theme structure and required fields
   */
  private validateStructure(theme: Theme, options: ThemeValidationOptions): StructuralValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const missingFields: string[] = [];
    const invalidTypes: string[] = [];

    // Required fields validation
    const requiredFields = [
      { field: 'id', type: 'string' },
      { field: 'name', type: 'string' },
      { field: 'colors', type: 'object' },
      { field: 'gradients', type: 'object' },
      { field: 'typography', type: 'object' },
      { field: 'effects', type: 'object' },
      { field: 'metadata', type: 'object' }
    ];

    requiredFields.forEach(({ field, type }) => {
      const value = (theme as any)[field];
      
      if (value === undefined || value === null) {
        missingFields.push(field);
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          severity: 'error'
        });
      } else if (typeof value !== type) {
        invalidTypes.push(field);
        errors.push({
          field,
          message: `Field '${field}' must be of type ${type}, got ${typeof value}`,
          severity: 'error'
        });
      }
    });

    // ID validation
    if (theme.id) {
      if (theme.id.length < 3) {
        errors.push({
          field: 'id',
          message: 'Theme ID must be at least 3 characters long',
          severity: 'error'
        });
      }
      
      if (!/^[a-zA-Z0-9-_]+$/.test(theme.id)) {
        errors.push({
          field: 'id',
          message: 'Theme ID can only contain letters, numbers, hyphens, and underscores',
          severity: 'error'
        });
      }
    }

    // Name validation
    if (theme.name) {
      if (theme.name.length < 2) {
        errors.push({
          field: 'name',
          message: 'Theme name must be at least 2 characters long',
          severity: 'error'
        });
      }
      
      if (theme.name.length > 50) {
        warnings.push({
          field: 'name',
          message: 'Theme name is quite long (over 50 characters)',
          severity: 'warning'
        });
      }
    }

    // Metadata validation
    if (theme.metadata) {
      const requiredMetadata = ['name', 'description', 'author', 'version'];
      
      requiredMetadata.forEach(field => {
        if (!theme.metadata[field as keyof typeof theme.metadata]) {
          if (options.requireAllFields) {
            errors.push({
              field: `metadata.${field}`,
              message: `Metadata field '${field}' is required`,
              severity: 'error'
            });
          } else {
            warnings.push({
              field: `metadata.${field}`,
              message: `Metadata field '${field}' is recommended`,
              severity: 'warning'
            });
          }
        }
      });

      // Version format validation
      if (theme.metadata.version && !/^\d+\.\d+\.\d+/.test(theme.metadata.version)) {
        warnings.push({
          field: 'metadata.version',
          message: 'Version should follow semantic versioning (e.g., 1.0.0)',
          severity: 'warning'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      missingFields,
      invalidTypes
    };
  }

  /**
   * Validate CSS properties and values
   */
  private validateCSS(theme: Theme): CSSValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const invalidProperties: string[] = [];

    // Validate colors
    if (theme.colors) {
      this.validateCSSColors(theme.colors, errors, warnings, invalidProperties);
    }

    // Validate gradients
    if (theme.gradients) {
      this.validateCSSGradients(theme.gradients, errors, warnings, invalidProperties);
    }

    // Validate effects
    if (theme.effects) {
      this.validateCSSEffects(theme.effects, errors, warnings, invalidProperties);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      invalidProperties
    };
  }

  /**
   * Validate CSS color values
   */
  private validateCSSColors(
    colors: ColorPalette, 
    errors: ValidationError[], 
    warnings: ValidationError[],
    invalidProperties: string[]
  ): void {
    const colorScales = ['primary', 'secondary', 'accent', 'neutral'] as const;
    
    colorScales.forEach(scale => {
      const colorScale = colors[scale];
      if (!colorScale) return;

      Object.entries(colorScale).forEach(([shade, color]) => {
        if (!CSSVariableValidator.validateColor(color)) {
          invalidProperties.push(`colors.${scale}.${shade}`);
          errors.push({
            field: `colors.${scale}.${shade}`,
            message: `Invalid CSS color value: "${color}"`,
            severity: 'error'
          });
        }
      });
    });

    // Validate semantic colors
    if (colors.semantic) {
      Object.entries(colors.semantic).forEach(([type, color]) => {
        if (!CSSVariableValidator.validateColor(color)) {
          invalidProperties.push(`colors.semantic.${type}`);
          errors.push({
            field: `colors.semantic.${type}`,
            message: `Invalid CSS color value for ${type}: "${color}"`,
            severity: 'error'
          });
        }
      });
    }
  }

  /**
   * Validate CSS gradient values
   */
  private validateCSSGradients(
    gradients: GradientSet,
    errors: ValidationError[],
    warnings: ValidationError[],
    invalidProperties: string[]
  ): void {
    Object.entries(gradients).forEach(([gradientName, gradient]) => {
      if (!gradient.colorStops || !Array.isArray(gradient.colorStops)) {
        errors.push({
          field: `gradients.${gradientName}.colorStops`,
          message: 'Gradient must have colorStops array',
          severity: 'error'
        });
        return;
      }

      // Validate each color stop
      gradient.colorStops.forEach((stop, index) => {
        if (!CSSVariableValidator.validateColor(stop.color)) {
          invalidProperties.push(`gradients.${gradientName}.colorStops[${index}].color`);
          errors.push({
            field: `gradients.${gradientName}.colorStops[${index}].color`,
            message: `Invalid color in gradient stop: "${stop.color}"`,
            severity: 'error'
          });
        }

        if (typeof stop.position !== 'number' || stop.position < 0 || stop.position > 100) {
          errors.push({
            field: `gradients.${gradientName}.colorStops[${index}].position`,
            message: `Invalid position in gradient stop: ${stop.position}. Must be 0-100`,
            severity: 'error'
          });
        }
      });

      // Validate gradient direction
      const validDirections = [
        'to top', 'to bottom', 'to left', 'to right',
        'to top left', 'to top right', 'to bottom left', 'to bottom right',
        /^\d+deg$/, // Angle in degrees
        /^-?\d+(\.\d+)?turn$/ // Turns
      ];

      const isValidDirection = validDirections.some(pattern => {
        if (typeof pattern === 'string') {
          return gradient.direction === pattern;
        }
        return pattern.test(gradient.direction);
      });

      if (!isValidDirection) {
        warnings.push({
          field: `gradients.${gradientName}.direction`,
          message: `Unusual gradient direction: "${gradient.direction}". Consider using standard directions.`,
          severity: 'warning'
        });
      }

      // Generate and validate full gradient CSS
      const gradientCSS = this.generateGradientCSS(gradient);
      if (!CSSVariableValidator.validateGradient(gradientCSS)) {
        invalidProperties.push(`gradients.${gradientName}`);
        errors.push({
          field: `gradients.${gradientName}`,
          message: `Generated gradient CSS is invalid: "${gradientCSS}"`,
          severity: 'error'
        });
      }
    });
  }

  /**
   * Validate CSS effect values
   */
  private validateCSSEffects(
    effects: EffectConfig,
    errors: ValidationError[],
    warnings: ValidationError[],
    invalidProperties: string[]
  ): void {
    // Validate backdrop blur
    if (effects.backdropBlur) {
      Object.entries(effects.backdropBlur).forEach(([size, value]) => {
        if (!CSSVariableValidator.validateBlur(value)) {
          invalidProperties.push(`effects.backdropBlur.${size}`);
          errors.push({
            field: `effects.backdropBlur.${size}`,
            message: `Invalid backdrop blur value: "${value}"`,
            severity: 'error'
          });
        }
      });
    }

    // Validate box shadows
    if (effects.boxShadow) {
      Object.entries(effects.boxShadow).forEach(([type, value]) => {
        if (!CSSVariableValidator.validateShadow(value)) {
          invalidProperties.push(`effects.boxShadow.${type}`);
          errors.push({
            field: `effects.boxShadow.${type}`,
            message: `Invalid box shadow value: "${value}"`,
            severity: 'error'
          });
        }
      });
    }

    // Validate border radius
    if (effects.borderRadius) {
      Object.entries(effects.borderRadius).forEach(([size, value]) => {
        if (!CSSVariableValidator.validateRadius(value)) {
          invalidProperties.push(`effects.borderRadius.${size}`);
          errors.push({
            field: `effects.borderRadius.${size}`,
            message: `Invalid border radius value: "${value}"`,
            severity: 'error'
          });
        }
      });
    }
  }

  /**
   * Validate color harmony and relationships
   */
  private validateColorHarmony(theme: Theme): { warnings: ValidationError[]; suggestions: string[] } {
    const warnings: ValidationError[] = [];
    const suggestions: string[] = [];

    if (!theme.colors) return { warnings, suggestions };

    // Check for sufficient contrast between primary and secondary
    if (theme.colors.primary && theme.colors.secondary) {
      const primaryMain = theme.colors.primary['500'];
      const secondaryMain = theme.colors.secondary['500'];
      
      if (primaryMain && secondaryMain) {
        const contrast = accessibilityValidator.calculateContrastRatio(primaryMain, secondaryMain);
        
        if (contrast < 1.5) {
          warnings.push({
            field: 'colors',
            message: 'Primary and secondary colors are very similar, consider more contrast',
            severity: 'warning'
          });
          suggestions.push('Increase contrast between primary and secondary colors for better visual hierarchy');
        }
      }
    }

    // Check for color temperature consistency
    const colorTemperatures = this.analyzeColorTemperatures(theme.colors);
    if (colorTemperatures.mixed) {
      warnings.push({
        field: 'colors',
        message: 'Color palette mixes warm and cool tones, which may affect visual harmony',
        severity: 'warning'
      });
      suggestions.push('Consider using colors with consistent temperature (all warm or all cool) for better harmony');
    }

    return { warnings, suggestions };
  }

  /**
   * Validate gradient configurations
   */
  private validateGradients(gradients: GradientSet): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    const requiredGradients = ['hero', 'card', 'button', 'background', 'accent'] as const;
    
    requiredGradients.forEach(gradientKey => {
      if (!gradients[gradientKey]) {
        errors.push({
          field: `gradients.${gradientKey}`,
          message: `Required gradient '${gradientKey}' is missing`,
          severity: 'error'
        });
        return;
      }

      const gradient = gradients[gradientKey];
      
      // Validate color stops
      if (!gradient.colorStops || gradient.colorStops.length < 2) {
        errors.push({
          field: `gradients.${gradientKey}.colorStops`,
          message: 'Gradient must have at least 2 color stops',
          severity: 'error'
        });
      } else {
        // Check for proper position ordering
        const positions = gradient.colorStops.map(stop => stop.position).sort((a, b) => a - b);
        const originalPositions = gradient.colorStops.map(stop => stop.position);
        
        if (JSON.stringify(positions) !== JSON.stringify(originalPositions)) {
          warnings.push({
            field: `gradients.${gradientKey}.colorStops`,
            message: 'Color stops should be ordered by position for predictable results',
            severity: 'warning'
          });
        }

        // Check for duplicate positions
        const uniquePositions = new Set(positions);
        if (uniquePositions.size !== positions.length) {
          warnings.push({
            field: `gradients.${gradientKey}.colorStops`,
            message: 'Gradient has duplicate positions, which may cause unexpected rendering',
            severity: 'warning'
          });
        }
      }

      // Validate usage field
      const validUsages = ['hero', 'card', 'button', 'background', 'accent'];
      if (!validUsages.includes(gradient.usage)) {
        warnings.push({
          field: `gradients.${gradientKey}.usage`,
          message: `Unusual usage value: "${gradient.usage}". Expected one of: ${validUsages.join(', ')}`,
          severity: 'warning'
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Validate typography configuration
   */
  private validateTypography(typography: TypographyConfig): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!typography) {
      errors.push({
        field: 'typography',
        message: 'Typography configuration is required',
        severity: 'error'
      });
      return { errors, warnings };
    }

    // Validate font families
    if (!typography.fontFamily) {
      errors.push({
        field: 'typography.fontFamily',
        message: 'Font family configuration is required',
        severity: 'error'
      });
    } else {
      const requiredFamilies = ['sans', 'serif', 'mono'];
      requiredFamilies.forEach(family => {
        if (!typography.fontFamily[family as keyof typeof typography.fontFamily]) {
          warnings.push({
            field: `typography.fontFamily.${family}`,
            message: `${family} font family is recommended`,
            severity: 'warning'
          });
        }
      });
    }

    // Validate font sizes
    if (!typography.fontSize) {
      errors.push({
        field: 'typography.fontSize',
        message: 'Font size scale is required',
        severity: 'error'
      });
    } else {
      const requiredSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];
      requiredSizes.forEach(size => {
        if (!typography.fontSize[size as keyof typeof typography.fontSize]) {
          warnings.push({
            field: `typography.fontSize.${size}`,
            message: `Font size '${size}' is recommended for complete scale`,
            severity: 'warning'
          });
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate effects configuration
   */
  private validateEffects(effects: EffectConfig): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!effects) {
      errors.push({
        field: 'effects',
        message: 'Effects configuration is required',
        severity: 'error'
      });
      return { errors, warnings };
    }

    // Validate required effect categories
    const requiredEffects = ['backdropBlur', 'boxShadow', 'borderRadius'];
    requiredEffects.forEach(effect => {
      if (!effects[effect as keyof typeof effects]) {
        warnings.push({
          field: `effects.${effect}`,
          message: `${effect} configuration is recommended`,
          severity: 'warning'
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * Generate CSS for gradient validation
   */
  private generateGradientCSS(gradient: any): string {
    const colorStops = gradient.colorStops
      .map((stop: any) => `${stop.color} ${stop.position}%`)
      .join(', ');
    
    return `linear-gradient(${gradient.direction}, ${colorStops})`;
  }

  /**
   * Analyze color temperatures for harmony validation
   */
  private analyzeColorTemperatures(colors: ColorPalette): { warm: number; cool: number; mixed: boolean } {
    let warmCount = 0;
    let coolCount = 0;

    const analyzeColor = (color: string) => {
      // Simple heuristic: analyze hue to determine temperature
      const rgb = this.hexToRgb(color);
      if (!rgb) return;

      const { r, g, b } = rgb;
      
      // Convert to HSL to get hue
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      
      if (diff === 0) return; // Grayscale
      
      let hue = 0;
      if (max === r) {
        hue = ((g - b) / diff) % 6;
      } else if (max === g) {
        hue = (b - r) / diff + 2;
      } else {
        hue = (r - g) / diff + 4;
      }
      
      hue = Math.round(hue * 60);
      if (hue < 0) hue += 360;
      
      // Warm colors: red, orange, yellow (0-60, 300-360)
      // Cool colors: green, blue, purple (120-240)
      if ((hue >= 0 && hue <= 60) || (hue >= 300 && hue <= 360)) {
        warmCount++;
      } else if (hue >= 120 && hue <= 240) {
        coolCount++;
      }
    };

    // Analyze main colors from each scale
    const scales = ['primary', 'secondary', 'accent'] as const;
    scales.forEach(scale => {
      const colorScale = colors[scale];
      if (colorScale && colorScale['500']) {
        analyzeColor(colorScale['500']);
      }
    });

    return {
      warm: warmCount,
      cool: coolCount,
      mixed: warmCount > 0 && coolCount > 0
    };
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    hex = hex.replace('#', '');
    
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    if (hex.length !== 6) return null;
    
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    return { r, g, b };
  }

  /**
   * Quick validation for basic theme structure
   */
  quickValidate(theme: Theme): boolean {
    return !!(
      theme &&
      theme.id &&
      theme.name &&
      theme.colors &&
      theme.gradients &&
      theme.typography &&
      theme.effects
    );
  }

  /**
   * Get validation summary
   */
  getValidationSummary(result: DetailedValidationResult): string {
    const { errors, warnings, suggestions } = result;
    
    let summary = `Validation ${result.isValid ? 'PASSED' : 'FAILED'}\n`;
    
    if (errors.length > 0) {
      summary += `\nErrors (${errors.length}):\n`;
      errors.forEach(error => {
        summary += `  • ${error.field}: ${error.message}\n`;
      });
    }
    
    if (warnings.length > 0) {
      summary += `\nWarnings (${warnings.length}):\n`;
      warnings.forEach(warning => {
        summary += `  • ${warning.field}: ${warning.message}\n`;
      });
    }
    
    if (suggestions && suggestions.length > 0) {
      summary += `\nSuggestions:\n`;
      suggestions.forEach(suggestion => {
        summary += `  • ${suggestion}\n`;
      });
    }
    
    return summary;
  }
}

// Export singleton instance
export const themeValidator = new ThemeValidator();