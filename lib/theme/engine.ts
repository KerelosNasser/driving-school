// Core theme engine for managing and applying themes with performance optimizations
import { 
  Theme, 
  ValidationResult, 
  ValidationError, 
  PreviewData, 
  ComponentPreview, 
  ComparisonData 
} from './types';
import { themeExtractor } from './extractor';
import { cssVariableManager } from './css-variables';
import { accessibilityValidator } from './accessibility';
import { themeStorage } from './storage';
import { themeCache } from './theme-cache';
import { performanceOptimizer } from './performance-optimizer';
import { errorRecoverySystem } from './error-recovery';

export interface ThemeEngine {
  loadTheme(themeId: string): Promise<Theme>;
  applyTheme(theme: Theme): void;
  validateTheme(theme: Theme): ValidationResult;
  generatePreview(theme: Theme): PreviewData;
  saveTheme(theme: Theme): Promise<string>;
  getDefaultTheme(): Theme;
  compareThemes(current: Theme, modified: Theme): ComparisonData;
}

export class ThemeEngineImpl implements ThemeEngine {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: Theme | null = null;
  private defaultTheme: Theme;

  constructor() {
    this.defaultTheme = themeExtractor.generateDefaultTheme();
    this.themes.set(this.defaultTheme.id, this.defaultTheme);
    this.currentTheme = this.defaultTheme;
  }

  /**
   * Load a theme by ID with performance optimizations
   */
  async loadTheme(themeId: string): Promise<Theme> {
    try {
      // Use lazy loading with caching
      return await performanceOptimizer.lazyLoadTheme(themeId, async () => {
        // Check advanced cache first
        const cached = themeCache.get(themeId);
        if (cached) {
          return cached;
        }

        // Check in-memory cache
        if (this.themes.has(themeId)) {
          const theme = this.themes.get(themeId)!;
          themeCache.set(themeId, theme);
          return theme;
        }

        // If requesting default theme, return it directly
        if (themeId === 'default' || themeId === this.defaultTheme.id) {
          themeCache.set(themeId, this.defaultTheme);
          return this.defaultTheme;
        }

        // Try to load from enhanced storage system
        const result = await themeStorage.loadTheme(themeId);
        
        if (result.success && result.data) {
          this.themes.set(themeId, result.data);
          themeCache.set(themeId, result.data);
          return result.data;
        }

        throw new Error(`Theme not found: ${themeId}. ${result.error || ''}`);
      });
    } catch (error) {
      // Use error recovery system
      const themeError = errorRecoverySystem.createError(
        `Failed to load theme: ${themeId}`,
        'THEME_LOAD_FAILED',
        { operation: 'theme-load', themeId },
        'high'
      );

      const recoveredTheme = await errorRecoverySystem.handleError(themeError);
      if (recoveredTheme) {
        return recoveredTheme;
      }

      throw error;
    }
  }

  /**
   * Apply a theme to the current page with performance optimizations
   */
  async applyTheme(theme: Theme): Promise<void> {
    try {
      // Ensure theme has all required sections by merging with defaults.
      const themeToApply = this.ensureCompleteTheme(theme);
      const validation = this.validateTheme(themeToApply);
      
      if (!validation.isValid) {
        const error = errorRecoverySystem.createError(
          'Theme validation failed',
          'THEME_VALIDATION_FAILED',
          { operation: 'theme-apply', themeId: theme.id },
          'high'
        );
        
        const recoveredTheme = await errorRecoverySystem.handleError(error);
        if (recoveredTheme) {
          theme = recoveredTheme;
        } else {
          throw new Error(`Invalid theme: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      // Apply theme via optimized CSS variables
  await cssVariableManager.optimizedUpdate(this.themeToVariables(themeToApply));

  // Update current theme
  this.currentTheme = themeToApply;

  // Store in caches
  this.themes.set(themeToApply.id, themeToApply);
  themeCache.set(themeToApply.id, themeToApply, 2); // Higher priority for applied themes

      // Emit theme change event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('themeChanged', { 
          detail: { theme } 
        }));
      }
    } catch (error) {
      const themeError = errorRecoverySystem.createError(
        'Failed to apply theme',
        'THEME_APPLICATION_FAILED',
        { operation: 'theme-apply', themeId: theme.id },
        'critical'
      );

      await errorRecoverySystem.handleError(themeError);
      throw error;
    }
  }

  /**
   * Ensure a theme has all required sections by merging missing pieces from the default theme.
   * This prevents partial admin presets from failing strict validation when applied live.
   */
  private ensureCompleteTheme(theme: Theme): Theme {
    // Shallow clone to avoid mutating caller object
    const merged: Theme = JSON.parse(JSON.stringify(this.defaultTheme));

    // Merge top-level
    merged.id = theme.id || merged.id;
    merged.name = theme.name || merged.name;
    // Preserve description if provided on incoming theme object (non-standard fields allowed)
    if ((theme as any).description) {
      (merged as any).description = (theme as any).description;
    }

    // Deep-merge common sections (colors, gradients, typography, effects, metadata)
    merged.colors = { ...merged.colors, ...(theme.colors || {}) } as any;
    merged.gradients = { ...merged.gradients, ...(theme.gradients || {}) } as any;
    merged.typography = { ...merged.typography, ...(theme.typography || {}) } as any;
    merged.effects = { ...merged.effects, ...(theme.effects || {}) } as any;
    merged.metadata = { ...merged.metadata, ...(theme.metadata || {}) } as any;

    // If theme provides specific nested maps (e.g., primary color shades), merge those too
    const colorScales = ['primary', 'secondary', 'accent', 'neutral'];
    colorScales.forEach(scale => {
      if (theme.colors && (theme.colors as any)[scale]) {
        (merged.colors as any)[scale] = { ...(merged.colors as any)[scale], ...(theme.colors as any)[scale] };
      }
    });

    // Apply any other top-level fields present on the provided theme
    Object.keys(theme).forEach(key => {
      if (!(merged as any)[key]) {
        (merged as any)[key] = (theme as any)[key];
      }
    });

    return merged;
  }

  /**
   * Validate a theme configuration
   */
  validateTheme(theme: Theme): ValidationResult {
    const errors: ValidationError[] = [];
    const _warnings: ValidationError[] = [];

    // Validate theme structure
    if (!theme.id || typeof theme.id !== 'string') {
      errors.push({
        field: 'id',
        message: 'Theme ID is required and must be a string',
        severity: 'error'
      });
    }

    if (!theme.name || typeof theme.name !== 'string') {
      errors.push({
        field: 'name',
        message: 'Theme name is required and must be a string',
        severity: 'error'
      });
    }

    // Validate colors
    if (!theme.colors) {
      errors.push({
        field: 'colors',
        message: 'Theme colors are required',
        severity: 'error'
      });
    } else {
      this.validateColorPalette(theme.colors, errors, _warnings);
    }

    // Validate gradients
    if (!theme.gradients) {
      errors.push({
        field: 'gradients',
        message: 'Theme gradients are required',
        severity: 'error'
      });
      } else {
      this.validateGradients(theme.gradients, errors, _warnings);
    }

    // Validate typography
    if (!theme.typography) {
      errors.push({
        field: 'typography',
        message: 'Theme typography is required',
        severity: 'error'
      });
    }

    // Validate effects
    if (!theme.effects) {
      errors.push({
        field: 'effects',
        message: 'Theme effects are required',
        severity: 'error'
      });
    }

    // Perform accessibility validation
    const accessibilityResult = accessibilityValidator.validateThemeAccessibility(theme);
    errors.push(...accessibilityResult.errors);
    _warnings.push(...accessibilityResult.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings: _warnings
    };
  }

  /**
   * Validate color palette for accessibility and consistency
   */
  private validateColorPalette(colors: any, errors: ValidationError[], warnings: ValidationError[]): void {
    const requiredScales = ['primary', 'secondary', 'accent', 'neutral'];
    
    requiredScales.forEach(scale => {
      if (!colors[scale]) {
        errors.push({
          field: `colors.${scale}`,
          message: `${scale} color scale is required`,
          severity: 'error'
        });
        return;
      }

      // Check for required shades
      const requiredShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
      requiredShades.forEach(shade => {
        if (!colors[scale][shade]) {
          warnings.push({
            field: `colors.${scale}.${shade}`,
            message: `Missing ${shade} shade in ${scale} color scale`,
            severity: 'warning'
          });
        } else if (!this.isValidColor(colors[scale][shade])) {
          errors.push({
            field: `colors.${scale}.${shade}`,
            message: `Invalid color value: ${colors[scale][shade]}`,
            severity: 'error'
          });
        }
      });

      // Check contrast ratios for accessibility
      if (colors[scale]['50'] && colors[scale]['900']) {
        const contrast = this.calculateContrast(colors[scale]['50'], colors[scale]['900']);
        if (contrast < 4.5) {
          warnings.push({
            field: `colors.${scale}`,
            message: `Low contrast ratio (${contrast.toFixed(2)}) between lightest and darkest shades`,
            severity: 'warning'
          });
        }
      }
    });

    // Validate semantic colors
    if (colors.semantic) {
      const semanticColors = ['success', 'warning', 'error', 'info'];
      semanticColors.forEach(semantic => {
        if (colors.semantic[semantic] && !this.isValidColor(colors.semantic[semantic])) {
          errors.push({
            field: `colors.semantic.${semantic}`,
            message: `Invalid semantic color value: ${colors.semantic[semantic]}`,
            severity: 'error'
          });
        }
      });
    }
  }

  /**
   * Validate gradient configurations
   */
  private validateGradients(gradients: any, errors: ValidationError[], warnings: ValidationError[]): void {
    const requiredGradients = ['hero', 'card', 'button', 'background', 'accent'];
    
    requiredGradients.forEach(gradientKey => {
      if (!gradients[gradientKey]) {
        errors.push({
          field: `gradients.${gradientKey}`,
          message: `${gradientKey} gradient is required`,
          severity: 'error'
        });
        return;
      }

      const gradient = gradients[gradientKey];
      
      if (!gradient.colorStops || !Array.isArray(gradient.colorStops)) {
        errors.push({
          field: `gradients.${gradientKey}.colorStops`,
          message: 'Gradient color stops are required and must be an array',
          severity: 'error'
        });
        return;
      }

      if (gradient.colorStops.length < 2) {
        errors.push({
          field: `gradients.${gradientKey}.colorStops`,
          message: 'Gradient must have at least 2 color stops',
          severity: 'error'
        });
      }

      gradient.colorStops.forEach((stop: any, index: number) => {
        if (!stop.color || !this.isValidColor(stop.color)) {
          errors.push({
            field: `gradients.${gradientKey}.colorStops[${index}].color`,
            message: `Invalid color in gradient stop: ${stop.color}`,
            severity: 'error'
          });
        }

        if (typeof stop.position !== 'number' || stop.position < 0 || stop.position > 100) {
          errors.push({
            field: `gradients.${gradientKey}.colorStops[${index}].position`,
            message: 'Gradient stop position must be a number between 0 and 100',
            severity: 'error'
          });
        }
      });
    });
  }

  /**
   * Check if a color value is valid
   */
  private isValidColor(color: string): boolean {
    if (typeof window === 'undefined') return true; // Skip validation on server
    
    const testElement = document.createElement('div');
    testElement.style.color = color;
    return testElement.style.color !== '';
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrast(color1: string, color2: string): number {
    return accessibilityValidator.calculateContrastRatio(color1, color2);
  }

  /**
   * Generate preview data for a theme
   */
  generatePreview(theme: Theme): PreviewData {
    const components: ComponentPreview[] = [
      {
        component: 'hero',
        html: this.generateHeroPreview(),
        styles: this.generateHeroStyles(theme)
      },
      {
        component: 'card',
        html: this.generateCardPreview(),
        styles: this.generateCardStyles(theme)
      },
      {
        component: 'button',
        html: this.generateButtonPreview(),
        styles: this.generateButtonStyles(theme)
      },
      {
        component: 'form',
        html: this.generateFormPreview(),
        styles: this.generateFormStyles(theme)
      }
    ];

    return {
      html: components.map(c => c.html).join('\n'),
      css: components.map(c => c.styles).join('\n'),
      components
    };
  }

  /**
   * Generate hero section preview HTML
   */
  private generateHeroPreview(): string {
    return `
      <div class="theme-preview-hero">
        <div class="hero-content">
          <h1>Professional Driving School</h1>
          <p>Learn to drive with confidence and safety</p>
          <button class="hero-button">Get Started</button>
        </div>
      </div>
    `;
  }

  /**
   * Generate hero section styles for theme
   */
  private generateHeroStyles(theme: Theme): string {
    const heroGradient = theme.gradients.hero;
    const gradientCss = `linear-gradient(${heroGradient.direction}, ${heroGradient.colorStops.map(s => `${s.color} ${s.position}%`).join(', ')})`;
    
    return `
      .theme-preview-hero {
        background: ${gradientCss};
        padding: 4rem 2rem;
        text-align: center;
        color: white;
        border-radius: ${theme.effects.borderRadius.xl};
      }
      .hero-content h1 {
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: 1rem;
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
      }
      .hero-content p {
        font-size: 1.25rem;
        margin-bottom: 2rem;
        opacity: 0.9;
      }
      .hero-button {
        background: ${theme.colors.primary[500]};
        color: white;
        padding: 0.75rem 2rem;
        border-radius: ${theme.effects.borderRadius.lg};
        border: none;
        font-weight: 600;
        cursor: pointer;
        box-shadow: ${theme.effects.boxShadow.button};
      }
    `;
  }

  /**
   * Generate card preview HTML
   */
  private generateCardPreview(): string {
    return `
      <div class="theme-preview-card">
        <h3>Course Information</h3>
        <p>Comprehensive driving lessons with certified instructors</p>
        <div class="card-badge">Popular</div>
      </div>
    `;
  }

  /**
   * Generate card styles for theme
   */
  private generateCardStyles(theme: Theme): string {
    return `
      .theme-preview-card {
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: ${theme.effects.backdropBlur.md};
        padding: 1.5rem;
        border-radius: ${theme.effects.borderRadius.xl};
        box-shadow: ${theme.effects.boxShadow.card};
        position: relative;
        margin: 1rem;
      }
      .theme-preview-card h3 {
        color: ${theme.colors.primary[900]};
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }
      .theme-preview-card p {
        color: ${theme.colors.neutral[600]};
        line-height: 1.6;
      }
      .card-badge {
        position: absolute;
        top: -0.5rem;
        right: 1rem;
        background: ${theme.colors.primary[500]};
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: ${theme.effects.borderRadius.full};
        font-size: 0.875rem;
        font-weight: 500;
      }
    `;
  }

  /**
   * Generate button preview HTML
   */
  private generateButtonPreview(): string {
    return `
      <div class="theme-preview-buttons">
        <button class="btn-primary">Primary Button</button>
        <button class="btn-secondary">Secondary Button</button>
      </div>
    `;
  }

  /**
   * Generate button styles for theme
   */
  private generateButtonStyles(theme: Theme): string {
    const buttonGradient = theme.gradients.button;
    const gradientCss = `linear-gradient(${buttonGradient.direction}, ${buttonGradient.colorStops.map(s => `${s.color} ${s.position}%`).join(', ')})`;
    
    return `
      .theme-preview-buttons {
        display: flex;
        gap: 1rem;
        padding: 1rem;
      }
      .btn-primary {
        background: ${gradientCss};
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: ${theme.effects.borderRadius.lg};
        font-weight: 600;
        cursor: pointer;
        box-shadow: ${theme.effects.boxShadow.button};
      }
      .btn-secondary {
        background: transparent;
        color: ${theme.colors.primary[600]};
        padding: 0.75rem 1.5rem;
        border: 2px solid ${theme.colors.primary[300]};
        border-radius: ${theme.effects.borderRadius.lg};
        font-weight: 600;
        cursor: pointer;
      }
    `;
  }

  /**
   * Generate form preview HTML
   */
  private generateFormPreview(): string {
    return `
      <div class="theme-preview-form">
        <label>Email Address</label>
        <input type="email" placeholder="Enter your email">
        <button type="submit">Subscribe</button>
      </div>
    `;
  }

  /**
   * Generate form styles for theme
   */
  private generateFormStyles(theme: Theme): string {
    return `
      .theme-preview-form {
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.95);
        border-radius: ${theme.effects.borderRadius.lg};
        backdrop-filter: ${theme.effects.backdropBlur.sm};
      }
      .theme-preview-form label {
        display: block;
        color: ${theme.colors.neutral[700]};
        font-weight: 500;
        margin-bottom: 0.5rem;
      }
      .theme-preview-form input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid ${theme.colors.neutral[200]};
        border-radius: ${theme.effects.borderRadius.md};
        margin-bottom: 1rem;
        font-size: 1rem;
      }
      .theme-preview-form input:focus {
        outline: none;
        border-color: ${theme.colors.primary[500]};
        box-shadow: 0 0 0 3px ${theme.colors.primary[100]};
      }
      .theme-preview-form button {
        background: ${theme.colors.primary[600]};
        color: white;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: ${theme.effects.borderRadius.md};
        font-weight: 600;
        cursor: pointer;
      }
    `;
  }

  /**
   * Save a theme to storage
   */
  async saveTheme(theme: Theme): Promise<string> {
    const validation = this.validateTheme(theme);
    
    if (!validation.isValid) {
      throw new Error(`Cannot save invalid theme: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Update metadata
    theme.metadata.updatedAt = new Date().toISOString();
    
    // Store in memory
    this.themes.set(theme.id, theme);

    // Use enhanced storage system
    const result = await themeStorage.saveTheme(theme);
    
    if (!result.success) {
      throw new Error(`Failed to save theme: ${result.error}`);
    }

    return theme.id;
  }

  /**
   * Get the default theme
   */
  getDefaultTheme(): Theme {
    return this.defaultTheme;
  }

  /**
   * Get the currently applied theme
   */
  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  /**
   * Compare two themes and return differences
   */
  compareThemes(current: Theme, modified: Theme): ComparisonData {
    const differences: string[] = [];

    // Compare colors
    this.compareColorPalettes(current.colors, modified.colors, differences);
    
    // Compare gradients
    this.compareGradients(current.gradients, modified.gradients, differences);
    
    // Compare effects
    this.compareEffects(current.effects, modified.effects, differences);

    return {
      current,
      modified,
      differences
    };
  }

  /**
   * Compare color palettes
   */
  private compareColorPalettes(current: any, modified: any, differences: string[]): void {
    const scales = ['primary', 'secondary', 'accent', 'neutral'];
    
    scales.forEach(scale => {
      if (current[scale] && modified[scale]) {
        Object.keys(current[scale]).forEach(shade => {
          if (current[scale][shade] !== modified[scale][shade]) {
            differences.push(`${scale}-${shade}: ${current[scale][shade]} → ${modified[scale][shade]}`);
          }
        });
      }
    });
  }

  /**
   * Compare gradients
   */
  private compareGradients(current: any, modified: any, differences: string[]): void {
    Object.keys(current).forEach(key => {
      if (JSON.stringify(current[key]) !== JSON.stringify(modified[key])) {
        differences.push(`gradient-${key}: Modified`);
      }
    });
  }

  /**
   * Compare effects
   */
  private compareEffects(current: any, modified: any, differences: string[]): void {
    const effectTypes = ['backdropBlur', 'boxShadow', 'borderRadius'];
    
    effectTypes.forEach(type => {
      if (current[type] && modified[type]) {
        Object.keys(current[type]).forEach(size => {
          if (current[type][size] !== modified[type][size]) {
            differences.push(`${type}-${size}: ${current[type][size]} → ${modified[type][size]}`);
          }
        });
      }
    });
  }

  /**
   * Convert theme object to CSS variable map (used by applyTheme)
   */
  private themeToVariables(theme: Theme): Record<string, string> {
    const variables: Record<string, string> = {};

    // Convert colors
    Object.entries(theme.colors.primary).forEach(([shade, color]) => {
      variables[`--theme-primary-${shade}`] = color as string;
    });

    Object.entries(theme.colors.secondary).forEach(([shade, color]) => {
      variables[`--theme-secondary-${shade}`] = color as string;
    });

    Object.entries(theme.colors.accent).forEach(([shade, color]) => {
      variables[`--theme-accent-${shade}`] = color as string;
    });

    Object.entries(theme.colors.neutral).forEach(([shade, color]) => {
      variables[`--theme-neutral-${shade}`] = color as string;
    });

    // Convert gradients
    Object.entries(theme.gradients).forEach(([key, gradient]) => {
      // safe stringify gradient stops
      const colorStops = (gradient.colorStops || []).map((stop: any) => `${stop.color} ${stop.position}%`).join(', ');
      variables[`--theme-gradient-${key}`] = `linear-gradient(${gradient.direction}, ${colorStops})`;
    });

    // Convert effects
    if (theme.effects?.backdropBlur) {
      Object.entries(theme.effects.backdropBlur).forEach(([size, value]) => {
        variables[`--theme-backdrop-blur-${size}`] = value as string;
      });
    }

    if (theme.effects?.boxShadow) {
      Object.entries(theme.effects.boxShadow).forEach(([type, value]) => {
        variables[`--theme-shadow-${type}`] = value as string;
      });
    }

    if (theme.effects?.borderRadius) {
      Object.entries(theme.effects.borderRadius).forEach(([size, value]) => {
        variables[`--theme-radius-${size}`] = value as string;
      });
    }

    // Convert typography
    try {
      variables['--theme-font-sans'] = theme.typography.fontFamily.sans.join(', ');
      variables['--theme-font-serif'] = theme.typography.fontFamily.serif.join(', ');
      variables['--theme-font-mono'] = theme.typography.fontFamily.mono.join(', ');
    } catch (e) {
      // If typography shape differs, fallback to defaults
    }

    return variables;
  }

  /**
   * Reset to default theme
   */
  resetToDefault(): void {
    this.applyTheme(this.defaultTheme);
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get all available themes from storage
   */
  async getAvailableThemesFromStorage(): Promise<Theme[]> {
    const result = await themeStorage.listThemes();
    
    if (!result.success || !result.data) {
      return [this.defaultTheme];
    }

    const themes: Theme[] = [this.defaultTheme];
    
    for (const metadata of result.data) {
      try {
        const theme = await this.loadTheme(metadata.id);
        themes.push(theme);
      } catch (error) {
        console.warn(`Failed to load theme ${metadata.id}:`, error);
      }
    }

    return themes;
  }

  /**
   * Delete a theme
   */
  async deleteTheme(themeId: string): Promise<boolean> {
    if (themeId === this.defaultTheme.id) {
      throw new Error('Cannot delete default theme');
    }

    // Remove from memory
    this.themes.delete(themeId);

    // Remove from storage
    const result = await themeStorage.deleteTheme(themeId);
    
    return result.success;
  }

  /**
   * Duplicate a theme with a new ID
   */
  async duplicateTheme(themeId: string, newName?: string): Promise<Theme> {
    const originalTheme = await this.loadTheme(themeId);
    
    const duplicatedTheme: Theme = {
      ...JSON.parse(JSON.stringify(originalTheme)), // Deep clone
      id: `${originalTheme.id}-copy-${Date.now()}`,
      name: newName || `${originalTheme.name} (Copy)`,
      metadata: {
        ...originalTheme.metadata,
        name: newName || `${originalTheme.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [...originalTheme.metadata.tags, 'duplicate']
      }
    };

    await this.saveTheme(duplicatedTheme);
    return duplicatedTheme;
  }

  /**
   * Create a custom theme from scratch
   */
  async createCustomTheme(themeData: {
    name: string;
    description?: string;
    author?: string;
    tags?: string[];
    baseThemeId?: string;
    colors?: Partial<Theme['colors']>;
    gradients?: Partial<Theme['gradients']>;
    typography?: Partial<Theme['typography']>;
    effects?: Partial<Theme['effects']>;
  }): Promise<Theme> {
    // Get base theme
    const baseTheme = themeData.baseThemeId 
      ? await this.loadTheme(themeData.baseThemeId)
      : this.getDefaultTheme();

    // Create new theme
    const customTheme: Theme = {
      ...baseTheme,
      id: `custom-${Date.now()}`,
      name: themeData.name,
      colors: themeData.colors ? { ...baseTheme.colors, ...themeData.colors } : baseTheme.colors,
      gradients: themeData.gradients ? { ...baseTheme.gradients, ...themeData.gradients } : baseTheme.gradients,
      typography: themeData.typography ? { ...baseTheme.typography, ...themeData.typography } : baseTheme.typography,
      effects: themeData.effects ? { ...baseTheme.effects, ...themeData.effects } : baseTheme.effects,
      metadata: {
        name: themeData.name,
        description: themeData.description || 'Custom theme',
        author: themeData.author || 'Theme Creator',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [...(themeData.tags || []), 'custom']
      }
    };

    await this.saveTheme(customTheme);
    return customTheme;
  }

  /**
   * Update theme metadata
   */
  async updateThemeMetadata(themeId: string, metadata: Partial<any>): Promise<Theme> {
    const theme = await this.loadTheme(themeId);
    
    const updatedTheme: Theme = {
      ...theme,
      name: metadata.name || theme.name,
      metadata: {
        ...theme.metadata,
        ...metadata,
        updatedAt: new Date().toISOString()
      }
    };

    await this.saveTheme(updatedTheme);
    return updatedTheme;
  }

  /**
   * Export theme for backup
   */
  async exportTheme(themeId: string): Promise<string> {
    const result = await themeStorage.exportTheme(themeId);
    
    if (!result.success || !result.data) {
      throw new Error(`Failed to export theme: ${result.error}`);
    }

    return result.data;
  }

  /**
   * Import theme from backup
   */
  async importTheme(exportData: string): Promise<Theme> {
    const result = await themeStorage.importTheme(exportData);
    
    if (!result.success || !result.data) {
      throw new Error(`Failed to import theme: ${result.error}`);
    }

    // Add to memory cache
    this.themes.set(result.data.id, result.data);
    
    return result.data;
  }

  /**
   * Get storage statistics
   */
  getStorageStats() {
    return themeStorage.getStorageStats();
  }

  /**
   * Clear all themes except default
   */
  async clearAllThemes(): Promise<void> {
    // Clear memory cache (except default)
    const defaultTheme = this.defaultTheme;
    this.themes.clear();
    this.themes.set(defaultTheme.id, defaultTheme);

    // Clear storage
    const result = await themeStorage.clearAll();
    
    if (!result.success) {
      throw new Error(`Failed to clear themes: ${result.error}`);
    }
  }

  /**
   * Validate theme accessibility and get suggestions
   */
  validateAccessibility(theme: Theme) {
    const validation = accessibilityValidator.validateThemeAccessibility(theme);
    const suggestions = accessibilityValidator.generateAccessibilitySuggestions(theme);
    
    return {
      ...validation,
      suggestions
    };
  }

  /**
   * Get theme validation with detailed accessibility report
   */
  getDetailedValidation(theme: Theme) {
    const basicValidation = this.validateTheme(theme);
    const accessibilityValidation = this.validateAccessibility(theme);
    
    return {
      basic: basicValidation,
      accessibility: accessibilityValidation
    };
  }
}

// Export singleton instance
export const themeEngine = new ThemeEngineImpl();