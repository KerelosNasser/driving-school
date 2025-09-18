'use client';

import React, { useState, useEffect } from 'react';
import { Theme, ComparisonData } from '@/lib/theme/types';
import { previewSystem } from '@/lib/theme/preview';

interface ThemeComparisonProps {
  currentTheme: Theme;
  modifiedTheme: Theme;
  onApplyTheme?: (theme: Theme) => void;
  onDiscardChanges?: () => void;
}

export default function ThemeComparison({
  currentTheme,
  modifiedTheme,
  onApplyTheme,
  onDiscardChanges
}: ThemeComparisonProps) {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [currentPreview, setCurrentPreview] = useState<string>('');
  const [modifiedPreview, setModifiedPreview] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<string>('all');

  useEffect(() => {
    // Generate comparison data
    const comparisonData = previewSystem.compareThemes(currentTheme, modifiedTheme);
    setComparison(comparisonData);

    // Generate previews
    const currentPreviewData = previewSystem.generatePreview(currentTheme);
    const modifiedPreviewData = previewSystem.generatePreview(modifiedTheme);

    setCurrentPreview(currentPreviewData.html);
    setModifiedPreview(modifiedPreviewData.html);
  }, [currentTheme, modifiedTheme]);

  const handleApplyTheme = () => {
    if (onApplyTheme) {
      onApplyTheme(modifiedTheme);
    }
  };

  const handleDiscardChanges = () => {
    if (onDiscardChanges) {
      onDiscardChanges();
    }
  };

  const getComponentPreview = (theme: Theme, component: string) => {
    const preview = previewSystem.generatePreview(theme);
    if (component === 'all') {
      return preview.html;
    }
    
    const componentPreview = preview.components.find(c => c.component === component);
    return componentPreview ? componentPreview.html : '';
  };

  if (!comparison) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-2 text-gray-600">Generating comparison...</span>
      </div>
    );
  }

  return (
    <div className="theme-comparison bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="comparison-header bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Theme Comparison</h3>
            <p className="text-emerald-100 mt-1">
              {comparison.differences.length} changes detected
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleDiscardChanges}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleApplyTheme}
              className="px-6 py-2 bg-white text-emerald-600 hover:bg-emerald-50 rounded-lg font-semibold transition-colors"
            >
              Apply Theme
            </button>
          </div>
        </div>
      </div>

      {/* Component Filter */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedComponent('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedComponent === 'all'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Components
          </button>
          {['hero', 'card', 'form', 'button', 'navigation'].map((component) => (
            <button
              key={component}
              onClick={() => setSelectedComponent(component)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                selectedComponent === component
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {component}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-side Preview */}
      <div className="comparison-content grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Current Theme */}
        <div className="comparison-side">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Current: {currentTheme.name}
            </h4>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
              LIVE
            </span>
          </div>
          
          <div className="preview-container border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="preview-content bg-gray-50 min-h-[400px] overflow-auto"
              dangerouslySetInnerHTML={{ 
                __html: getComponentPreview(currentTheme, selectedComponent)
              }}
            />
          </div>
        </div>

        {/* Modified Theme */}
        <div className="comparison-side">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Modified: {modifiedTheme.name}
            </h4>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
              PREVIEW
            </span>
          </div>
          
          <div className="preview-container border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="preview-content bg-gray-50 min-h-[400px] overflow-auto"
              dangerouslySetInnerHTML={{ 
                __html: getComponentPreview(modifiedTheme, selectedComponent)
              }}
            />
          </div>
        </div>
      </div>

      {/* Changes Summary */}
      {comparison.differences.length > 0 && (
        <div className="comparison-changes border-t border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            Changes Summary ({comparison.differences.length})
          </h4>
          
          <div className="max-h-60 overflow-y-auto">
            <ul className="changes-list space-y-2">
              {comparison.differences.map((diff, index) => (
                <li 
                  key={index}
                  className="change-item flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm text-gray-700 font-mono">{diff}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* No Changes Message */}
      {comparison.differences.length === 0 && (
        <div className="comparison-changes border-t border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-800 mb-2">No Changes Detected</h4>
            <p className="text-gray-600">The themes are identical.</p>
          </div>
        </div>
      )}

      {/* Embedded Styles */}
      <style jsx>{`
        .preview-content {
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .preview-content * {
          box-sizing: border-box;
        }
        
        .preview-content button {
          font-family: inherit;
        }
        
        .preview-content input,
        .preview-content select,
        .preview-content textarea {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}