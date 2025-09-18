// Examples of using the CSS Variable System for real-time theme switching
import React, { useState, useEffect } from 'react';
import { cssVariableManager } from '../css-variables';
import { themeEngine } from '../engine';

/**
 * Example component showing CSS variable usage
 */
export function ThemeVariableExample() {
  const [currentColor, setCurrentColor] = useState('#10b981');
  const [gradientDirection, setGradientDirection] = useState('135deg');
  const [blurIntensity, setBlurIntensity] = useState('12px');

  // Update CSS variables in real-time
  const updatePrimaryColor = (color: string) => {
    setCurrentColor(color);
    cssVariableManager.setVariableValue('--theme-primary-500', color);
  };

  const updateGradientDirection = (direction: string) => {
    setGradientDirection(direction);
    const gradient = `linear-gradient(${direction}, var(--theme-primary-900), var(--theme-secondary-800))`;
    cssVariableManager.setVariableValue('--theme-gradient-hero', gradient);
  };

  const updateBlurIntensity = (intensity: string) => {
    setBlurIntensity(intensity);
    cssVariableManager.setVariableValue('--theme-backdrop-blur-md', `blur(${intensity})`);
  };

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-6">CSS Variable System Demo</h2>
      
      {/* Color Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Primary Color Control</h3>
        <div className="flex items-center space-x-4">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => updatePrimaryColor(e.target.value)}
            className="w-12 h-12 rounded border"
          />
          <span className="theme-text-primary font-medium">
            Current: {currentColor}
          </span>
        </div>
        
        {/* Example elements using the CSS variable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="theme-bg-primary text-white p-4 theme-rounded-lg">
            Background using --theme-primary-500
          </div>
          <div className="border-2 theme-border-primary p-4 theme-rounded-lg">
            Border using --theme-primary-500
          </div>
          <div className="theme-text-primary p-4 border theme-rounded-lg">
            Text using --theme-primary-500
          </div>
        </div>
      </div>

      {/* Gradient Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gradient Direction Control</h3>
        <div className="flex items-center space-x-4">
          <select
            value={gradientDirection}
            onChange={(e) => updateGradientDirection(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="135deg">135deg (Default)</option>
            <option value="to right">To Right</option>
            <option value="to bottom">To Bottom</option>
            <option value="45deg">45deg</option>
            <option value="180deg">180deg</option>
          </select>
          <span>Current: {gradientDirection}</span>
        </div>
        
        {/* Hero section using gradient */}
        <div className="theme-gradient-hero text-white p-8 theme-rounded-xl text-center">
          <h4 className="text-2xl font-bold mb-2">Hero Section</h4>
          <p>Using --theme-gradient-hero CSS variable</p>
        </div>
      </div>

      {/* Blur Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Backdrop Blur Control</h3>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="0"
            max="24"
            step="2"
            value={parseInt(blurIntensity)}
            onChange={(e) => updateBlurIntensity(`${e.target.value}px`)}
            className="w-32"
          />
          <span>Current: {blurIntensity}</span>
        </div>
        
        {/* Card with backdrop blur */}
        <div 
          className="relative p-6 theme-rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
          }}
        >
          <div className="bg-white/80 theme-backdrop-blur-md p-6 theme-rounded-lg theme-shadow-card">
            <h4 className="text-lg font-semibold mb-2">Backdrop Blur Card</h4>
            <p>This card uses --theme-backdrop-blur-md CSS variable</p>
          </div>
        </div>
      </div>

      {/* Preset Themes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preset Theme Switching</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => applyPresetTheme('emerald')}
            className="px-4 py-2 bg-emerald-500 text-white theme-rounded-lg hover:bg-emerald-600"
          >
            Emerald Theme
          </button>
          <button
            onClick={() => applyPresetTheme('blue')}
            className="px-4 py-2 bg-blue-500 text-white theme-rounded-lg hover:bg-blue-600"
          >
            Blue Theme
          </button>
          <button
            onClick={() => applyPresetTheme('purple')}
            className="px-4 py-2 bg-purple-500 text-white theme-rounded-lg hover:bg-purple-600"
          >
            Purple Theme
          </button>
          <button
            onClick={() => cssVariableManager.resetToDefault()}
            className="px-4 py-2 bg-gray-500 text-white theme-rounded-lg hover:bg-gray-600"
          >
            Reset to Default
          </button>
        </div>
      </div>

      {/* Live CSS Variable Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Live CSS Variables</h3>
        <div className="bg-gray-100 p-4 theme-rounded-lg font-mono text-sm">
          <div>--theme-primary-500: {cssVariableManager.getVariableValue('--theme-primary-500') || 'Not set'}</div>
          <div>--theme-gradient-hero: {cssVariableManager.getVariableValue('--theme-gradient-hero') || 'Not set'}</div>
          <div>--theme-backdrop-blur-md: {cssVariableManager.getVariableValue('--theme-backdrop-blur-md') || 'Not set'}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Apply preset theme colors
 */
function applyPresetTheme(theme: 'emerald' | 'blue' | 'purple') {
  const presets = {
    emerald: {
      '--theme-primary-500': '#10b981',
      '--theme-secondary-500': '#14b8a6',
      '--theme-gradient-hero': 'linear-gradient(135deg, #064e3b, #115e59, #1e3a8a)',
    },
    blue: {
      '--theme-primary-500': '#3b82f6',
      '--theme-secondary-500': '#06b6d4',
      '--theme-gradient-hero': 'linear-gradient(135deg, #1e3a8a, #1e40af, #2563eb)',
    },
    purple: {
      '--theme-primary-500': '#8b5cf6',
      '--theme-secondary-500': '#a855f7',
      '--theme-gradient-hero': 'linear-gradient(135deg, #581c87, #7c3aed, #8b5cf6)',
    },
  };

  const variables = presets[theme];
  cssVariableManager.updateVariables(variables);
}

/**
 * Hook for using CSS variables in React components
 */
export function useCSSVariable(variableName: string) {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    // Get initial value
    const initialValue = cssVariableManager.getVariableValue(variableName);
    setValue(initialValue);

    // Listen for theme changes
    const handleThemeChange = () => {
      const newValue = cssVariableManager.getVariableValue(variableName);
      setValue(newValue);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('themeChanged', handleThemeChange);
      return () => window.removeEventListener('themeChanged', handleThemeChange);
    }
  }, [variableName]);

  const updateValue = (newValue: string) => {
    const success = cssVariableManager.setVariableValue(variableName, newValue);
    if (success) {
      setValue(newValue);
    }
    return success;
  };

  return [value, updateValue] as const;
}

/**
 * Example of using the CSS variable hook
 */
export function CSSVariableHookExample() {
  const [primaryColor, setPrimaryColor] = useCSSVariable('--theme-primary-500');
  const [shadowIntensity, setShadowIntensity] = useCSSVariable('--theme-shadow-card');

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">CSS Variable Hook Example</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">Primary Color:</label>
        <input
          type="color"
          value={primaryColor || '#10b981'}
          onChange={(e) => setPrimaryColor(e.target.value)}
          className="w-16 h-8 rounded border"
        />
        <div className="text-sm text-gray-600">Current: {primaryColor}</div>
      </div>

      <div 
        className="p-4 theme-rounded-lg theme-shadow-card"
        style={{ backgroundColor: primaryColor || '#10b981', color: 'white' }}
      >
        This element's background color is controlled by the CSS variable hook
      </div>
    </div>
  );
}