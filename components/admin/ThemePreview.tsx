'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Theme, PreviewData, ComponentPreview } from '@/lib/theme/types';
import { previewSystem } from '@/lib/theme/preview';

interface ThemePreviewProps {
  theme: Theme;
  className?: string;
  showControls?: boolean;
  selectedComponent?: string;
  onComponentSelect?: (component: string) => void;
}

export default function ThemePreview({
  theme,
  className = '',
  showControls = true,
  selectedComponent = 'all',
  onComponentSelect
}: ThemePreviewProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement>(null);

  // Generate preview data when theme changes
  useEffect(() => {
    try {
      setLoading(true);
      setError(null);
      
      const preview = previewSystem.generatePreview(theme);
      setPreviewData(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  }, [theme]);

  // Update preview styles when preview data changes
  useEffect(() => {
    if (previewData && styleRef.current) {
      styleRef.current.textContent = previewData.css;
    }
  }, [previewData]);

  const handleComponentSelect = (component: string) => {
    if (onComponentSelect) {
      onComponentSelect(component);
    }
  };

  const getPreviewContent = () => {
    if (!previewData) return '';
    
    if (selectedComponent === 'all') {
      return previewData.html;
    }
    
    const component = previewData.components.find(c => c.component === selectedComponent);
    return component ? component.html : '';
  };

  const getPreviewStyles = () => {
    if (!previewData) return '';
    
    if (selectedComponent === 'all') {
      return previewData.css;
    }
    
    const component = previewData.components.find(c => c.component === selectedComponent);
    if (!component) return '';
    
    // Include base styles plus component-specific styles
    const baseStyles = `
      .theme-preview-container {
        font-family: ${theme.typography.fontFamily.sans.join(', ')};
        line-height: ${theme.typography.lineHeight.normal};
        color: ${theme.colors.neutral[900]};
        background: linear-gradient(135deg, ${theme.colors.neutral[50]}, ${theme.colors.primary[50]});
        min-height: 400px;
        padding: 2rem;
      }
      
      * {
        box-sizing: border-box;
      }
      
      button {
        font-family: inherit;
      }
      
      input, select, textarea {
        font-family: inherit;
      }
    `;
    
    return baseStyles + '\n' + component.styles;
  };

  if (loading) {
    return (
      <div className={`theme-preview-loading ${className}`}>
        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600">Generating preview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`theme-preview-error ${className}`}>
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold">Preview Error</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`theme-preview ${className}`}>
      {/* Component Controls */}
      {showControls && (
        <div className="preview-controls mb-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Preview: {theme.name}
            </h3>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
              SAFE PREVIEW
            </span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleComponentSelect('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedComponent === 'all'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              All Components
            </button>
            
            {previewData?.components.map((component) => (
              <button
                key={component.component}
                onClick={() => handleComponentSelect(component.component)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  selectedComponent === component.component
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                }`}
              >
                {component.component}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className="preview-container bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="preview-header bg-gray-50 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="ml-2 text-sm text-gray-500 font-mono">
              {selectedComponent === 'all' ? 'Full Preview' : `${selectedComponent} Component`}
            </span>
          </div>
        </div>
        
        <div 
          ref={previewRef}
          className="preview-content overflow-auto"
          style={{ 
            minHeight: selectedComponent === 'all' ? '600px' : '400px',
            maxHeight: '800px'
          }}
        >
          {/* Inject styles */}
          <style ref={styleRef}>
            {getPreviewStyles()}
          </style>
          
          {/* Render preview content */}
          <div 
            dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
          />
        </div>
      </div>

      {/* Preview Info */}
      {showControls && previewData && (
        <div className="preview-info mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Components:</span>
              <span className="ml-2 text-gray-600">{previewData.components.length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Theme Version:</span>
              <span className="ml-2 text-gray-600">{theme.metadata.version}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Last Updated:</span>
              <span className="ml-2 text-gray-600">
                {new Date(theme.metadata.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}