// Theme persistence and application system
import { Theme, ValidationResult } from './types';
import { themeEngine } from './engine';
import { cssVariableManager } from './css-variables';
import { themeStorage } from './storage';

export interface ThemePersistenceOptions {
  autoSave?: boolean;
  autoApply?: boolean;
  persistToLocalStorage?: boolean;
  persistToSessionStorage?: boolean;
  enableRollback?: boolean;
  maxRollbackHistory?: number;
}

export interface ThemeApplicationResult {
  success: boolean;
  appliedTheme?: Theme;
  errors?: string[];
  rollbackAvailable?: boolean;
}

export interface RollbackEntry {
  theme: Theme;
  timestamp: number;
  reason: string;
}

class ThemePersistenceManager {
  private options: ThemePersistenceOptions;
  private rollbackHistory: RollbackEntry[] = [];
  private currentTheme: Theme | null = null;
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  constructor(options: ThemePersistenceOptions = {}) {
    this.options = {
      autoSave: true,
      autoApply: true,
      persistToLocalStorage: true,
      persistToSessionStorage: false,
      enableRollback: true,
      maxRollbackHistory: 10,
      ...options,
    };
  }

  /**
   * Save theme with persistence options
   */
  async saveTheme(theme: Theme, reason: string = 'Manual save'): Promise<boolean> {
    try {
      // Validate theme before saving
      const validation = await themeEngine.validateTheme(theme);
      if (!validation.isValid) {
        console.error('Theme validation failed:', validation.errors);
        return false;
      }

      // Save to storage system
      const themeId = await themeStorage.saveTheme(theme);
      if (!themeId) {
        console.error('Failed to save theme to storage');
        return false;
      }

      // Save to browser storage if enabled
      if (this.options.persistToLocalStorage) {
        this.saveToLocalStorage(theme);
      }

      if (this.options.persistToSessionStorage) {
        this.saveToSessionStorage(theme);
      }

      // Add to rollback history if enabled
      if (this.options.enableRollback && this.currentTheme) {
        this.addToRollbackHistory(this.currentTheme, reason);
      }

      this.currentTheme = theme;
      return true;
    } catch (error) {
      console.error('Error saving theme:', error);
      return false;
    }
  }

  /**
   * Load and apply theme
   */
  async loadTheme(themeId: string): Promise<ThemeApplicationResult> {
    try {
      // Load theme from storage
      const theme = await themeStorage.loadTheme(themeId);
      if (!theme) {
        return {
          success: false,
          errors: [`Theme with ID ${themeId} not found`],
        };
      }

      return await this.applyTheme(theme);
    } catch (error) {
      return {
        success: false,
        errors: [`Error loading theme: ${error}`],
      };
    }
  }

  /**
   * Apply theme instantly across all pages
   */
  async applyTheme(theme: Theme): Promise<ThemeApplicationResult> {
    try {
      // Validate theme
      const validation = await themeEngine.validateTheme(theme);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors?.map(e => e.message) || ['Theme validation failed'],
        };
      }

      // Add current theme to rollback history
      if (this.options.enableRollback && this.currentTheme) {
        this.addToRollbackHistory(this.currentTheme, 'Before theme application');
      }

      // Apply theme using CSS variable manager
      cssVariableManager.applyTheme(theme);

      // Update current theme
      this.currentTheme = theme;

      // Auto-save if enabled
      if (this.options.autoSave) {
        this.scheduleAutoSave(theme);
      }

      // Trigger theme change event
      this.dispatchThemeChangeEvent(theme);

      return {
        success: true,
        appliedTheme: theme,
        rollbackAvailable: this.rollbackHistory.length > 0,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Error applying theme: ${error}`],
      };
    }
  }

  /**
   * Rollback to previous theme
   */
  async rollbackToPrevious(): Promise<ThemeApplicationResult> {
    if (!this.options.enableRollback || this.rollbackHistory.length === 0) {
      return {
        success: false,
        errors: ['No rollback history available'],
      };
    }

    const previousEntry = this.rollbackHistory.pop();
    if (!previousEntry) {
      return {
        success: false,
        errors: ['No previous theme found'],
      };
    }

    return await this.applyTheme(previousEntry.theme);
  }

  /**
   * Rollback to specific theme in history
   */
  async rollbackToTheme(index: number): Promise<ThemeApplicationResult> {
    if (!this.options.enableRollback || index >= this.rollbackHistory.length || index < 0) {
      return {
        success: false,
        errors: ['Invalid rollback index'],
      };
    }

    const targetEntry = this.rollbackHistory[index];
    // Remove entries after the target
    this.rollbackHistory = this.rollbackHistory.slice(0, index);

    return await this.applyTheme(targetEntry.theme);
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(): RollbackEntry[] {
    return [...this.rollbackHistory];
  }

  /**
   * Load theme from browser storage on initialization
   */
  async initializeFromStorage(): Promise<Theme | null> {
    try {
      // Try localStorage first
      if (this.options.persistToLocalStorage) {
        const theme = this.loadFromLocalStorage();
        if (theme) {
          await this.applyTheme(theme);
          return theme;
        }
      }

      // Try sessionStorage
      if (this.options.persistToSessionStorage) {
        const theme = this.loadFromSessionStorage();
        if (theme) {
          await this.applyTheme(theme);
          return theme;
        }
      }

      // Load default theme
      const defaultTheme = await themeStorage.loadDefaultTheme();
      if (defaultTheme) {
        await this.applyTheme(defaultTheme);
        return defaultTheme;
      }

      return null;
    } catch (error) {
      console.error('Error initializing theme from storage:', error);
      return null;
    }
  }

  /**
   * Get current applied theme
   */
  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  /**
   * Clear all persistence data
   */
  clearPersistenceData(): void {
    if (this.options.persistToLocalStorage) {
      localStorage.removeItem('theme-current');
    }

    if (this.options.persistToSessionStorage) {
      sessionStorage.removeItem('theme-current');
    }

    this.rollbackHistory = [];
    this.currentTheme = null;
  }

  // Private methods

  private saveToLocalStorage(theme: Theme): void {
    try {
      localStorage.setItem('theme-current', JSON.stringify(theme));
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  }

  private saveToSessionStorage(theme: Theme): void {
    try {
      sessionStorage.setItem('theme-current', JSON.stringify(theme));
    } catch (error) {
      console.error('Error saving theme to sessionStorage:', error);
    }
  }

  private loadFromLocalStorage(): Theme | null {
    try {
      const themeData = localStorage.getItem('theme-current');
      return themeData ? JSON.parse(themeData) : null;
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
      return null;
    }
  }

  private loadFromSessionStorage(): Theme | null {
    try {
      const themeData = sessionStorage.getItem('theme-current');
      return themeData ? JSON.parse(themeData) : null;
    } catch (error) {
      console.error('Error loading theme from sessionStorage:', error);
      return null;
    }
  }

  private addToRollbackHistory(theme: Theme, reason: string): void {
    if (!this.options.enableRollback) return;

    this.rollbackHistory.push({
      theme: { ...theme },
      timestamp: Date.now(),
      reason,
    });

    // Limit history size
    const maxHistory = this.options.maxRollbackHistory || 10;
    if (this.rollbackHistory.length > maxHistory) {
      this.rollbackHistory = this.rollbackHistory.slice(-maxHistory);
    }
  }

  private scheduleAutoSave(theme: Theme): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.saveTheme(theme, 'Auto-save');
    }, 1000); // Auto-save after 1 second of inactivity
  }

  private dispatchThemeChangeEvent(theme: Theme): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('themeChanged', {
        detail: { theme },
      });
      window.dispatchEvent(event);
    }
  }
}

// Export singleton instance
export const themePersistence = new ThemePersistenceManager();

// Export utility functions for easy access
export const themeApplication = {
  /**
   * Apply theme instantly across all pages
   */
  async applyTheme(theme: Theme): Promise<ThemeApplicationResult> {
    return await themePersistence.applyTheme(theme);
  },

  /**
   * Save and apply theme
   */
  async saveAndApplyTheme(theme: Theme): Promise<boolean> {
    const applied = await themePersistence.applyTheme(theme);
    if (applied.success) {
      return await themePersistence.saveTheme(theme, 'Save and apply');
    }
    return false;
  },

  /**
   * Load theme by ID and apply
   */
  async loadAndApplyTheme(themeId: string): Promise<ThemeApplicationResult> {
    return await themePersistence.loadTheme(themeId);
  },

  /**
   * Rollback to previous theme
   */
  async rollback(): Promise<ThemeApplicationResult> {
    return await themePersistence.rollbackToPrevious();
  },

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme | null {
    return themePersistence.getCurrentTheme();
  },

  /**
   * Initialize theme system
   */
  async initialize(): Promise<Theme | null> {
    return await themePersistence.initializeFromStorage();
  },
};