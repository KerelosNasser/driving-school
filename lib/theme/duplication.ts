// Theme duplication utilities for advanced theme management
import { Theme, ValidationResult } from './types';
import { themeEngine } from './engine';

export interface DuplicationOptions {
  preserveMetadata?: boolean;
  updateTimestamps?: boolean;
  generateNewId?: boolean;
  customName?: string;
  customDescription?: string;
  addTags?: string[];
  removeTags?: string[];
}

export interface DuplicationResult {
  success: boolean;
  theme?: Theme;
  error?: string;
  warnings?: string[];
}

export interface ThemeModification {
  colors?: {
    primary?: Partial<Record<string, string>>;
    secondary?: Partial<Record<string, string>>;
    accent?: Partial<Record<string, string>>;
    neutral?: Partial<Record<string, string>>;
  };
  gradients?: Partial<Theme['gradients']>;
  typography?: Partial<Theme['typography']>;
  effects?: Partial<Theme['effects']>;
  metadata?: Partial<Theme['metadata']>;
}

export class ThemeDuplicator {
  /**
   * Duplicate a theme with optional modifications
   */
  async duplicateTheme(
    sourceThemeId: string, 
    options: DuplicationOptions = {}
  ): Promise<DuplicationResult> {
    try {
      // Load source theme
      const sourceTheme = await themeEngine.loadTheme(sourceThemeId);
      const warnings: string[] = [];

      // Create base duplicated theme
      const duplicatedTheme: Theme = this.createBaseDuplicate(sourceTheme, options);

      // Apply any custom modifications
      if (options.customName) {
        duplicatedTheme.name = options.customName;
        duplicatedTheme.metadata.name = options.customName;
      }

      if (options.customDescription) {
        duplicatedTheme.metadata.description = options.customDescription;
      }

      // Handle tags
      if (options.addTags || options.removeTags) {
        duplicatedTheme.metadata.tags = this.processTags(
          duplicatedTheme.metadata.tags,
          options.addTags,
          options.removeTags
        );
      }

      // Validate duplicated theme
      const validation = themeEngine.validateTheme(duplicatedTheme);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Duplicated theme validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        };
      }

      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings.map(w => w.message));
      }

      // Save duplicated theme
      await themeEngine.saveTheme(duplicatedTheme);

      return {
        success: true,
        theme: duplicatedTheme,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Duplication failed'
      };
    }
  }

  /**
   * Duplicate and modify a theme in one operation
   */
  async duplicateAndModify(
    sourceThemeId: string,
    modifications: ThemeModification,
    options: DuplicationOptions = {}
  ): Promise<DuplicationResult> {
    try {
      // First duplicate the theme
      const duplicateResult = await this.duplicateTheme(sourceThemeId, options);
      
      if (!duplicateResult.success || !duplicateResult.theme) {
        return duplicateResult;
      }

      // Apply modifications
      const modifiedTheme = this.applyModifications(duplicateResult.theme, modifications);

      // Validate modified theme
      const validation = themeEngine.validateTheme(modifiedTheme);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Modified theme validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        };
      }

      // Save modified theme
      await themeEngine.saveTheme(modifiedTheme);

      return {
        success: true,
        theme: modifiedTheme,
        warnings: duplicateResult.warnings
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Duplication and modification failed'
      };
    }
  }

  /**
   * Create multiple variations of a theme
   */
  async createThemeVariations(
    sourceThemeId: string,
    variations: Array<{
      name: string;
      description?: string;
      modifications: ThemeModification;
      tags?: string[];
    }>
  ): Promise<{
    success: boolean;
    themes?: Theme[];
    errors?: string[];
    warnings?: string[];
  }> {
    const createdThemes: Theme[] = [];
    const errors: string[] = [];
    const allWarnings: string[] = [];

    for (const variation of variations) {
      try {
        const result = await this.duplicateAndModify(
          sourceThemeId,
          variation.modifications,
          {
            customName: variation.name,
            customDescription: variation.description,
            addTags: variation.tags,
            generateNewId: true,
            updateTimestamps: true
          }
        );

        if (result.success && result.theme) {
          createdThemes.push(result.theme);
          if (result.warnings) {
            allWarnings.push(...result.warnings);
          }
        } else {
          errors.push(`Failed to create variation "${variation.name}": ${result.error}`);
        }
      } catch (error) {
        errors.push(`Error creating variation "${variation.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: createdThemes.length > 0,
      themes: createdThemes,
      errors: errors.length > 0 ? errors : undefined,
      warnings: allWarnings.length > 0 ? allWarnings : undefined
    };
  }

  /**
   * Create seasonal variations of a theme
   */
  async createSeasonalVariations(sourceThemeId: string): Promise<{
    success: boolean;
    themes?: Theme[];
    errors?: string[];
  }> {
    const seasonalVariations = [
      {
        name: 'Spring Fresh',
        description: 'Fresh spring colors with vibrant greens',
        modifications: {
          colors: {
            primary: { 500: '#22c55e' }, // Fresh green
            secondary: { 500: '#16a34a' },
            accent: { 500: '#eab308' } // Bright yellow
          }
        },
        tags: ['spring', 'fresh', 'green', 'seasonal']
      },
      {
        name: 'Summer Bright',
        description: 'Bright summer theme with warm colors',
        modifications: {
          colors: {
            primary: { 500: '#f97316' }, // Orange
            secondary: { 500: '#ea580c' },
            accent: { 500: '#06b6d4' } // Cyan
          }
        },
        tags: ['summer', 'bright', 'warm', 'seasonal']
      },
      {
        name: 'Autumn Warm',
        description: 'Warm autumn colors with rich tones',
        modifications: {
          colors: {
            primary: { 500: '#dc2626' }, // Red
            secondary: { 500: '#b91c1c' },
            accent: { 500: '#f59e0b' } // Amber
          }
        },
        tags: ['autumn', 'warm', 'rich', 'seasonal']
      },
      {
        name: 'Winter Cool',
        description: 'Cool winter theme with blue tones',
        modifications: {
          colors: {
            primary: { 500: '#1e40af' }, // Blue
            secondary: { 500: '#1e3a8a' },
            accent: { 500: '#8b5cf6' } // Purple
          }
        },
        tags: ['winter', 'cool', 'blue', 'seasonal']
      }
    ];

    return await this.createThemeVariations(sourceThemeId, seasonalVariations);
  }

  /**
   * Create accessibility-focused variations
   */
  async createAccessibilityVariations(sourceThemeId: string): Promise<{
    success: boolean;
    themes?: Theme[];
    errors?: string[];
  }> {
    const accessibilityVariations = [
      {
        name: 'High Contrast',
        description: 'High contrast version for better accessibility',
        modifications: {
          colors: {
            primary: { 500: '#000000' },
            secondary: { 500: '#ffffff' },
            neutral: { 
              50: '#ffffff',
              900: '#000000'
            }
          }
        },
        tags: ['accessibility', 'high-contrast', 'a11y']
      },
      {
        name: 'Colorblind Friendly',
        description: 'Optimized for colorblind users',
        modifications: {
          colors: {
            primary: { 500: '#0066cc' }, // Blue
            secondary: { 500: '#ff6600' }, // Orange
            accent: { 500: '#009900' } // Green
          }
        },
        tags: ['accessibility', 'colorblind', 'a11y']
      }
    ];

    return await this.createThemeVariations(sourceThemeId, accessibilityVariations);
  }

  /**
   * Create base duplicate of a theme
   */
  private createBaseDuplicate(sourceTheme: Theme, options: DuplicationOptions): Theme {
    const now = new Date().toISOString();
    
    return {
      ...JSON.parse(JSON.stringify(sourceTheme)), // Deep clone
      id: options.generateNewId !== false ? `${sourceTheme.id}-copy-${Date.now()}` : sourceTheme.id,
      name: options.customName || `${sourceTheme.name} (Copy)`,
      metadata: {
        ...sourceTheme.metadata,
        name: options.customName || `${sourceTheme.name} (Copy)`,
        description: options.customDescription || sourceTheme.metadata.description,
        createdAt: options.updateTimestamps !== false ? now : sourceTheme.metadata.createdAt,
        updatedAt: options.updateTimestamps !== false ? now : sourceTheme.metadata.updatedAt,
        tags: [...sourceTheme.metadata.tags, 'duplicate']
      }
    };
  }

  /**
   * Apply modifications to a theme
   */
  private applyModifications(theme: Theme, modifications: ThemeModification): Theme {
    const modifiedTheme = { ...theme };

    // Apply color modifications
    if (modifications.colors) {
      Object.entries(modifications.colors).forEach(([colorType, colorChanges]) => {
        if (colorChanges && modifiedTheme.colors[colorType as keyof typeof modifiedTheme.colors]) {
          modifiedTheme.colors[colorType as keyof typeof modifiedTheme.colors] = {
            ...modifiedTheme.colors[colorType as keyof typeof modifiedTheme.colors],
            ...colorChanges
          } as any;
        }
      });
    }

    // Apply gradient modifications
    if (modifications.gradients) {
      modifiedTheme.gradients = {
        ...modifiedTheme.gradients,
        ...modifications.gradients
      };
    }

    // Apply typography modifications
    if (modifications.typography) {
      modifiedTheme.typography = {
        ...modifiedTheme.typography,
        ...modifications.typography
      };
    }

    // Apply effects modifications
    if (modifications.effects) {
      modifiedTheme.effects = {
        ...modifiedTheme.effects,
        ...modifications.effects
      };
    }

    // Apply metadata modifications
    if (modifications.metadata) {
      modifiedTheme.metadata = {
        ...modifiedTheme.metadata,
        ...modifications.metadata,
        updatedAt: new Date().toISOString()
      };
    }

    return modifiedTheme;
  }

  /**
   * Process tags (add/remove)
   */
  private processTags(
    currentTags: string[],
    addTags?: string[],
    removeTags?: string[]
  ): string[] {
    let tags = [...currentTags];

    // Remove tags
    if (removeTags) {
      tags = tags.filter(tag => !removeTags.includes(tag));
    }

    // Add tags
    if (addTags) {
      addTags.forEach(tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    }

    return tags;
  }

  /**
   * Get duplication statistics
   */
  async getDuplicationStats(themeId: string): Promise<{
    originalTheme: Theme;
    duplicateCount: number;
    duplicates: Theme[];
  }> {
    const originalTheme = await themeEngine.loadTheme(themeId);
    const allThemes = await themeEngine.getAvailableThemesFromStorage();
    
    // Find themes that are duplicates of this theme
    const duplicates = allThemes.filter(theme => 
      theme.id !== themeId && 
      (theme.id.startsWith(`${themeId}-copy-`) || 
       theme.metadata.tags.includes('duplicate'))
    );

    return {
      originalTheme,
      duplicateCount: duplicates.length,
      duplicates
    };
  }

  /**
   * Clean up old duplicates
   */
  async cleanupOldDuplicates(themeId: string, keepCount: number = 5): Promise<{
    success: boolean;
    deletedCount: number;
    errors?: string[];
  }> {
    try {
      const stats = await this.getDuplicationStats(themeId);
      
      if (stats.duplicateCount <= keepCount) {
        return {
          success: true,
          deletedCount: 0
        };
      }

      // Sort duplicates by creation date (oldest first)
      const sortedDuplicates = stats.duplicates.sort((a, b) => 
        new Date(a.metadata.createdAt).getTime() - new Date(b.metadata.createdAt).getTime()
      );

      // Delete oldest duplicates
      const toDelete = sortedDuplicates.slice(0, stats.duplicateCount - keepCount);
      const errors: string[] = [];
      let deletedCount = 0;

      for (const duplicate of toDelete) {
        try {
          await themeEngine.deleteTheme(duplicate.id);
          deletedCount++;
        } catch (error) {
          errors.push(`Failed to delete ${duplicate.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: true,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        errors: [error instanceof Error ? error.message : 'Cleanup failed']
      };
    }
  }
}

// Export singleton instance
export const themeDuplicator = new ThemeDuplicator();