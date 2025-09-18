// React hook for managing theme presets
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PresetTheme, PresetCategory, presetManager } from '../presets';
import { themeEngine } from '../engine';
import { Theme } from '../types';

export interface UsePresetsReturn {
  // Data
  presets: PresetTheme[];
  categories: PresetCategory[];
  selectedPreset: PresetTheme | null;
  
  // Loading states
  isLoading: boolean;
  isApplying: boolean;
  error: string | null;
  
  // Actions
  loadPresets: () => Promise<void>;
  selectPreset: (preset: PresetTheme) => void;
  applyPreset: (preset: PresetTheme) => Promise<void>;
  createCustomPreset: (theme: Theme, name: string, description: string) => Promise<PresetTheme | null>;
  deleteCustomPreset: (presetId: string) => Promise<boolean>;
  searchPresets: (query: string) => PresetTheme[];
  
  // Utilities
  getPresetById: (id: string) => PresetTheme | null;
  getPresetsByCategory: (category: string) => PresetTheme[];
  exportPreset: (id: string) => string | null;
  importPreset: (exportData: string) => Promise<PresetTheme | null>;
}

export const usePresets = (initialPresetId?: string): UsePresetsReturn => {
  const [presets, setPresets] = useState<PresetTheme[]>([]);
  const [categories, setCategories] = useState<PresetCategory[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<PresetTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  // Set initial preset selection
  useEffect(() => {
    if (initialPresetId && presets.length > 0) {
      const preset = presets.find(p => p.id === initialPresetId);
      if (preset) {
        setSelectedPreset(preset);
      }
    }
  }, [initialPresetId, presets]);

  const loadPresets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load all categories and presets
      const allCategories = presetManager.getAllPresets();
      const allPresets = allCategories.flatMap(cat => cat.presets);
      
      setCategories(allCategories);
      setPresets(allPresets);
      
      // Set default preset if none selected
      if (!selectedPreset && allPresets.length > 0) {
        const defaultPreset = presetManager.getDefaultPreset();
        setSelectedPreset(defaultPreset);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load presets';
      setError(errorMessage);
      console.error('Error loading presets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPreset]);

  const selectPreset = useCallback((preset: PresetTheme) => {
    setSelectedPreset(preset);
  }, []);

  const applyPreset = useCallback(async (preset: PresetTheme) => {
    try {
      setIsApplying(true);
      setError(null);
      
      // Apply the theme using the theme engine
      themeEngine.applyTheme(preset.theme);
      
      // Update selected preset
      setSelectedPreset(preset);
      
      return Promise.resolve();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply preset';
      setError(errorMessage);
      console.error('Error applying preset:', err);
      throw err;
    } finally {
      setIsApplying(false);
    }
  }, []);

  const createCustomPreset = useCallback(async (
    theme: Theme, 
    name: string, 
    description: string
  ): Promise<PresetTheme | null> => {
    try {
      setError(null);
      
      // Create the custom preset
      const customPreset = presetManager.createCustomPreset(theme, name, description);
      
      // Save it
      const success = await presetManager.saveCustomPreset(customPreset);
      
      if (success) {
        // Reload presets to update the UI
        await loadPresets();
        return customPreset;
      } else {
        throw new Error('Failed to save custom preset');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create custom preset';
      setError(errorMessage);
      console.error('Error creating custom preset:', err);
      return null;
    }
  }, [loadPresets]);

  const deleteCustomPreset = useCallback(async (presetId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const success = await presetManager.deleteCustomPreset(presetId);
      
      if (success) {
        // Reload presets to update the UI
        await loadPresets();
        
        // Clear selection if deleted preset was selected
        if (selectedPreset?.id === presetId) {
          const defaultPreset = presetManager.getDefaultPreset();
          setSelectedPreset(defaultPreset);
        }
        
        return true;
      } else {
        throw new Error('Failed to delete preset');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete preset';
      setError(errorMessage);
      console.error('Error deleting preset:', err);
      return false;
    }
  }, [loadPresets, selectedPreset]);

  const searchPresets = useCallback((query: string): PresetTheme[] => {
    return presetManager.searchPresets(query);
  }, []);

  const getPresetById = useCallback((id: string): PresetTheme | null => {
    return presetManager.getPresetById(id);
  }, []);

  const getPresetsByCategory = useCallback((category: string): PresetTheme[] => {
    return presetManager.getPresetsByCategory(category);
  }, []);

  const exportPreset = useCallback((id: string): string | null => {
    return presetManager.exportPreset(id);
  }, []);

  const importPreset = useCallback(async (exportData: string): Promise<PresetTheme | null> => {
    try {
      setError(null);
      
      const importedPreset = presetManager.importPreset(exportData);
      
      if (importedPreset) {
        // Save the imported preset
        const success = await presetManager.saveCustomPreset(importedPreset);
        
        if (success) {
          // Reload presets to update the UI
          await loadPresets();
          return importedPreset;
        } else {
          throw new Error('Failed to save imported preset');
        }
      } else {
        throw new Error('Invalid preset data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import preset';
      setError(errorMessage);
      console.error('Error importing preset:', err);
      return null;
    }
  }, [loadPresets]);

  return {
    // Data
    presets,
    categories,
    selectedPreset,
    
    // Loading states
    isLoading,
    isApplying,
    error,
    
    // Actions
    loadPresets,
    selectPreset,
    applyPreset,
    createCustomPreset,
    deleteCustomPreset,
    searchPresets,
    
    // Utilities
    getPresetById,
    getPresetsByCategory,
    exportPreset,
    importPreset
  };
};

export default usePresets;