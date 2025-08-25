// LivePreviewPanel - Enhanced real-time preview with responsive testing
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Eye, 
  ExternalLink,
  RefreshCw,
  Settings,
  Grid3X3,
  Maximize2
} from 'lucide-react';
import type { Page } from '@/lib/types/pages';

interface LivePreviewPanelProps {
  page: Page;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  onPreviewModeChange: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  showGrid?: boolean;
  onShowGridChange?: (show: boolean) => void;
}

export function LivePreviewPanel({ 
  page, 
  previewMode, 
  onPreviewModeChange,
  showGrid = false,
  onShowGridChange
}: LivePreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '667px', className: 'max-w-sm' };
      case 'tablet':
        return { width: '768px', height: '1024px', className: 'max-w-2xl' };
      default:
        return { width: '100%', height: 'auto', className: 'w-full' };
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleExternalPreview = () => {
    if (page.status === 'published') {
      window.open(`/${page.slug}`, '_blank');
    }
  };

  const dimensions = getPreviewDimensions();

  const renderPageContent = () => {
    return (
      <div className="space-y-6">
        {page.content?.blocks && page.content.blocks.length > 0 ? (
          page.content?.blocks.map((block, index) => {
            switch (block.type) {
              case 'hero':
                return (
                  <div 
                    key={block.id || index}
                    className="text-center py-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
                    style={block.styles}
                  >
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">
                      {block.props.title || 'Hero Title'}
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                      {block.props.subtitle || 'Hero subtitle goes here'}
                    </p>
                    {block.props.buttonText && (
                      <button className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        {block.props.buttonText}
                      </button>
                    )}
                  </div>
                );
              
              case 'text':
                return (
                  <div 
                    key={block.id || index}
                    className={`prose prose-lg max-w-none ${
                      block.props.textAlign === 'center' ? 'text-center' :
                      block.props.textAlign === 'right' ? 'text-right' : ''
                    }`}
                    style={block.styles}
                    dangerouslySetInnerHTML={{ 
                      __html: block.props.content || '<p>Text content goes here...</p>' 
                    }}
                  />
                );
              
              case 'image':
                return (
                  <div 
                    key={block.id || index}
                    className={`${
                      block.props.alignment === 'center' ? 'text-center' :
                      block.props.alignment === 'right' ? 'text-right' : ''
                    }`}
                    style={block.styles}
                  >
                    {block.props.src ? (
                      <div>
                        <img 
                          src={block.props.src} 
                          alt={block.props.alt || ''} 
                          className="max-w-full h-auto rounded-lg"
                          style={{ width: block.props.width || '100%' }}
                        />
                        {block.props.caption && (
                          <p className="text-sm text-gray-600 mt-3">{block.props.caption}</p>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <img className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500">Image placeholder</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              
              case 'columns':
                return (
                  <div 
                    key={block.id || index}
                    className="grid grid-cols-1 md:grid-cols-2"
                    style={{ 
                      gap: block.props.gap || '40px',
                      ...block.styles 
                    }}
                  >
                    <div 
                      className="prose prose-lg"
                      dangerouslySetInnerHTML={{ 
                        __html: block.props.leftContent || '<p>Left column content...</p>' 
                      }}
                    />
                    <div 
                      className="prose prose-lg"
                      dangerouslySetInnerHTML={{ 
                        __html: block.props.rightContent || '<p>Right column content...</p>' 
                      }}
                    />
                  </div>
                );
              
              case 'cta':
                return (
                  <div 
                    key={block.id || index}
                    className="text-center py-16 text-white rounded-lg"
                    style={{ 
                      backgroundColor: block.props.backgroundColor || '#3b82f6',
                      ...block.styles 
                    }}
                  >
                    <h2 className="text-3xl font-bold mb-6">
                      {block.props.title || 'Call to Action'}
                    </h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto">
                      {block.props.description || 'Your compelling message here'}
                    </p>
                    {block.props.buttonText && (
                      <button className="inline-flex items-center px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        {block.props.buttonText}
                      </button>
                    )}
                  </div>
                );
              
              default:
                return (
                  <div key={block.id || index} className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{block.type} Block</p>
                    <p className="text-xs">Custom block preview</p>
                  </div>
                );
            }
          })
        ) : (
          <div className="text-center py-16 text-gray-500">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No content to preview</h3>
              <p className="text-sm">Add some blocks to see your page come to life.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-full ${isFullscreen ? 'fixed inset-0 bg-white z-50' : ''}`}>
      {/* Preview Header */}
      <div className="border-b border-gray-200 px-4 py-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Eye className="h-3 w-3 mr-1" />
              Live Preview
            </Badge>
            <span className="text-sm text-gray-500">{page.title}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Device Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPreviewModeChange('desktop')}
                className="px-2"
                title="Desktop View"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPreviewModeChange('tablet')}
                className="px-2"
                title="Tablet View"
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPreviewModeChange('mobile')}
                className="px-2"
                title="Mobile View"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Tools */}
            {onShowGridChange && (
              <Button
                variant={showGrid ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onShowGridChange(!showGrid)}
                title="Toggle Grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh Preview"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            {page.status === 'published' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExternalPreview}
                title="Open in New Tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title="Toggle Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Dimensions Info */}
        <div className="flex items-center justify-center mt-2">
          <Badge variant="secondary" className="text-xs">
            {previewMode === 'desktop' ? 'Desktop (100%)' : 
             previewMode === 'tablet' ? 'Tablet (768px)' : 
             'Mobile (375px)'}
          </Badge>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-gray-100 p-6 overflow-auto">
        <div className={`mx-auto bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${dimensions.className}`}>
          {showGrid && (
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: 'linear-gradient(rgba(0,0,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />
          )}
          
          <div className="p-8 relative">
            {renderPageContent()}
          </div>
        </div>
      </div>
      
      {isFullscreen && (
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="bg-white"
          >
            Exit Fullscreen
          </Button>
        </div>
      )}
    </div>
  );
}