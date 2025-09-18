// Theme storage system with persistence and error handling
import { Theme, ValidationResult } from './types';

export interface StorageOptions {
  useLocalStorage?: boolean;
  useSessionStorage?: boolean;
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
}

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ThemeStorageMetadata {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  version: string;
}

export class ThemeStorage {
  private readonly STORAGE_PREFIX = 'kiro-theme-';
  private readonly METADATA_KEY = 'kiro-theme-metadata';
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
  
  private options: StorageOptions;
  private cache: Map<string, Theme> = new Map();

  constructor(options: StorageOptions = {}) {
    this.options = {
      useLocalStorage: true,
      useSessionStorage: false,
      compressionEnabled: true,
      encryptionEnabled: false,
      ...options
    };
  }

  /**
   * Save a theme to storage
   */
  async saveTheme(theme: Theme): Promise<StorageResult<string>> {
    try {
      // Validate theme before saving
      if (!this.isValidTheme(theme)) {
        return {
          success: false,
          error: 'Invalid theme structure'
        };
      }

      // Update metadata
      theme.metadata.updatedAt = new Date().toISOString();
      
      // Serialize theme
      const serialized = this.serializeTheme(theme);
      
      // Check storage size limits
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        return {
          success: false,
          error: 'Theme data exceeds maximum storage size limit'
        };
      }

      // Save to cache
      this.cache.set(theme.id, theme);

      // Save to persistent storage
      const storageKey = this.getStorageKey(theme.id);
      
      if (this.options.useLocalStorage && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, serialized);
          await this.updateStorageMetadata(theme);
        } catch (error) {
          // Handle quota exceeded error
          if (error instanceof Error && error.name === 'QuotaExceededError') {
            // Try to free up space by removing old themes
            const freed = await this.cleanupOldThemes();
            if (freed) {
              localStorage.setItem(storageKey, serialized);
              await this.updateStorageMetadata(theme);
            } else {
              return {
                success: false,
                error: 'Storage quota exceeded and cleanup failed'
              };
            }
          } else {
            throw error;
          }
        }
      }

      if (this.options.useSessionStorage && typeof window !== 'undefined') {
        sessionStorage.setItem(storageKey, serialized);
      }

      return {
        success: true,
        data: theme.id
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown storage error'
      };
    }
  }

  /**
   * Load a theme from storage
   */
  async loadTheme(themeId: string): Promise<StorageResult<Theme>> {
    try {
      // Check cache first
      if (this.cache.has(themeId)) {
        return {
          success: true,
          data: this.cache.get(themeId)!
        };
      }

      // Try to load from storage
      const storageKey = this.getStorageKey(themeId);
      let serialized: string | null = null;

      if (this.options.useLocalStorage && typeof window !== 'undefined') {
        serialized = localStorage.getItem(storageKey);
      }

      if (!serialized && this.options.useSessionStorage && typeof window !== 'undefined') {
        serialized = sessionStorage.getItem(storageKey);
      }

      if (!serialized) {
        return {
          success: false,
          error: `Theme not found: ${themeId}`
        };
      }

      // Deserialize theme
      const theme = this.deserializeTheme(serialized);
      
      if (!theme) {
        return {
          success: false,
          error: 'Failed to deserialize theme data'
        };
      }

      // Validate loaded theme
      if (!this.isValidTheme(theme)) {
        return {
          success: false,
          error: 'Loaded theme has invalid structure'
        };
      }

      // Cache the loaded theme
      this.cache.set(themeId, theme);

      return {
        success: true,
        data: theme
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown loading error'
      };
    }
  }

  /**
   * Delete a theme from storage
   */
  async deleteTheme(themeId: string): Promise<StorageResult<boolean>> {
    try {
      // Remove from cache
      this.cache.delete(themeId);

      // Remove from storage
      const storageKey = this.getStorageKey(themeId);
      
      if (this.options.useLocalStorage && typeof window !== 'undefined') {
        localStorage.removeItem(storageKey);
        await this.removeFromMetadata(themeId);
      }

      if (this.options.useSessionStorage && typeof window !== 'undefined') {
        sessionStorage.removeItem(storageKey);
      }

      return {
        success: true,
        data: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deletion error'
      };
    }
  }

  /**
   * List all available themes
   */
  async listThemes(): Promise<StorageResult<ThemeStorageMetadata[]>> {
    try {
      if (typeof window === 'undefined') {
        return {
          success: true,
          data: []
        };
      }

      const metadata = this.getStorageMetadata();
      return {
        success: true,
        data: metadata
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown listing error'
      };
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): { used: number; available: number; themes: number } {
    if (typeof window === 'undefined') {
      return { used: 0, available: 0, themes: 0 };
    }

    let used = 0;
    let themes = 0;

    // Calculate localStorage usage
    if (this.options.useLocalStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
            themes++;
          }
        }
      }
    }

    // Estimate available space (localStorage typically has 5-10MB limit)
    const available = this.MAX_STORAGE_SIZE - used;

    return { used, available, themes };
  }

  /**
   * Export theme data for backup
   */
  async exportTheme(themeId: string): Promise<StorageResult<string>> {
    const result = await this.loadTheme(themeId);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Theme not found'
      };
    }

    try {
      const exportData = {
        theme: result.data,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      return {
        success: true,
        data: JSON.stringify(exportData, null, 2)
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      };
    }
  }

  /**
   * Import theme data from backup
   */
  async importTheme(exportData: string): Promise<StorageResult<Theme>> {
    try {
      const parsed = JSON.parse(exportData);
      
      if (!parsed.theme || !this.isValidTheme(parsed.theme)) {
        return {
          success: false,
          error: 'Invalid theme export format'
        };
      }

      const theme = parsed.theme as Theme;
      
      // Generate new ID if theme already exists
      if (this.cache.has(theme.id)) {
        theme.id = `${theme.id}-imported-${Date.now()}`;
      }

      // Save imported theme
      const saveResult = await this.saveTheme(theme);
      
      if (!saveResult.success) {
        return {
          success: false,
          error: saveResult.error
        };
      }

      return {
        success: true,
        data: theme
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      };
    }
  }

  /**
   * Clear all theme data
   */
  async clearAll(): Promise<StorageResult<boolean>> {
    try {
      // Clear cache
      this.cache.clear();

      // Clear storage
      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        
        if (this.options.useLocalStorage) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith(this.STORAGE_PREFIX) || key === this.METADATA_KEY)) {
              keysToRemove.push(key);
            }
          }
          
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }

        if (this.options.useSessionStorage) {
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.STORAGE_PREFIX)) {
              sessionStorage.removeItem(key);
            }
          }
        }
      }

      return {
        success: true,
        data: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clear operation failed'
      };
    }
  }

  /**
   * Serialize theme for storage
   */
  private serializeTheme(theme: Theme): string {
    if (this.options.compressionEnabled) {
      // Simple compression by removing whitespace
      return JSON.stringify(theme);
    }
    return JSON.stringify(theme, null, 2);
  }

  /**
   * Deserialize theme from storage
   */
  private deserializeTheme(data: string): Theme | null {
    try {
      return JSON.parse(data) as Theme;
    } catch {
      return null;
    }
  }

  /**
   * Validate theme structure
   */
  private isValidTheme(theme: any): theme is Theme {
    return (
      theme &&
      typeof theme.id === 'string' &&
      typeof theme.name === 'string' &&
      theme.colors &&
      theme.gradients &&
      theme.typography &&
      theme.effects &&
      theme.metadata
    );
  }

  /**
   * Get storage key for theme
   */
  private getStorageKey(themeId: string): string {
    return `${this.STORAGE_PREFIX}${themeId}`;
  }

  /**
   * Update storage metadata
   */
  private async updateStorageMetadata(theme: Theme): Promise<void> {
    if (typeof window === 'undefined') return;

    const metadata = this.getStorageMetadata();
    const themeMetadata: ThemeStorageMetadata = {
      id: theme.id,
      name: theme.name,
      size: JSON.stringify(theme).length,
      createdAt: theme.metadata.createdAt,
      updatedAt: theme.metadata.updatedAt,
      version: theme.metadata.version
    };

    // Update or add theme metadata
    const existingIndex = metadata.findIndex(m => m.id === theme.id);
    if (existingIndex >= 0) {
      metadata[existingIndex] = themeMetadata;
    } else {
      metadata.push(themeMetadata);
    }

    localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
  }

  /**
   * Remove theme from metadata
   */
  private async removeFromMetadata(themeId: string): Promise<void> {
    if (typeof window === 'undefined') return;

    const metadata = this.getStorageMetadata();
    const filtered = metadata.filter(m => m.id !== themeId);
    localStorage.setItem(this.METADATA_KEY, JSON.stringify(filtered));
  }

  /**
   * Get storage metadata
   */
  private getStorageMetadata(): ThemeStorageMetadata[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.METADATA_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clean up old themes to free storage space
   */
  private async cleanupOldThemes(): Promise<boolean> {
    try {
      const metadata = this.getStorageMetadata();
      
      // Sort by last updated, oldest first
      metadata.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      
      // Remove oldest themes until we free up some space
      const targetToRemove = Math.ceil(metadata.length * 0.2); // Remove 20% of themes
      
      for (let i = 0; i < targetToRemove && i < metadata.length; i++) {
        await this.deleteTheme(metadata[i].id);
      }

      return targetToRemove > 0;

    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const themeStorage = new ThemeStorage();