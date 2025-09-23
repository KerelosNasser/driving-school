// React hook for real-time theme preview functionality
import { useState, useEffect, useCallback, useRef } from 'react';
import { Theme } from '../types';
import { realTimePreviewManager } from '../real-time-preview';
import { themeEngine } from '../engine';

export interface UseRealTimePreviewOptions {
  containerId?: string;
  autoConnect?: boolean;
  preserveCurrentDesign?: boolean;
  enableSideBySideComparison?: boolean;
}

export interface UseRealTimePreviewReturn {
  // State
  activeTheme: Theme | null;
  currentDesignTheme: Theme | null;
  isPreviewActive: boolean;
  hasUnsavedChanges: boolean;
  
  // Actions
  initializePreview: (theme: Theme) => void;
  updatePreview: (theme: Theme) => void;
  resetToCurrentDesign: () => void;
  applyToLiveSite: (theme: Theme) => void;
  createComparison: (currentTheme: Theme, modifiedTheme: Theme) => void;
  destroyPreview: () => void;
  
  // Utilities
  isDifferentFromCurrent: (theme: Theme) => boolean;
  getThemeDifferences: (theme1: Theme, theme2: Theme) => string[];
  
  // Refs
  previewContainerRef: React.RefObject<HTMLDivElement | null>;
  controlsContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function useRealTimePreview(options: UseRealTimePreviewOptions = {}): UseRealTimePreviewReturn {
  const {
    containerId = 'real-time-preview',
    autoConnect = true,
    preserveCurrentDesign = true,
    enableSideBySideComparison = false
  } = options;

  // State
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [currentDesignTheme, setCurrentDesignTheme] = useState<Theme | null>(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Refs
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const controlsContainerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Initialize current design theme
  useEffect(() => {
    if (preserveCurrentDesign && !initializedRef.current) {
      const currentTheme = realTimePreviewManager.preserveCurrentDesign();
      setCurrentDesignTheme(currentTheme);
      setActiveTheme(currentTheme);
      initializedRef.current = true;
    }
  }, [preserveCurrentDesign]);

  // Auto-connect controls to preview when refs are available
  useEffect(() => {
    if (
      autoConnect && 
      previewContainerRef.current && 
      controlsContainerRef.current && 
      isPreviewActive
    ) {
      realTimePreviewManager.connectToThemeControls(
        controlsContainerRef.current,
        previewContainerRef.current
      );
    }
  }, [autoConnect, isPreviewActive]);

  // Listen for preview updates
  useEffect(() => {
    const handlePreviewUpdate = (event: CustomEvent) => {
      const { theme } = event.detail;
      setActiveTheme(theme);
      
      if (currentDesignTheme) {
        setHasUnsavedChanges(
          JSON.stringify(theme) !== JSON.stringify(currentDesignTheme)
        );
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('previewUpdated', handlePreviewUpdate as EventListener);
      
      return () => {
        window.removeEventListener('previewUpdated', handlePreviewUpdate as EventListener);
      };
    }
  }, [currentDesignTheme]);

  // Initialize preview
  const initializePreview = useCallback((theme: Theme) => {
    if (typeof window === 'undefined') return;

    realTimePreviewManager.initializePreview(containerId, theme);
    setActiveTheme(theme);
    setIsPreviewActive(true);

    // If this is the first theme and we want to preserve current design
    if (preserveCurrentDesign && !currentDesignTheme) {
      setCurrentDesignTheme(theme);
    }
  }, [containerId, preserveCurrentDesign, currentDesignTheme]);

  // Update preview in real-time
  const updatePreview = useCallback((theme: Theme) => {
    if (!isPreviewActive) {
      initializePreview(theme);
      return;
    }

    realTimePreviewManager.updatePreviewInRealTime(theme, containerId);
    setActiveTheme(theme);

    if (currentDesignTheme) {
      setHasUnsavedChanges(
        JSON.stringify(theme) !== JSON.stringify(currentDesignTheme)
      );
    }
  }, [isPreviewActive, initializePreview, containerId, currentDesignTheme]);

  // Reset to current design
  const resetToCurrentDesign = useCallback(() => {
    if (currentDesignTheme) {
      realTimePreviewManager.resetToCurrentDesign();
      setActiveTheme(currentDesignTheme);
      setHasUnsavedChanges(false);
    }
  }, [currentDesignTheme]);

  // Apply theme to live site
  const applyToLiveSite = useCallback(async (theme: Theme) => {
    try {
      // Save theme first
      await themeEngine.saveTheme(theme);
      
      // Apply to live site (preview manager will ensure UI updates)
      realTimePreviewManager.applyThemeToLiveSite(theme);

      // Also apply via theme engine to ensure global document-level variables/classes are set
      // (some codepaths of preview manager only target preview iframe/container)
      if (typeof window !== 'undefined') {
        try {
          await themeEngine.applyTheme(theme);
        } catch (applyErr) {
          // Non-fatal: log and continue; the preview manager may still have applied UI updates
          console.warn('themeEngine.applyTheme failed in applyToLiveSite:', applyErr);
        }
      }
      
      // Persist to server so ThemeContext and other clients can read the same config
      try {
        const resp = await fetch('/api/admin/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ config: theme })
        });

        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          console.warn('Failed to persist theme to server (PUT /api/admin/theme):', resp.status, text);
        }
      } catch (err) {
        console.warn('Error while persisting theme to server:', err);
      }
      
      // Update current design reference
      setCurrentDesignTheme(theme);
      setHasUnsavedChanges(false);
      
      // Emit success event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('themeAppliedToLive', {
          detail: { theme }
        }));
      }
    } catch (error) {
      console.error('Failed to apply theme to live site:', error);
      throw error;
    }
  }, []);

// ...existing code...

  // Create side-by-side comparison
  const createComparison = useCallback((currentTheme: Theme, modifiedTheme: Theme) => {
    if (!enableSideBySideComparison) return;

    const comparisonContainerId = `${containerId}-comparison`;
    realTimePreviewManager.createSideBySideComparison(
      currentTheme,
      modifiedTheme,
      comparisonContainerId
    );
  }, [containerId, enableSideBySideComparison]);

  // Destroy preview
  const destroyPreview = useCallback(() => {
    realTimePreviewManager.destroyPreview(containerId);
    setIsPreviewActive(false);
    setActiveTheme(null);
    setHasUnsavedChanges(false);
  }, [containerId]);

  // Check if theme is different from current
  const isDifferentFromCurrent = useCallback((theme: Theme): boolean => {
    return realTimePreviewManager.isDifferentFromCurrentDesign(theme);
  }, []);

  // Get theme differences
  const getThemeDifferences = useCallback((theme1: Theme, theme2: Theme): string[] => {
    return realTimePreviewManager.getThemeDifferences(theme1, theme2);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPreviewActive) {
        destroyPreview();
      }
    };
  }, [isPreviewActive, destroyPreview]);

  return {
    // State
    activeTheme,
    currentDesignTheme,
    isPreviewActive,
    hasUnsavedChanges,
    
    // Actions
    initializePreview,
    updatePreview,
    resetToCurrentDesign,
    applyToLiveSite,
    createComparison,
    destroyPreview,
    
    // Utilities
    isDifferentFromCurrent,
    getThemeDifferences,
    
    // Refs
    previewContainerRef,
    controlsContainerRef
  };
}

// Additional hook for theme control components
export function useThemeControl<T = any>(
  theme: Theme | null,
  path: string,
  onUpdate: (updatedTheme: Theme) => void
) {
  const getValue = useCallback((): T | undefined => {
    if (!theme) return undefined;
    
    const pathParts = path.split('.');
    let current: any = theme;
    
    for (const part of pathParts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current as T;
  }, [theme, path]);

  const setValue = useCallback((value: T) => {
    if (!theme) return;
    
    const pathParts = path.split('.');
    const updatedTheme = JSON.parse(JSON.stringify(theme)); // Deep clone
    
    let current: any = updatedTheme;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (current[part] === undefined || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }

    current[pathParts[pathParts.length - 1]] = value;
    
    // Update metadata
    updatedTheme.metadata.updatedAt = new Date().toISOString();
    
    onUpdate(updatedTheme);
  }, [theme, path, onUpdate]);

  return {
    value: getValue(),
    setValue,
    path
  };
}

// Hook for managing theme presets with real-time preview
export function useThemePresets() {
  const [presets, setPresets] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        setLoading(true);
        const availableThemes = await themeEngine.getAvailableThemesFromStorage();
        setPresets(availableThemes);
      } catch (error) {
        console.error('Failed to load theme presets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPresets();
  }, []);

  const savePreset = useCallback(async (theme: Theme) => {
    try {
      await themeEngine.saveTheme(theme);
      setPresets(prev => [...prev.filter(p => p.id !== theme.id), theme]);
    } catch (error) {
      console.error('Failed to save preset:', error);
      throw error;
    }
  }, []);

  const deletePreset = useCallback(async (themeId: string) => {
    try {
      await themeEngine.deleteTheme(themeId);
      setPresets(prev => prev.filter(p => p.id !== themeId));
    } catch (error) {
      console.error('Failed to delete preset:', error);
      throw error;
    }
  }, []);

  const duplicatePreset = useCallback(async (themeId: string, newName?: string) => {
    try {
      const duplicated = await themeEngine.duplicateTheme(themeId, newName);
      setPresets(prev => [...prev, duplicated]);
      return duplicated;
    } catch (error) {
      console.error('Failed to duplicate preset:', error);
      throw error;
    }
  }, []);

  return {
    presets,
    loading,
    savePreset,
    deletePreset,
    duplicatePreset
  };
}