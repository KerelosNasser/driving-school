// Theme import/export utilities for advanced theme management
import { Theme, ValidationResult } from './types';
import { themeEngine } from './engine';

export interface ExportOptions {
  includeMetadata?: boolean;
  includePreview?: boolean;
  compress?: boolean;
  format?: 'json' | 'yaml';
}

export interface ImportOptions {
  validateTheme?: boolean;
  overwriteExisting?: boolean;
  generateNewId?: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: string;
  error?: string;
  size?: number;
}

export interface ImportResult {
  success: boolean;
  theme?: Theme;
  error?: string;
  warnings?: string[];
}

export interface ThemeExportData {
  theme: Theme;
  exportedAt: string;
  exportedBy: string;
  version: string;
  format: string;
  checksum?: string;
}

export class ThemeImportExport {
  private readonly EXPORT_VERSION = '1.0.0';
  private readonly SUPPORTED_VERSIONS = ['1.0.0'];

  /**
   * Export a theme to JSON format
   */
  async exportTheme(themeId: string, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const theme = await themeEngine.loadTheme(themeId);
      
      const exportData: ThemeExportData = {
        theme,
        exportedAt: new Date().toISOString(),
        exportedBy: 'EG Driving School Theme Manager',
        version: this.EXPORT_VERSION,
        format: options.format || 'json'
      };

      // Add checksum for integrity verification
      if (options.includeMetadata !== false) {
        exportData.checksum = this.generateChecksum(theme);
      }

      // Generate export string
      let exportString: string;
      
      if (options.format === 'yaml') {
        // For future YAML support
        exportString = JSON.stringify(exportData, null, 2);
      } else {
        exportString = options.compress 
          ? JSON.stringify(exportData)
          : JSON.stringify(exportData, null, 2);
      }

      return {
        success: true,
        data: exportString,
        size: new Blob([exportString]).size
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  /**
   * Import a theme from JSON data
   */
  async importTheme(importData: string, options: ImportOptions = {}): Promise<ImportResult> {
    try {
      // Parse import data
      const parsedData = this.parseImportData(importData);
      if (!parsedData.success) {
        return {
          success: false,
          error: parsedData.error
        };
      }

      const exportData = parsedData.data!;
      const warnings: string[] = [];

      // Version compatibility check
      if (!this.SUPPORTED_VERSIONS.includes(exportData.version)) {
        warnings.push(`Unsupported export version: ${exportData.version}. Attempting import anyway.`);
      }

      // Verify checksum if present
      if (exportData.checksum) {
        const calculatedChecksum = this.generateChecksum(exportData.theme);
        if (calculatedChecksum !== exportData.checksum) {
          warnings.push('Checksum mismatch detected. Theme data may be corrupted.');
        }
      }

      let theme = exportData.theme;

      // Generate new ID if requested or if theme already exists
      if (options.generateNewId || (!options.overwriteExisting && await this.themeExists(theme.id))) {
        theme = {
          ...theme,
          id: `imported-${Date.now()}`,
          name: `${theme.name} (Imported)`,
          metadata: {
            ...theme.metadata,
            name: `${theme.name} (Imported)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      }

      // Validate theme if requested
      if (options.validateTheme !== false) {
        const validation = themeEngine.validateTheme(theme);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Invalid theme data: ${validation.errors.map(e => e.message).join(', ')}`
          };
        }

        if (validation.warnings.length > 0) {
          warnings.push(...validation.warnings.map(w => w.message));
        }
      }

      // Save imported theme
      await themeEngine.saveTheme(theme);

      return {
        success: true,
        theme,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      };
    }
  }

  /**
   * Export multiple themes as a collection
   */
  async exportThemeCollection(themeIds: string[], options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const themes: Theme[] = [];
      
      for (const themeId of themeIds) {
        const theme = await themeEngine.loadTheme(themeId);
        themes.push(theme);
      }

      const exportData = {
        themes,
        exportedAt: new Date().toISOString(),
        exportedBy: 'EG Driving School Theme Manager',
        version: this.EXPORT_VERSION,
        format: 'collection',
        count: themes.length
      };

      const exportString = options.compress 
        ? JSON.stringify(exportData)
        : JSON.stringify(exportData, null, 2);

      return {
        success: true,
        data: exportString,
        size: new Blob([exportString]).size
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Collection export failed'
      };
    }
  }

  /**
   * Import multiple themes from a collection
   */
  async importThemeCollection(importData: string, options: ImportOptions = {}): Promise<{
    success: boolean;
    themes?: Theme[];
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      const parsed = JSON.parse(importData);
      
      if (!parsed.themes || !Array.isArray(parsed.themes)) {
        return {
          success: false,
          errors: ['Invalid collection format: themes array not found']
        };
      }

      const importedThemes: Theme[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      for (const themeData of parsed.themes) {
        try {
          const result = await this.importTheme(JSON.stringify({
            theme: themeData,
            exportedAt: parsed.exportedAt,
            exportedBy: parsed.exportedBy,
            version: parsed.version,
            format: 'json'
          }), options);

          if (result.success && result.theme) {
            importedThemes.push(result.theme);
            if (result.warnings) {
              warnings.push(...result.warnings);
            }
          } else {
            errors.push(`Failed to import theme "${themeData.name}": ${result.error}`);
          }
        } catch (error) {
          errors.push(`Error importing theme "${themeData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: importedThemes.length > 0,
        themes: importedThemes,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Collection import failed']
      };
    }
  }

  /**
   * Create a backup of all themes
   */
  async createThemeBackup(): Promise<ExportResult> {
    try {
      const themes = await themeEngine.getAvailableThemesFromStorage();
      const themeIds = themes.map(theme => theme.id);
      
      return await this.exportThemeCollection(themeIds, {
        includeMetadata: true,
        compress: false
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Backup creation failed'
      };
    }
  }

  /**
   * Restore themes from backup
   */
  async restoreFromBackup(backupData: string, options: {
    clearExisting?: boolean;
    overwriteExisting?: boolean;
  } = {}): Promise<{
    success: boolean;
    restored?: number;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      // Clear existing themes if requested
      if (options.clearExisting) {
        await themeEngine.clearAllThemes();
      }

      // Import theme collection
      const result = await this.importThemeCollection(backupData, {
        validateTheme: true,
        overwriteExisting: options.overwriteExisting
      });

      return {
        success: result.success,
        restored: result.themes?.length || 0,
        errors: result.errors,
        warnings: result.warnings
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Backup restore failed']
      };
    }
  }

  /**
   * Parse import data and validate format
   */
  private parseImportData(importData: string): {
    success: boolean;
    data?: ThemeExportData;
    error?: string;
  } {
    try {
      const parsed = JSON.parse(importData);
      
      // Check for required fields
      if (!parsed.theme) {
        return {
          success: false,
          error: 'Invalid format: theme data not found'
        };
      }

      if (!parsed.version) {
        return {
          success: false,
          error: 'Invalid format: version not specified'
        };
      }

      // Validate theme structure
      const theme = parsed.theme;
      if (!theme.id || !theme.name || !theme.colors || !theme.gradients || !theme.typography || !theme.effects) {
        return {
          success: false,
          error: 'Invalid theme structure: missing required properties'
        };
      }

      return {
        success: true,
        data: parsed as ThemeExportData
      };

    } catch (error) {
      return {
        success: false,
        error: 'Invalid JSON format'
      };
    }
  }

  /**
   * Generate checksum for theme integrity verification
   */
  private generateChecksum(theme: Theme): string {
    // Simple checksum based on theme content
    const themeString = JSON.stringify({
      colors: theme.colors,
      gradients: theme.gradients,
      typography: theme.typography,
      effects: theme.effects
    });
    
    // Simple hash function (in production, use a proper hash library)
    let hash = 0;
    for (let i = 0; i < themeString.length; i++) {
      const char = themeString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if theme exists
   */
  private async themeExists(themeId: string): Promise<boolean> {
    try {
      await themeEngine.loadTheme(themeId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate import file size
   */
  validateImportSize(data: string, maxSizeMB: number = 10): {
    valid: boolean;
    size: number;
    error?: string;
  } {
    const size = new Blob([data]).size;
    const maxSize = maxSizeMB * 1024 * 1024;
    
    return {
      valid: size <= maxSize,
      size,
      error: size > maxSize ? `File size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)` : undefined
    };
  }

  /**
   * Get import/export statistics
   */
  getStats() {
    return {
      supportedVersions: this.SUPPORTED_VERSIONS,
      currentVersion: this.EXPORT_VERSION,
      supportedFormats: ['json'],
      maxImportSize: '10MB'
    };
  }
}

// Export singleton instance
export const themeImportExport = new ThemeImportExport();