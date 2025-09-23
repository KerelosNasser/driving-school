'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Palette, 
  Type, 
  Eye, 
  Save, 
  RotateCcw,
  Monitor,
  Smartphone,
  Tablet,
  Sparkles,
  Layers,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  ArrowLeftRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Theme } from '@/lib/theme/types';
import { useRealTimePreview, useThemeControl, useThemePresets } from '@/lib/theme/hooks/useRealTimePreview';
import { ColorPicker } from './ColorPicker';

interface RealTimeThemeCustomizerProps {
  initialTheme?: Theme | null;
  onThemeChange?: (theme: Theme) => void;
  onThemeApply?: (theme: Theme) => void;
  showLivePreview?: boolean;
  enableComparison?: boolean;
}

export function RealTimeThemeCustomizer({
  initialTheme,
  onThemeChange,
  onThemeApply,
  showLivePreview = true,
  enableComparison = true
}: RealTimeThemeCustomizerProps) {
  // Real-time preview hook
  const {
    activeTheme,
    currentDesignTheme,
    isPreviewActive,
    hasUnsavedChanges,
    initializePreview,
    updatePreview,
    resetToCurrentDesign,
    applyToLiveSite,
    createComparison,
    isDifferentFromCurrent,
    getThemeDifferences,
    previewContainerRef,
    controlsContainerRef
  } = useRealTimePreview({
    containerId: 'real-time-theme-preview',
    autoConnect: true,
    preserveCurrentDesign: true,
    enableSideBySideComparison: enableComparison
  });

  // Theme presets hook
  const { presets, loading: presetsLoading, savePreset } = useThemePresets();

  // Local state
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSection, setActiveSection] = useState('colors');
  const [isLivePreviewEnabled, setIsLivePreviewEnabled] = useState(showLivePreview);
  const [showComparison, setShowComparison] = useState(false);

  // Initialize with theme
  useEffect(() => {
    if (initialTheme && !isPreviewActive) {
      initializePreview(initialTheme);
    } else if (initialTheme && isPreviewActive) {
      updatePreview(initialTheme);
    }
  }, [initialTheme, isPreviewActive, initializePreview, updatePreview]);

  // Handle theme updates
  const handleThemeUpdate = useCallback((updatedTheme: Theme) => {
    if (isLivePreviewEnabled) {
      updatePreview(updatedTheme);
    }
    
    if (onThemeChange) {
      onThemeChange(updatedTheme);
    }
  }, [isLivePreviewEnabled, updatePreview, onThemeChange]);

  // Theme control hooks for different properties
  const primaryColorControl = useThemeControl<string>(
    activeTheme,
    'colors.primary.500',
    handleThemeUpdate
  );

  const secondaryColorControl = useThemeControl<string>(
    activeTheme,
    'colors.secondary.500',
    handleThemeUpdate
  );

  const accentColorControl = useThemeControl<string>(
    activeTheme,
    'colors.accent.500',
    handleThemeUpdate
  );

  // Apply theme to live site
  const handleApplyTheme = useCallback(async () => {
    if (!activeTheme) return;

    try {
      await applyToLiveSite(activeTheme);
      // Persist via helper so server-side ThemeContext GET will return the updated config
      try {
        const { default: persistThemeToServer } = await import('@/lib/theme/persist');
        const result = await persistThemeToServer(activeTheme);
        if (!result.ok) {
          // If server persist failed, surface an error to the admin
          const errText = await (result.text || Promise.resolve(''));
          console.warn('Server persist failed:', result.status, errText);
          toast.error('Theme applied locally but failed to persist to server');
          return;
        }
      } catch (err) {
        console.warn('Failed to persist theme via helper:', err);
        toast.error('Theme applied locally but failed to persist to server');
        return;
      }
      
      if (onThemeApply) {
        onThemeApply(activeTheme);
      }
      
      toast.success('Theme applied and persisted successfully!');
    } catch (error) {
      console.error('Failed to apply theme:', error);
      toast.error('Failed to apply theme');
    }
  }, [activeTheme, applyToLiveSite, onThemeApply]);

  // Reset to current design
  const handleReset = useCallback(() => {
    resetToCurrentDesign();
    toast.success('Reset to current design');
  }, [resetToCurrentDesign]);

  // Save as preset
  const handleSavePreset = useCallback(async () => {
    if (!activeTheme) return;

    try {
      const presetName = prompt('Enter preset name:', `${activeTheme.name} - Custom`);
      if (!presetName) return;

      const presetTheme: Theme = {
        ...activeTheme,
        id: `preset-${Date.now()}`,
        name: presetName,
        metadata: {
          ...activeTheme.metadata,
          name: presetName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [...activeTheme.metadata.tags, 'custom', 'preset']
        }
      };

      await savePreset(presetTheme);
      toast.success('Preset saved successfully!');
    } catch (error) {
      console.error('Failed to save preset:', error);
      toast.error('Failed to save preset');
    }
  }, [activeTheme, savePreset]);

  // Toggle comparison view
  const handleToggleComparison = useCallback(() => {
    if (!activeTheme || !currentDesignTheme) return;

    if (!showComparison) {
      createComparison(currentDesignTheme, activeTheme);
      setShowComparison(true);
    } else {
      setShowComparison(false);
    }
  }, [activeTheme, currentDesignTheme, createComparison, showComparison]);

  // Apply color preset
  const applyColorPreset = useCallback((preset: { primary: string; secondary: string; accent: string }) => {
    if (!activeTheme) return;

    const updatedTheme: Theme = {
      ...activeTheme,
      colors: {
        ...activeTheme.colors,
        primary: {
          ...activeTheme.colors.primary,
          500: preset.primary
        },
        secondary: {
          ...activeTheme.colors.secondary,
          500: preset.secondary
        },
        accent: {
          ...activeTheme.colors.accent,
          500: preset.accent
        }
      },
      metadata: {
        ...activeTheme.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    handleThemeUpdate(updatedTheme);
  }, [activeTheme, handleThemeUpdate]);

  // Color presets based on current design
  const colorPresets = [
    {
      name: 'Current Professional (Emerald/Teal)',
      primary: '#10b981',
      secondary: '#14b8a6',
      accent: '#f59e0b'
    },
    {
      name: 'Professional Blue',
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#f59e0b'
    },
    {
      name: 'Modern Purple',
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#06b6d4'
    },
    {
      name: 'Warm Orange',
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#8b5cf6'
    }
  ];

  if (!activeTheme) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing theme customizer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span>Real-Time Theme Customizer</span>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Customize your website's appearance with instant live preview
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Live Preview Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isLivePreviewEnabled}
                  onCheckedChange={setIsLivePreviewEnabled}
                />
                <Label className="text-sm">
                  {isLivePreviewEnabled ? (
                    <span className="flex items-center text-green-600">
                      <Play className="h-3 w-3 mr-1" />
                      Live Preview
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-500">
                      <Pause className="h-3 w-3 mr-1" />
                      Paused
                    </span>
                  )}
                </Label>
              </div>

              {/* Preview Mode Toggles */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                  className="px-2"
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                  className="px-2"
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                  className="px-2"
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              {/* Comparison Toggle */}
              {enableComparison && currentDesignTheme && isDifferentFromCurrent(activeTheme) && (
                <Button
                  variant="outline"
                  onClick={handleToggleComparison}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  <span>{showComparison ? 'Hide' : 'Show'} Comparison</span>
                </Button>
              )}
              
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>

              <Button variant="outline" onClick={handleSavePreset}>
                <Save className="h-4 w-4 mr-2" />
                Save Preset
              </Button>
              
              <Button 
                onClick={handleApplyTheme}
                disabled={!hasUnsavedChanges}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Apply Theme</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Customization Controls */}
            <div className="xl:col-span-1 space-y-6" ref={controlsContainerRef}>
              <Tabs value={activeSection} onValueChange={setActiveSection}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="colors" className="text-xs">
                    <Palette className="h-3 w-3 mr-1" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="gradients" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Gradients
                  </TabsTrigger>
                  <TabsTrigger value="effects" className="text-xs">
                    <Layers className="h-3 w-3 mr-1" />
                    Effects
                  </TabsTrigger>
                </TabsList>
                
                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Quick Color Presets</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {colorPresets.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          onClick={() => applyColorPreset(preset)}
                          className="h-auto p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex space-x-1">
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: preset.secondary }}
                              />
                              <div 
                                className="w-4 h-4 rounded-full border border-gray-200"
                                style={{ backgroundColor: preset.accent }}
                              />
                            </div>
                            <span className="text-sm font-medium">{preset.name}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Primary Colors</h3>
                    
                    {/* Primary Color */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={primaryColorControl.value || '#10b981'}
                          onChange={(e) => primaryColorControl.setValue(e.target.value)}
                          className="w-16 h-10 p-1 rounded"
                          data-theme-control="color"
                          data-theme-path="colors.primary.500"
                        />
                        <Input
                          type="text"
                          value={primaryColorControl.value || '#10b981'}
                          onChange={(e) => primaryColorControl.setValue(e.target.value)}
                          className="flex-1 font-mono text-sm"
                          placeholder="#10b981"
                        />
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={secondaryColorControl.value || '#14b8a6'}
                          onChange={(e) => secondaryColorControl.setValue(e.target.value)}
                          className="w-16 h-10 p-1 rounded"
                          data-theme-control="color"
                          data-theme-path="colors.secondary.500"
                        />
                        <Input
                          type="text"
                          value={secondaryColorControl.value || '#14b8a6'}
                          onChange={(e) => secondaryColorControl.setValue(e.target.value)}
                          className="flex-1 font-mono text-sm"
                          placeholder="#14b8a6"
                        />
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Accent Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={accentColorControl.value || '#f59e0b'}
                          onChange={(e) => accentColorControl.setValue(e.target.value)}
                          className="w-16 h-10 p-1 rounded"
                          data-theme-control="color"
                          data-theme-path="colors.accent.500"
                        />
                        <Input
                          type="text"
                          value={accentColorControl.value || '#f59e0b'}
                          onChange={(e) => accentColorControl.setValue(e.target.value)}
                          className="flex-1 font-mono text-sm"
                          placeholder="#f59e0b"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Gradients Tab */}
                <TabsContent value="gradients" className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Gradient controls coming soon...</p>
                    <p className="text-sm">Use color controls to see gradient updates</p>
                  </div>
                </TabsContent>

                {/* Effects Tab */}
                <TabsContent value="effects" className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Effect controls coming soon...</p>
                    <p className="text-sm">Shadows, blur, and radius controls</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Preview Area */}
            <div className="xl:col-span-3">
              <div className="space-y-4">
                {/* Preview Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-800">Live Preview</span>
                    {isLivePreviewEnabled && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        LIVE
                      </Badge>
                    )}
                  </div>
                  
                  {hasUnsavedChanges && (
                    <div className="text-sm text-orange-600">
                      {getThemeDifferences(currentDesignTheme!, activeTheme).length} changes
                    </div>
                  )}
                </div>

                {/* Preview Container */}
                <div 
                  ref={previewContainerRef}
                  className={`preview-wrapper border border-gray-200 rounded-lg overflow-hidden ${
                    previewMode === 'mobile' ? 'max-w-sm mx-auto' :
                    previewMode === 'tablet' ? 'max-w-2xl mx-auto' :
                    'w-full'
                  }`}
                  style={{
                    minHeight: '600px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div id="real-time-theme-preview" className="w-full h-full">
                    {/* Preview content will be injected here by the real-time preview system */}
                  </div>
                </div>

                {/* Comparison Container */}
                {showComparison && (
                  <div className="mt-6">
                    <div id="real-time-theme-preview-comparison" className="w-full">
                      {/* Comparison content will be injected here */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Information */}
      {activeTheme && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Theme Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Theme Name:</span>
                <span className="ml-2 text-gray-600">{activeTheme.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Version:</span>
                <span className="ml-2 text-gray-600">{activeTheme.metadata.version}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(activeTheme.metadata.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
            
            {hasUnsavedChanges && currentDesignTheme && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Pending Changes:</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  {getThemeDifferences(currentDesignTheme, activeTheme).slice(0, 5).map((diff, index) => (
                    <li key={index} className="font-mono text-xs">• {diff}</li>
                  ))}
                  {getThemeDifferences(currentDesignTheme, activeTheme).length > 5 && (
                    <li className="text-orange-600">
                      ... and {getThemeDifferences(currentDesignTheme, activeTheme).length - 5} more changes
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}