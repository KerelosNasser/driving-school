// Compact preset selector component
'use client';

import React, { useState, useEffect } from 'react';
import { PresetTheme, presetManager } from './presets';
import { themeEngine } from './engine';

interface PresetSelectorProps {
  currentThemeId?: string;
  onPresetChange?: (preset: PresetTheme) => void;
  compact?: boolean;
  showThumbnails?: boolean;
  className?: string;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentThemeId,
  onPresetChange,
  compact = false,
  showThumbnails = true,
  className = ''
}) => {
  const [presets, setPresets] = useState<PresetTheme[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(currentThemeId);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    try {
      setIsLoading(true);
      const categories = presetManager.getAllPresets();
      const allPresets = categories.flatMap(cat => cat.presets);
      setPresets(allPresets);
    } catch (error) {
      console.error('Failed to load presets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = async (preset: PresetTheme) => {
    try {
      // Apply the theme
      themeEngine.applyTheme(preset.theme);
      
      // Update selection
      setSelectedPresetId(preset.id);
      setIsOpen(false);
      
      // Notify parent
      onPresetChange?.(preset);
    } catch (error) {
      console.error('Failed to apply preset:', error);
    }
  };

  const selectedPreset = presets.find(p => p.id === selectedPresetId) || presets[0];

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <div className="flex items-center space-x-2">
            {showThumbnails && selectedPreset && (
              <div
                className="w-6 h-6 rounded border"
                style={{ background: selectedPreset.thumbnail }}
              />
            )}
            <span className="text-sm font-medium text-gray-900">
              {selectedPreset?.name || 'Select Theme'}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50
                  ${selectedPresetId === preset.id ? 'bg-emerald-50 text-emerald-900' : 'text-gray-900'}
                `}
              >
                {showThumbnails && (
                  <div
                    className="w-6 h-6 rounded border flex-shrink-0"
                    style={{ background: preset.thumbnail }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {preset.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {preset.description}
                  </div>
                </div>
                {selectedPresetId === preset.id && (
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full preset grid view
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">Choose Theme Preset</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetSelect(preset)}
            className={`
              relative group rounded-lg overflow-hidden transition-all duration-200
              hover:scale-105 hover:shadow-lg
              ${selectedPresetId === preset.id 
                ? 'ring-2 ring-emerald-500 shadow-md' 
                : 'hover:ring-1 hover:ring-emerald-300'
              }
            `}
          >
            {/* Thumbnail */}
            <div
              className="h-20 w-full"
              style={{ background: preset.thumbnail }}
            />
            
            {/* Info */}
            <div className="p-2 bg-white">
              <div className="text-xs font-medium text-gray-900 truncate">
                {preset.name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {preset.category}
              </div>
            </div>

            {/* Selection indicator */}
            {selectedPresetId === preset.id && (
              <div className="absolute top-1 right-1">
                <div className="bg-emerald-500 text-white rounded-full p-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetSelector;