// Integration layer for theme validation and error handling
import { Theme, ValidationResult, ValidationError } from './types';
import { themeValidator, DetailedValidationResult, ThemeValidationOptions } from './validation';
import { themeErrorHandler, ErrorRecoveryOptions, ThemeError } from './error-handling';
import { accessibilityValidator } from './accessibility';

export interface ValidationIntegrationOptions extends ThemeValidationOptions, ErrorRecoveryOptions {
  autoRecover?: boolean;
  generateReport?: boolean;
  trackErrors?: boolean;
}

export interface ValidationReport {
  theme: Theme;
  originalTheme: Theme;
  validation: DetailedValidationResult;
  recovered: boolean;
  recoveryActions: string[];
  errors: ThemeError[];
  warnings: ThemeError[];
  suggestions: string[];
  accessibilityScore: number;
  summary: string;
  timestamp: string;
}

export class ValidationIntegration {
  /**
   * Comprehensive theme validation with automatic error recovery
   */
  static validateAndRecover(
    theme: Theme, 
    options: ValidationIntegrationOptions = {}
  ): ValidationReport {
    const startTime = Date.now();
    const originalTheme = JSON.parse(JSON.stringify(theme)); // Deep clone
    
    const defaultOptions: ValidationIntegrationOptions = {
      strict: false,
      checkAccessibility: true,
      validateCSS: true,
      requireAllFields: false,
      autoRecover: true,
      useDefaultTheme: false,
      preservePartialTheme: true,
      logErrors: true,
      notifyUser: false,
      generateReport: true,
      trackErrors: true,
      ...options
    };

    // Step 1: Initial validation
    const validation = themeValidator.validateTheme(theme, {
      strict: defaultOptions.strict,
      checkAccessibility: defaultOptions.checkAccessibility,
      validateCSS: defaultOptions.validateCSS,
      requireAllFields: defaultOptions.requireAllFields
    });

    let finalTheme = theme;
    let recovered = false;
    let recoveryActions: string[] = [];
    let allErrors: ThemeError[] = [];
    let allWarnings: ThemeError[] = [];

    // Step 2: Handle errors if validation failed
    if (!validation.isValid && defaultOptions.autoRecover) {
      const recovery = themeErrorHandler.handleThemeError(theme, validation.errors, {
        useDefaultTheme: defaultOptions.useDefaultTheme,
        preservePartialTheme: defaultOptions.preservePartialTheme,
        logErrors: defaultOptions.logErrors,
        notifyUser: defaultOptions.notifyUser
      });

      finalTheme = recovery.theme;
      recovered = recovery.recovered;
      allErrors = recovery.errors;

      // Track recovery actions
      recoveryActions = recovery.errors
        .filter(e => e.fallbackAction)
        .map(e => e.fallbackAction!)
        .filter((action, index, arr) => arr.indexOf(action) === index); // Remove duplicates
    } else {
      // Convert validation errors to theme errors
      allErrors = validation.errors.map(e => this.validationErrorToThemeError(e));
    }

    // Convert warnings
    allWarnings = validation.warnings.map(w => this.validationErrorToThemeError(w));

    // Step 3: Calculate accessibility score
    const accessibilityScore = this.calculateAccessibilityScore(validation);

    // Step 4: Gather all suggestions
    const suggestions = [
      ...(validation.suggestions || []),
      ...this.generateRecoverySuggestions(recoveryActions),
      ...this.generatePerformanceSuggestions(finalTheme)
    ];

    // Step 5: Generate summary
    const summary = this.generateValidationSummary({
      validation,
      recovered,
      recoveryActions,
      errors: allErrors,
      warnings: allWarnings,
      accessibilityScore,
      processingTime: Date.now() - startTime
    });

    return {
      theme: finalTheme,
      originalTheme,
      validation,
      recovered,
      recoveryActions,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: Array.from(new Set(suggestions)), // Remove duplicates
      accessibilityScore,
      summary,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Quick validation check for theme compatibility
   */
  static quickCheck(theme: Theme): {
    isValid: boolean;
    criticalIssues: string[];
    recommendations: string[];
  } {
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Check basic structure
    if (!themeValidator.quickValidate(theme)) {
      criticalIssues.push('Theme is missing required fields');
    }

    // Check for common issues
    if (!theme.id || theme.id.length < 3) {
      criticalIssues.push('Theme ID is missing or too short');
    }

    if (!theme.name || theme.name.trim().length === 0) {
      criticalIssues.push('Theme name is required');
    }

    // Check color accessibility
    if (theme.colors?.primary?.['500'] && theme.colors?.primary?.['100']) {
      const contrast = accessibilityValidator.calculateContrastRatio(
        theme.colors.primary['500'],
        theme.colors.primary['100']
      );
      if (contrast < 4.5) {
        recommendations.push('Primary color contrast may not meet accessibility standards');
      }
    }

    // Check gradient completeness
    const requiredGradients = ['hero', 'card', 'button', 'background', 'accent'];
    const missingGradients = requiredGradients.filter(g => !theme.gradients?.[g as keyof typeof theme.gradients]);
    if (missingGradients.length > 0) {
      recommendations.push(`Missing gradients: ${missingGradients.join(', ')}`);
    }

    return {
      isValid: criticalIssues.length === 0,
      criticalIssues,
      recommendations
    };
  }

  /**
   * Batch validate multiple themes
   */
  static batchValidate(
    themes: Theme[], 
    options: ValidationIntegrationOptions = {}
  ): ValidationReport[] {
    return themes.map(theme => this.validateAndRecover(theme, options));
  }

  /**
   * Compare two themes for compatibility
   */
  static compareThemes(theme1: Theme, theme2: Theme): {
    compatible: boolean;
    differences: string[];
    recommendations: string[];
  } {
    const differences: string[] = [];
    const recommendations: string[] = [];

    // Compare structure
    if (theme1.id !== theme2.id) {
      differences.push(`Different IDs: ${theme1.id} vs ${theme2.id}`);
    }

    // Compare color palettes
    const colorScales = ['primary', 'secondary', 'accent', 'neutral'] as const;
    colorScales.forEach(scale => {
      const colors1 = theme1.colors?.[scale];
      const colors2 = theme2.colors?.[scale];
      
      if (colors1 && colors2) {
        const shades = ['500', '600', '700'] as const;
        shades.forEach(shade => {
          if (colors1[shade] !== colors2[shade]) {
            differences.push(`Different ${scale}-${shade}: ${colors1[shade]} vs ${colors2[shade]}`);
          }
        });
      }
    });

    // Compare gradients
    const gradientTypes = ['hero', 'card', 'button'] as const;
    gradientTypes.forEach(type => {
      const grad1 = theme1.gradients?.[type];
      const grad2 = theme2.gradients?.[type];
      
      if (grad1 && grad2) {
        if (grad1.direction !== grad2.direction) {
          differences.push(`Different ${type} gradient direction: ${grad1.direction} vs ${grad2.direction}`);
        }
        
        if (grad1.colorStops.length !== grad2.colorStops.length) {
          differences.push(`Different ${type} gradient complexity: ${grad1.colorStops.length} vs ${grad2.colorStops.length} stops`);
        }
      }
    });

    // Generate compatibility recommendations
    if (differences.length > 10) {
      recommendations.push('Themes are significantly different - consider gradual migration');
    } else if (differences.length > 5) {
      recommendations.push('Themes have moderate differences - test thoroughly before switching');
    } else if (differences.length > 0) {
      recommendations.push('Themes have minor differences - should be compatible');
    }

    return {
      compatible: differences.length < 5,
      differences,
      recommendations
    };
  }

  /**
   * Generate theme health score
   */
  static calculateHealthScore(theme: Theme): {
    score: number;
    breakdown: {
      structure: number;
      accessibility: number;
      completeness: number;
      consistency: number;
    };
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  } {
    const validation = themeValidator.validateTheme(theme, {
      strict: true,
      checkAccessibility: true,
      validateCSS: true,
      requireAllFields: true
    });

    // Structure score (0-25)
    const structureScore = validation.structuralValidation?.isValid ? 25 : 
      Math.max(0, 25 - (validation.structuralValidation?.errors.length || 0) * 5);

    // Accessibility score (0-25)
    const accessibilityScore = this.calculateAccessibilityScore(validation);

    // Completeness score (0-25)
    const completenessScore = this.calculateCompletenessScore(theme);

    // Consistency score (0-25)
    const consistencyScore = this.calculateConsistencyScore(theme);

    const totalScore = structureScore + accessibilityScore + completenessScore + consistencyScore;

    const grade = totalScore >= 90 ? 'A' :
                  totalScore >= 80 ? 'B' :
                  totalScore >= 70 ? 'C' :
                  totalScore >= 60 ? 'D' : 'F';

    return {
      score: totalScore,
      breakdown: {
        structure: structureScore,
        accessibility: accessibilityScore,
        completeness: completenessScore,
        consistency: consistencyScore
      },
      grade
    };
  }

  /**
   * Convert ValidationError to ThemeError
   */
  private static validationErrorToThemeError(validationError: ValidationError): ThemeError {
    const error = new Error(validationError.message) as ThemeError;
    error.code = 'VALIDATION_ERROR';
    error.field = validationError.field;
    error.severity = validationError.severity === 'error' ? 'high' : 'medium';
    error.recoverable = true;
    return error;
  }

  /**
   * Calculate accessibility score from validation results
   */
  private static calculateAccessibilityScore(validation: DetailedValidationResult): number {
    if (!validation.accessibility) return 15; // Partial score if not checked

    const { accessibility } = validation;
    const totalChecks = accessibility.contrastRatios.length;
    
    if (totalChecks === 0) return 15;

    const passedChecks = accessibility.contrastRatios.filter(ratio => ratio.level !== 'fail').length;
    const aaChecks = accessibility.contrastRatios.filter(ratio => ratio.level === 'AA').length;
    const aaaChecks = accessibility.contrastRatios.filter(ratio => ratio.level === 'AAA').length;

    // Base score for passing checks
    let score = (passedChecks / totalChecks) * 15;
    
    // Bonus for AA compliance
    score += (aaChecks / totalChecks) * 5;
    
    // Bonus for AAA compliance
    score += (aaaChecks / totalChecks) * 5;

    return Math.min(25, Math.round(score));
  }

  /**
   * Calculate completeness score
   */
  private static calculateCompletenessScore(theme: Theme): number {
    let score = 0;

    // Check required fields (10 points)
    const requiredFields = ['id', 'name', 'colors', 'gradients', 'typography', 'effects'];
    const presentFields = requiredFields.filter(field => theme[field as keyof Theme]);
    score += (presentFields.length / requiredFields.length) * 10;

    // Check color completeness (5 points)
    const colorScales = ['primary', 'secondary', 'accent', 'neutral'];
    const completeScales = colorScales.filter(scale => {
      const colorScale = theme.colors?.[scale as keyof typeof theme.colors];
      return colorScale && Object.keys(colorScale).length >= 5; // At least 5 shades
    });
    score += (completeScales.length / colorScales.length) * 5;

    // Check gradient completeness (5 points)
    const requiredGradients = ['hero', 'card', 'button', 'background', 'accent'];
    const presentGradients = requiredGradients.filter(grad => 
      theme.gradients?.[grad as keyof typeof theme.gradients]
    );
    score += (presentGradients.length / requiredGradients.length) * 5;

    // Check metadata completeness (5 points)
    const metadataFields = ['name', 'description', 'author', 'version'];
    const presentMetadata = metadataFields.filter(field => 
      theme.metadata?.[field as keyof typeof theme.metadata]
    );
    score += (presentMetadata.length / metadataFields.length) * 5;

    return Math.round(score);
  }

  /**
   * Calculate consistency score
   */
  private static calculateConsistencyScore(theme: Theme): number {
    let score = 25; // Start with full score, deduct for inconsistencies

    // Check color harmony
    if (theme.colors?.primary && theme.colors?.secondary) {
      const primaryMain = theme.colors.primary['500'];
      const secondaryMain = theme.colors.secondary['500'];
      
      if (primaryMain && secondaryMain) {
        const contrast = accessibilityValidator.calculateContrastRatio(primaryMain, secondaryMain);
        if (contrast < 1.5) {
          score -= 5; // Deduct for very similar colors
        }
      }
    }

    // Check gradient consistency
    if (theme.gradients) {
      const directions = Object.values(theme.gradients).map(g => g.direction);
      const uniqueDirections = new Set(directions);
      
      if (uniqueDirections.size > 3) {
        score -= 5; // Deduct for too many different directions
      }
    }

    // Check typography consistency
    if (theme.typography?.fontSize) {
      const sizes = Object.values(theme.typography.fontSize);
      const numericSizes = sizes.map(size => parseFloat(size)).filter(n => !isNaN(n));
      
      if (numericSizes.length > 1) {
        const ratios = numericSizes.slice(1).map((size, i) => size / numericSizes[i]);
        const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        
        // Check if ratios are consistent (around 1.2-1.5 is good)
        if (avgRatio < 1.1 || avgRatio > 1.6) {
          score -= 3; // Deduct for inconsistent scaling
        }
      }
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Generate recovery suggestions
   */
  private static generateRecoverySuggestions(recoveryActions: string[]): string[] {
    const suggestions: string[] = [];

    if (recoveryActions.includes('fix-colors')) {
      suggestions.push('Some colors were invalid and have been replaced with defaults');
    }

    if (recoveryActions.includes('fix-gradients')) {
      suggestions.push('Invalid gradients were replaced with default equivalents');
    }

    if (recoveryActions.includes('merge-default')) {
      suggestions.push('Missing theme properties were filled with default values');
    }

    if (recoveryActions.includes('default-theme')) {
      suggestions.push('Theme had critical errors and was replaced with the default theme');
    }

    return suggestions;
  }

  /**
   * Generate performance suggestions
   */
  private static generatePerformanceSuggestions(theme: Theme): string[] {
    const suggestions: string[] = [];

    // Check for complex gradients
    if (theme.gradients) {
      const complexGradients = Object.values(theme.gradients).filter(g => 
        g.colorStops && g.colorStops.length > 4
      );
      
      if (complexGradients.length > 0) {
        suggestions.push('Consider simplifying gradients with many color stops for better performance');
      }
    }

    // Check for excessive shadow complexity
    if (theme.effects?.boxShadow) {
      const complexShadows = Object.values(theme.effects.boxShadow).filter(shadow => 
        shadow.split(',').length > 2
      );
      
      if (complexShadows.length > 0) {
        suggestions.push('Multiple layered shadows may impact rendering performance');
      }
    }

    return suggestions;
  }

  /**
   * Generate comprehensive validation summary
   */
  private static generateValidationSummary(data: {
    validation: DetailedValidationResult;
    recovered: boolean;
    recoveryActions: string[];
    errors: ThemeError[];
    warnings: ThemeError[];
    accessibilityScore: number;
    processingTime: number;
  }): string {
    const { validation, recovered, recoveryActions, errors, warnings, accessibilityScore, processingTime } = data;
    
    let summary = `Theme Validation ${validation.isValid ? 'PASSED' : (recovered ? 'RECOVERED' : 'FAILED')}\n`;
    summary += `Processing time: ${processingTime}ms\n`;
    summary += `Accessibility score: ${accessibilityScore}/25\n\n`;

    if (errors.length > 0) {
      summary += `Errors (${errors.length}):\n`;
      errors.slice(0, 5).forEach(error => {
        summary += `  • ${error.field}: ${error.message}\n`;
      });
      if (errors.length > 5) {
        summary += `  ... and ${errors.length - 5} more errors\n`;
      }
      summary += '\n';
    }

    if (warnings.length > 0) {
      summary += `Warnings (${warnings.length}):\n`;
      warnings.slice(0, 3).forEach(warning => {
        summary += `  • ${warning.field}: ${warning.message}\n`;
      });
      if (warnings.length > 3) {
        summary += `  ... and ${warnings.length - 3} more warnings\n`;
      }
      summary += '\n';
    }

    if (recoveryActions.length > 0) {
      summary += `Recovery actions applied:\n`;
      recoveryActions.forEach(action => {
        summary += `  • ${action}\n`;
      });
      summary += '\n';
    }

    if (validation.accessibility && !validation.accessibility.isCompliant) {
      summary += `Accessibility issues detected. Consider improving color contrast.\n`;
    }

    return summary;
  }
}

// Export convenience functions
export const validateTheme = ValidationIntegration.validateAndRecover;
export const quickCheckTheme = ValidationIntegration.quickCheck;
export const compareThemes = ValidationIntegration.compareThemes;
export const calculateThemeHealth = ValidationIntegration.calculateHealthScore;