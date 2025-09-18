// Component for creating custom theme presets
'use client';

import React, { useState } from 'react';
import { Theme } from './types';
import { PresetTheme } from './presets';
import { usePresets } from './hooks/usePresets';

interface PresetCreatorProps {
  theme: Theme;
  isOpen: boolean;
  onClose: () => void;
  onPresetCreated?: (preset: PresetTheme) => void;
}

export const PresetCreator: React.FC<PresetCreatorProps> = ({
  theme,
  isOpen,
  onClose,
  onPresetCreated
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { createCustomPreset } = usePresets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a name for the preset');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      
      const preset = await createCustomPreset(theme, name.trim(), description.trim());
      
      if (preset) {
        onPresetCreated?.(preset);
        handleClose();
      } else {
        setError('Failed to create preset');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create preset');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Create Custom Preset
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Theme preview */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme Preview
              </label>
              <div 
                className="h-16 rounded-lg border-2 border-gray-200"
                style={{ 
                  background: `linear-gradient(${theme.gradients.hero.direction}, ${theme.gradients.hero.colorStops.map(s => `${s.color} ${s.position}%`).join(', ')})` 
                }}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field */}
              <div>
                <label htmlFor="preset-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Preset Name *
                </label>
                <input
                  id="preset-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter preset name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  maxLength={50}
                  required
                />
              </div>

              {/* Description field */}
              <div>
                <label htmlFor="preset-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="preset-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this theme preset (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  maxLength={200}
                />
              </div>

              {/* Theme details */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Theme Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">Primary:</span> {theme.colors.primary[500]}
                  </div>
                  <div>
                    <span className="font-medium">Secondary:</span> {theme.colors.secondary[500]}
                  </div>
                  <div>
                    <span className="font-medium">Accent:</span> {theme.colors.accent[500]}
                  </div>
                  <div>
                    <span className="font-medium">Gradients:</span> {Object.keys(theme.gradients).length}
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !name.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create Preset'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresetCreator;