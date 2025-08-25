'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  Save, 
  RotateCcw,
  Monitor,
  Smartphone,
  Tablet,
  Sun,
  Moon,
  Settings,
  Code,
  Brush
} from 'lucide-react';
import { toast } from 'sonner';

// Theme configuration types
interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  destructive: string;
  border: string;
  ring: string;
}

interface ThemeTypography {
  fontFamily: string;
  headingFontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  lineHeight: number;
  letterSpacing: number;
}

interface ThemeLayout {
  containerMaxWidth: string;
  borderRadius: number;
  spacing: number;
  headerHeight: number;
  footerHeight: number;
  sidebarWidth: number;
}

interface ThemeConfig {
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  darkMode: boolean;
  customCss: string;
}

interface ThemeCustomizerProps {
  initialConfig?: ThemeConfig | null;
  onPreview?: (config: ThemeConfig) => void;
  onSave?: (config: ThemeConfig) => void;
}

export function ThemeCustomizer({ initialConfig, onPreview, onSave }: ThemeCustomizerProps) {
  const [config, setConfig] = useState<ThemeConfig>(initialConfig || {
    colors: {
      primary: '#EDE513',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      foreground: '#020817',
      muted: '#f1f5f9',
      destructive: '#ef4444',
      border: '#e2e8f0',
      ring: '#EDE513'
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      headingFontFamily: 'Inter, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      lineHeight: 1.5,
      letterSpacing: 0
    },
    layout: {
      containerMaxWidth: '1200px',
      borderRadius: 8,
      spacing: 16,
      headerHeight: 80,
      footerHeight: 120,
      sidebarWidth: 280
    },
    darkMode: false,
    customCss: ''
  });
  
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSection, setActiveSection] = useState('colors');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update config when initialConfig changes
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setHasUnsavedChanges(false);
    }
  }, [initialConfig]);

  // Available font options
  const fontOptions = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Playfair Display', value: '"Playfair Display", serif' },
    { name: 'Merriweather', value: 'Merriweather, serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' }
  ];

  // Color presets - updated with your brand colors
  const colorPresets = [
    {
      name: 'EG Yellow (Current)',
      colors: {
        primary: '#EDE513',
        secondary: '#64748b',
        accent: '#f59e0b'
      }
    },
    {
      name: 'Professional Blue',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#f59e0b'
      }
    },
    {
      name: 'Modern Purple',
      colors: {
        primary: '#8b5cf6',
        secondary: '#64748b',
        accent: '#06b6d4'
      }
    },
    {
      name: 'Fresh Green',
      colors: {
        primary: '#10b981',
        secondary: '#64748b',
        accent: '#f59e0b'
      }
    },
    {
      name: 'Vibrant Orange',
      colors: {
        primary: '#f97316',
        secondary: '#64748b',
        accent: '#8b5cf6'
      }
    }
  ];

  // Update config and mark as unsaved
  const updateConfig = useCallback((updates: Partial<ThemeConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      if (onPreview) {
        onPreview(newConfig);
      }
      return newConfig;
    });
    setHasUnsavedChanges(true);
  }, [onPreview]);

  // Update nested config
  const updateNestedConfig = useCallback((section: keyof ThemeConfig, updates: Record<string, any>) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [section]: { ...(prev[section] as Record<string, any>), ...updates }
      };
      if (onPreview) {
        onPreview(newConfig);
      }
      return newConfig;
    });
    setHasUnsavedChanges(true);
  }, [onPreview]);

  // Apply color preset
  const applyColorPreset = useCallback((preset: typeof colorPresets[0]) => {
    updateNestedConfig('colors', preset.colors);
    toast.success(`Applied ${preset.name} color scheme`);
  }, [updateNestedConfig]);

  // Save theme
  const saveTheme = useCallback(async () => {
    try {
      if (onSave) {
        await onSave(config);
      }
      setHasUnsavedChanges(false);
      toast.success('Theme saved successfully');
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('Failed to save theme');
    }
  }, [config, onSave]);

  // Reset to defaults - using your brand colors
  const resetToDefaults = useCallback(() => {
    const defaultConfig = {
      colors: {
        primary: '#EDE513',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        foreground: '#020817',
        muted: '#f1f5f9',
        destructive: '#ef4444',
        border: '#e2e8f0',
        ring: '#EDE513'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        headingFontFamily: 'Inter, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        },
        lineHeight: 1.5,
        letterSpacing: 0
      },
      layout: {
        containerMaxWidth: '1200px',
        borderRadius: 8,
        spacing: 16,
        headerHeight: 80,
        footerHeight: 120,
        sidebarWidth: 280
      },
      darkMode: false,
      customCss: ''
    };
    
    setConfig(defaultConfig);
    setHasUnsavedChanges(true);
    toast.success('Reset to default theme');
  }, []);

  // Generate CSS variables
  const generateCSSVariables = useCallback(() => {
    return `
:root {
  --primary: ${config.colors.primary};
  --secondary: ${config.colors.secondary};
  --accent: ${config.colors.accent};
  --background: ${config.colors.background};
  --foreground: ${config.colors.foreground};
  --muted: ${config.colors.muted};
  --destructive: ${config.colors.destructive};
  --border: ${config.colors.border};
  --ring: ${config.colors.ring};
  
  --font-family: ${config.typography.fontFamily};
  --heading-font-family: ${config.typography.headingFontFamily};
  --line-height: ${config.typography.lineHeight};
  --letter-spacing: ${config.typography.letterSpacing}em;
  
  --container-max-width: ${config.layout.containerMaxWidth};
  --border-radius: ${config.layout.borderRadius}px;
  --spacing: ${config.layout.spacing}px;
  --header-height: ${config.layout.headerHeight}px;
  --footer-height: ${config.layout.footerHeight}px;
  --sidebar-width: ${config.layout.sidebarWidth}px;
}

${config.customCss}
    `.trim();
  }, [config]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brush className="h-5 w-5" />
                <span>Theme Customizer</span>
              </CardTitle>
              <CardDescription>
                Customize your website's appearance with live preview
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Preview mode toggles */}
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
              
              <Button variant="outline" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              
              <Button 
                onClick={saveTheme}
                disabled={!hasUnsavedChanges}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Theme</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customization Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Tabs value={activeSection} onValueChange={setActiveSection}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="colors" className="text-xs">
                    <Palette className="h-3 w-3" />
                  </TabsTrigger>
                  <TabsTrigger value="typography" className="text-xs">
                    <Type className="h-3 w-3" />
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="text-xs">
                    <Layout className="h-3 w-3" />
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="text-xs">
                    <Settings className="h-3 w-3" />
                  </TabsTrigger>
                </TabsList>
                
                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Color Presets</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {colorPresets.map((preset) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          onClick={() => applyColorPreset(preset)}
                          className="h-auto p-3 flex flex-col items-start"
                        >
                          <div className="flex space-x-1 mb-1">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: preset.colors.primary }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: preset.colors.secondary }}
                            />
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: preset.colors.accent }}
                            />
                          </div>
                          <span className="text-xs">{preset.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">Custom Colors</h3>
                    
                    {Object.entries(config.colors).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-sm capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input
                            type="color"
                            value={value}
                            onChange={(e) => updateNestedConfig('colors', { [key]: e.target.value })}
                            className="w-12 h-8 p-1 rounded"
                          />
                          <Input
                            type="text"
                            value={value}
                            onChange={(e) => updateNestedConfig('colors', { [key]: e.target.value })}
                            className="flex-1 text-xs font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.darkMode}
                      onCheckedChange={(checked) => updateConfig({ darkMode: checked })}
                    />
                    <Label className="flex items-center space-x-2">
                      {config.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      <span>Dark Mode</span>
                    </Label>
                  </div>
                </TabsContent>
                
                {/* Typography Tab */}
                <TabsContent value="typography" className="space-y-4">
                  <div>
                    <Label>Font Family</Label>
                    <select
                      value={config.typography.fontFamily}
                      onChange={(e) => updateNestedConfig('typography', { fontFamily: e.target.value })}
                      className="w-full p-2 border rounded mt-1"
                    >
                      {fontOptions.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label>Heading Font Family</Label>
                    <select
                      value={config.typography.headingFontFamily}
                      onChange={(e) => updateNestedConfig('typography', { headingFontFamily: e.target.value })}
                      className="w-full p-2 border rounded mt-1"
                    >
                      {fontOptions.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label>Line Height: {config.typography.lineHeight}</Label>
                    <Slider
                      value={[config.typography.lineHeight]}
                      onValueChange={([value]) => updateNestedConfig('typography', { lineHeight: value })}
                      min={1}
                      max={2}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Letter Spacing: {config.typography.letterSpacing}em</Label>
                    <Slider
                      value={[config.typography.letterSpacing]}
                      onValueChange={([value]) => updateNestedConfig('typography', { letterSpacing: value })}
                      min={-0.1}
                      max={0.1}
                      step={0.01}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>
                
                {/* Layout Tab */}
                <TabsContent value="layout" className="space-y-4">
                  <div>
                    <Label>Container Max Width</Label>
                    <Input
                      value={config.layout.containerMaxWidth}
                      onChange={(e) => updateNestedConfig('layout', { containerMaxWidth: e.target.value })}
                      placeholder="1200px"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Border Radius: {config.layout.borderRadius}px</Label>
                    <Slider
                      value={[config.layout.borderRadius]}
                      onValueChange={([value]) => updateNestedConfig('layout', { borderRadius: value })}
                      min={0}
                      max={20}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Spacing: {config.layout.spacing}px</Label>
                    <Slider
                      value={[config.layout.spacing]}
                      onValueChange={([value]) => updateNestedConfig('layout', { spacing: value })}
                      min={8}
                      max={32}
                      step={2}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label>Header Height: {config.layout.headerHeight}px</Label>
                    <Slider
                      value={[config.layout.headerHeight]}
                      onValueChange={([value]) => updateNestedConfig('layout', { headerHeight: value })}
                      min={60}
                      max={120}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>
                
                {/* Advanced Tab */}
                <TabsContent value="advanced" className="space-y-4">
                  <div>
                    <Label>Custom CSS</Label>
                    <textarea
                      value={config.customCss}
                      onChange={(e) => updateConfig({ customCss: e.target.value })}
                      placeholder="/* Add your custom CSS here */"
                      className="w-full h-32 p-2 border rounded mt-1 font-mono text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label>Generated CSS Variables</Label>
                    <pre className="text-xs bg-gray-100 p-3 rounded mt-1 overflow-auto max-h-40">
                      {generateCSSVariables()}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generateCSSVariables());
                        toast.success('CSS variables copied to clipboard');
                      }}
                      className="mt-2"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Copy CSS
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Live Preview */}
            <div className="lg:col-span-2">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 p-3 border-b">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Live Preview</span>
                    <Badge variant="outline" className="text-xs">
                      {previewMode}
                    </Badge>
                  </div>
                </div>
                
                <div 
                  className={`bg-white transition-all duration-300 ${
                    previewMode === 'mobile' ? 'max-w-sm mx-auto' :
                    previewMode === 'tablet' ? 'max-w-2xl mx-auto' : 'w-full'
                  }`}
                  style={{
                    fontFamily: config.typography.fontFamily,
                    lineHeight: config.typography.lineHeight,
                    letterSpacing: `${config.typography.letterSpacing}em`
                  }}
                >
                  {/* Preview content with applied theme */}
                  <div 
                    className="p-6 min-h-96"
                    style={{
                      backgroundColor: config.colors.background,
                      color: config.colors.foreground
                    }}
                  >
                    <div 
                      className="p-4 rounded mb-4"
                      style={{ 
                        backgroundColor: config.colors.primary,
                        color: 'white',
                        borderRadius: `${config.layout.borderRadius}px`
                      }}
                    >
                      <h1 
                        className="text-2xl font-bold mb-2"
                        style={{ fontFamily: config.typography.headingFontFamily }}
                      >
                        EG Driving School
                      </h1>
                      <p>Professional driving lessons in Brisbane</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div 
                        className="p-4 rounded"
                        style={{ 
                          backgroundColor: config.colors.muted,
                          borderRadius: `${config.layout.borderRadius}px`
                        }}
                      >
                        <h2 
                          className="text-xl font-semibold mb-2"
                          style={{ 
                            fontFamily: config.typography.headingFontFamily,
                            color: config.colors.primary
                          }}
                        >
                          Our Services
                        </h2>
                        <p className="text-sm">
                          We offer comprehensive driving lessons for all skill levels.
                        </p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          className="px-4 py-2 rounded text-white"
                          style={{ 
                            backgroundColor: config.colors.primary,
                            borderRadius: `${config.layout.borderRadius}px`
                          }}
                        >
                          Book Now
                        </button>
                        <button
                          className="px-4 py-2 rounded"
                          style={{ 
                            backgroundColor: config.colors.secondary,
                            color: 'white',
                            borderRadius: `${config.layout.borderRadius}px`
                          }}
                        >
                          Learn More
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}