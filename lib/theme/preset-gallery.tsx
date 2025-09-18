// Preset gallery component for theme selection
'use client';

import React, { useState, useEffect } from 'react';
import { PresetTheme, PresetCategory, presetManager } from './presets';
import { themeEngine } from './engine';

interface PresetGalleryProps {
  onPresetSelect?: (preset: PresetTheme) => void;
  onPresetApply?: (preset: PresetTheme) => void;
  currentThemeId?: string;
  showCategories?: boolean;
  allowCustomPresets?: boolean;
}

interface PresetCardProps {
  preset: PresetTheme;
  isSelected: boolean;
  onSelect: (preset: PresetTheme) => void;
  onApply: (preset: PresetTheme) => void;
  onDelete?: (preset: PresetTheme) => void;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isSelected,
  onSelect,
  onApply,
  onDelete
}) => {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(preset);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div
      className={`
        relative group cursor-pointer rounded-xl overflow-hidden
        transition-all duration-200 hover:scale-105 hover:shadow-xl
        ${isSelected 
          ? 'ring-2 ring-emerald-500 shadow-lg' 
          : 'hover:ring-1 hover:ring-emerald-300'
        }
      `}
      onClick={() => onSelect(preset)}
    >
      {/* Thumbnail */}
      <div 
        className="h-32 w-full"
        style={{ background: preset.thumbnail }}
      >
        {/* Overlay with theme info */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
              <h4 className="font-semibold text-sm text-gray-900 truncate">
                {preset.name}
              </h4>
              <p className="text-xs text-gray-600 truncate">
                {preset.description}
              </p>
            </div>
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="bg-emerald-500 text-white rounded-full p-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full
            ${preset.category === 'default' ? 'bg-blue-100 text-blue-800' :
              preset.category === 'seasonal' ? 'bg-green-100 text-green-800' :
              preset.category === 'branded' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'}
          `}>
            {preset.category}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">
              {preset.name}
            </h4>
            <p className="text-sm text-gray-500 truncate">
              {preset.description}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-2">
            {/* Apply button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleApply();
              }}
              disabled={isApplying}
              className={`
                px-3 py-1 text-sm font-medium rounded-md
                transition-colors duration-200
                ${isApplying
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }
              `}
            >
              {isApplying ? 'Applying...' : 'Apply'}
            </button>

            {/* Delete button for custom presets */}
            {preset.category === 'custom' && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(preset);
                }}
                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                title="Delete preset"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CategorySectionProps {
  category: PresetCategory;
  selectedPresetId?: string;
  onPresetSelect: (preset: PresetTheme) => void;
  onPresetApply: (preset: PresetTheme) => void;
  onPresetDelete?: (preset: PresetTheme) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  selectedPresetId,
  onPresetSelect,
  onPresetApply,
  onPresetDelete
}) => {
  if (category.presets.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {category.name}
        </h3>
        <p className="text-sm text-gray-600">
          {category.description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {category.presets.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isSelected={selectedPresetId === preset.id}
            onSelect={onPresetSelect}
            onApply={onPresetApply}
            onDelete={preset.category === 'custom' ? onPresetDelete : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export const PresetGallery: React.FC<PresetGalleryProps> = ({
  onPresetSelect,
  onPresetApply,
  currentThemeId,
  showCategories = true,
  allowCustomPresets = true
}) => {
  const [categories, setCategories] = useState<PresetCategory[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(currentThemeId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load presets on component mount
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const allCategories = presetManager.getAllPresets();
      setCategories(allCategories);
    } catch (err) {
      setError('Failed to load theme presets');
      console.error('Error loading presets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset: PresetTheme) => {
    setSelectedPresetId(preset.id);
    onPresetSelect?.(preset);
  };

  const handlePresetApply = async (preset: PresetTheme) => {
    try {
      // Apply the theme using the theme engine
      themeEngine.applyTheme(preset.theme);
      
      // Update selected preset
      setSelectedPresetId(preset.id);
      
      // Notify parent component
      onPresetApply?.(preset);
    } catch (err) {
      console.error('Failed to apply preset:', err);
      setError('Failed to apply theme preset');
    }
  };

  const handlePresetDelete = async (preset: PresetTheme) => {
    if (!confirm(`Are you sure you want to delete "${preset.name}"?`)) {
      return;
    }

    try {
      const success = await presetManager.deleteCustomPreset(preset.id);
      if (success) {
        // Reload presets to update the UI
        await loadPresets();
        
        // Clear selection if deleted preset was selected
        if (selectedPresetId === preset.id) {
          setSelectedPresetId(undefined);
        }
      } else {
        setError('Failed to delete preset');
      }
    } catch (err) {
      console.error('Error deleting preset:', err);
      setError('Failed to delete preset');
    }
  };

  const filteredCategories = searchQuery
    ? categories.map(category => ({
        ...category,
        presets: category.presets.filter(preset =>
          preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          preset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          preset.theme.metadata.tags.some(tag => 
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      })).filter(category => category.presets.length > 0)
    : categories;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-2 text-gray-600">Loading presets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
        <button
          onClick={loadPresets}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Theme Presets
          </h2>
          <p className="text-sm text-gray-600">
            Choose from professional theme variations or create your own
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Categories */}
      {showCategories ? (
        <div>
          {filteredCategories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              selectedPresetId={selectedPresetId}
              onPresetSelect={handlePresetSelect}
              onPresetApply={handlePresetApply}
              onPresetDelete={allowCustomPresets ? handlePresetDelete : undefined}
            />
          ))}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No presets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search terms.' : 'No presets available.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        // Flat view without categories
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.flatMap(category => category.presets).map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPresetId === preset.id}
              onSelect={handlePresetSelect}
              onApply={handlePresetApply}
              onDelete={preset.category === 'custom' && allowCustomPresets ? handlePresetDelete : undefined}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {filteredCategories.reduce((total, cat) => total + cat.presets.length, 0)} presets available
          </span>
          <button
            onClick={loadPresets}
            className="text-emerald-600 hover:text-emerald-800"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresetGallery;